// Integration tests exercise real SQLite foreign keys and the same API deployed to the Worker.
import test from 'node:test'; // Use Node's built-in runner through the documented tsx test command.
import assert from 'node:assert/strict'; // Make authorization and scoring failures explicit.
import { readFileSync } from 'node:fs'; // Load the real migration instead of recreating test-only tables.
import { handleApi, topicMastered, defaultSettings } from '../server/api'; // Test production handlers and mastery logic directly.
import { sqliteDatabase } from '../server/local'; // Exercise a real relational database in memory.
import type { Environment, Database } from '../server/db'; // Share the production runtime contract.
import { topics } from '../content/index'; // Use real curriculum questions and foreign-key identifiers.
import type { Attempt, QuizResult, Topic } from '../shared/types'; // Keep test evidence aligned with the application contract.
const origin = 'https://corelab.test'; // Use HTTPS so secure cookie behavior can be verified.
const schema = readFileSync(new URL('../drizzle/0000_initial.sql', import.meta.url), 'utf8'); // Test the actual hosted schema migration.
function fixture(): { env: Environment; db: Database & { close(): void } } { // Give each test an isolated real database.
    const db = sqliteDatabase() as Database & { migrate(sql: string): void; close(): void }; // Keep state out of the user's persistent preview database.
    db.migrate(schema); // Apply the same schema and constraints used by hosted D1.
    return { env: { DB: db, DEVELOPMENT: 'true' }, db }; // Explicitly enable development-only reset-link inspection in tests.
} // Finish fixture creation.
async function request(env: Environment, path: string, method = 'GET', payload?: unknown, cookie = ''): Promise<{ status: number; data: any; error: any; cookie: string; response: Response }> { // Build realistic same-origin cookie-bearing requests.
    const response = await handleApi(new Request(`${origin}${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(payload || {}) } : {}) }), env); // Exercise the real Fetch-standard API boundary.
    const result = await response.json() as { data?: unknown; error?: unknown }; // Decode the documented success or error envelope.
    return { status: response.status, data: result.data, error: result.error, cookie: response.headers.get('set-cookie')?.split(';')[0] || cookie, response }; // Retain cookies to simulate persistent browser sessions.
} // Finish the request helper.
async function register(env: Environment, name = 'Learner', email = 'learner@example.com'): Promise<string> { // Create a real independently owned account for a test.
    const result = await request(env, '/api/auth/register', 'POST', { name, email, password: 'a-strong-study-password' }); // Use a compliant password rather than bypassing authentication setup.
    assert.equal(result.status, 201, result.error?.message); // Fail immediately when account creation does not work.
    assert.match(result.response.headers.get('set-cookie') || '', /HttpOnly.*SameSite=Lax.*Secure/); // Require secure JavaScript-inaccessible hosted cookies.
    return result.cookie; // Continue the test with this authenticated browser session.
} // Finish test registration.
test('accounts use hashed passwords, persistent sessions, isolated records, and logout revocation', async () => { // Verify the authentication and ownership success criteria together.
    const { env, db } = fixture(); // Start with an isolated migrated database.
    const anonymous = await request(env, '/api/workspace'); // Try reading private data without authentication.
    assert.equal(anonymous.status, 401); // Protected workspace access must reject anonymous clients.
    const first = await register(env); // Create the first independent learner.
    const second = await register(env, 'Second Learner', 'second@example.com'); // Create a separate user rather than reusing an identity.
    const stored = await db.prepare('SELECT password_hash FROM users WHERE email = ?').bind('learner@example.com').first<{ password_hash: string }>(); // Inspect credential storage directly.
    assert.match(stored!.password_hash, /^pbkdf2-sha256\$100000\$/); // Require a versioned salted derived hash.
    assert.ok(!stored!.password_hash.includes('a-strong-study-password')); // Ensure a plaintext password never reaches the database.
    const saved = await request(env, '/api/bookmarks', 'POST', { topicId: topics[0].id, userId: 'ignored-attacker-id' }, first); // Attempt to inject an owner while creating a legitimate bookmark.
    assert.equal(saved.status, 201); // The legitimate user-owned operation should still succeed.
    const firstState = await request(env, '/api/workspace', 'GET', undefined, first); // Load the first user's private state.
    const secondState = await request(env, '/api/workspace', 'GET', undefined, second); // Load a separately authenticated user's state.
    assert.deepEqual(firstState.data.bookmarks, [topics[0].id]); // The bookmark must belong to the session owner.
    assert.deepEqual(secondState.data.bookmarks, []); // A second learner must not inherit the first user's saved content.
    const logout = await request(env, '/api/auth/logout', 'POST', {}, first); // Revoke only the first browser's session.
    assert.equal(logout.status, 200); // Logout should succeed with an active session.
    assert.equal((await request(env, '/api/workspace', 'GET', undefined, first)).status, 401); // A copied old cookie must no longer authenticate.
    assert.equal((await request(env, '/api/workspace', 'GET', undefined, second)).status, 200); // Logout must leave other users unaffected.
    db.close(); // Release the real database handle.
}); // Finish authentication and isolation coverage.
test('checkpoint answers are scored on the server and all attempts are retained', async () => { // Verify checkpoint integrity and descriptive-answer semantics.
    const { env, db } = fixture(); // Start with a real isolated schema.
    const cookie = await register(env); // Authenticate through the public account workflow.
    const topic = topics.find(item => item.questions.some(question => question.type === 'mcq'))!; // Pick a real automatically scored lesson.
    const question = topic.questions.find(item => item.type === 'mcq')!; // Read its known reference answer for an intentional wrong/correct sequence.
    const wrong = await request(env, `/api/checkpoints/${question.id}/attempt`, 'POST', { topicId: topic.id, answer: 'Deliberately incorrect', correct: true }, cookie); // Attempt to forge MCQ correctness in the payload.
    assert.equal(wrong.status, 201); // Preserve the submitted attempt even when incorrect.
    assert.equal(wrong.data.attempt.correct, false); // The server must ignore client-claimed MCQ correctness.
    const right = await request(env, `/api/checkpoints/${question.id}/attempt`, 'POST', { topicId: topic.id, answer: question.answer, correct: false }, cookie); // Submit the canonical correct answer with a contradictory client flag.
    assert.equal(right.data.attempt.correct, true); // The reference answer must determine MCQ scoring.
    const history = await request(env, `/api/checkpoints/${question.id}/history`, 'GET', undefined, cookie); // Read the owner's full attempt history.
    assert.equal(history.data.length, 2); // A later answer must not overwrite the previous attempt.
    const descriptiveTopic = topics.find(item => item.questions.some(item => item.type !== 'mcq')); // Find a real self-reviewed checkpoint if the curriculum has one.
    if (descriptiveTopic) { // Verify no automatic grading is applied to free text.
        const descriptive = descriptiveTopic.questions.find(item => item.type !== 'mcq')!; // Select the descriptive or SQL checkpoint.
        const submitted = await request(env, `/api/checkpoints/${descriptive.id}/attempt`, 'POST', { topicId: descriptiveTopic.id, answer: 'An answer to compare with the reference.' }, cookie); // Submit without explicitly rating correctness.
        assert.equal(submitted.data.attempt.correct, null); // Submission alone must remain ungraded.
    } // Finish optional descriptive content coverage.
    assert.equal((await request(env, `/api/progress/topics/${topic.id}`, 'POST', { status: 'Mastered' }, cookie)).status, 400); // A manual status update must never grant mastery.
    db.close(); // Release the test database.
}); // Finish checkpoint evidence coverage.
test('server-selected quizzes count missing answers, reject duplicates, and retain retry-safe results', async () => { // Verify the assessment flow cannot trust a client-provided score.
    const { env, db } = fixture(); // Isolate assessment records and their constraints.
    const cookie = await register(env); // Create a real assessment owner.
    const started = await request(env, '/api/quizzes/start', 'POST', { subjectId: 'all', count: 4 }, cookie); // Start a server-selected mixed assessment.
    assert.equal(started.status, 201); // Require the assessment definition to persist successfully.
    assert.equal(started.data.questions.length, 4); // Respect the requested bounded assessment length.
    assert.ok(started.data.questions.every((question: { answer: string }) => question.answer === '')); // Withhold answer feedback until the submission result.
    const selected = started.data.questions[0]; // Intentionally answer only the first question.
    const canonical = topics.find(topic => topic.id === selected.topicId)!.questions.find(question => question.id === selected.id)!; // Obtain the real answer from the test's curriculum fixture.
    const answers = [{ topicId: selected.topicId, questionId: selected.id, answer: canonical.answer }]; // Leave three questions unanswered to test denominator integrity.
    const result = await request(env, '/api/quizzes/submit', 'POST', { quizId: started.data.id, subjectId: 'all', answers, score: 100, seconds: 999999 }, cookie); // Attempt to inflate score and elapsed time in the payload.
    assert.equal(result.status, 201); // Save a legitimate partial submission as a completed result.
    assert.equal(result.data.total, 4); // Keep the original server inventory as the denominator.
    assert.equal(result.data.correct, 1); // Count only the truly correct submitted answer.
    assert.equal(result.data.score, 25); // Calculate accuracy independently from the injected score.
    const retry = await request(env, '/api/quizzes/submit', 'POST', { quizId: started.data.id, answers }, cookie); // Replay the exact same network action.
    assert.equal(retry.data.id, result.data.id); // Return the existing result rather than saving duplicate history.
    const duplicate = await request(env, '/api/quizzes/submit', 'POST', { subjectId: 'all', answers: [answers[0], answers[0]] }, cookie); // Try inflating a practice score with the same question twice.
    assert.equal(duplicate.status, 400); // Reject duplicate question identifiers before scoring.
    db.close(); // Release the real database handle.
}); // Finish assessment integrity coverage.
test('foreign-key failures roll back related writes and cross-site mutations are rejected', async () => { // Test data relationships and CSRF guards with real infrastructure.
    const { env, db } = fixture(); // Start from an isolated real relational schema.
    await request(env, '/api/curriculum'); // Seed the shared foreign-key targets through the normal API.
    await assert.rejects(db.batch([db.prepare('INSERT INTO subjects (id, data) VALUES (?, ?)').bind('rollback-test', '{}'), db.prepare('INSERT INTO bookmarks (user_id, topic_id, created_at) VALUES (?, ?, ?)').bind('missing-user', topics[0].id, new Date().toISOString())])); // Force a second-statement foreign-key failure inside one batch.
    assert.equal(await db.prepare('SELECT id FROM subjects WHERE id = ?').bind('rollback-test').first(), null); // Verify the first related write was rolled back too.
    const attacked = await handleApi(new Request(`${origin}/api/auth/register`, { method: 'POST', headers: { Origin: 'https://attacker.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Attacker', email: 'attack@example.com', password: 'attacker-password' }) }), env); // Simulate a hostile cross-origin account mutation.
    assert.equal(attacked.status, 403); // Reject the request before database mutation.
    db.close(); // Release the isolated database.
}); // Finish relational and origin protections.
test('mastery requires graded checkpoint evidence at every level plus a sufficient topic assessment', () => { // Verify the business rule without depending on a particular seed question count.
    const topic = { id: 'mastery-test', questions: ['Easy', 'Medium', 'Hard'].map((difficulty, index) => ({ id: `q${index}`, difficulty, type: 'mcq' })) } as Topic; // Use the minimum representative three-level lesson.
    const attempts = topic.questions.map(question => ({ id: question.id, topicId: topic.id, questionId: question.id, answer: 'reference', correct: true, difficulty: question.difficulty, createdAt: new Date().toISOString() })) as Attempt[]; // Create explicit correct evidence for every checkpoint.
    const result = { id: 'assessment', subjectId: 'test', topicId: topic.id, score: 100, correct: 3, total: 3, seconds: 10, createdAt: new Date().toISOString(), answers: topic.questions.map(question => ({ topicId: topic.id, questionId: question.id, answer: 'reference', correct: true })) } as QuizResult; // Create the independent topic-assessment evidence.
    assert.equal(topicMastered(topic, [], [], defaultSettings), false); // A topic view or empty record must never count as mastery.
    assert.equal(topicMastered(topic, attempts, [], defaultSettings), false); // Checkpoint completion alone must not grant mastery.
    assert.equal(topicMastered(topic, attempts.slice(0, 2), [result], defaultSettings), false); // Missing Hard evidence must block mastery.
    assert.equal(topicMastered(topic, attempts, [result], defaultSettings), true); // Accept complete checkpoint and assessment evidence.
    assert.equal(topicMastered(topic, [...attempts, { ...attempts[2], id: 'retry-wrong', correct: false }], [result], defaultSettings), false); // A newer incorrect answer must replace stale correctness evidence.
}); // Finish mastery rule coverage.
test('password reset tokens are single use and revoke previous sessions', async () => { // Verify the local development reset flow without an external mail service.
    const { env, db } = fixture(); // Use an isolated real account database.
    const cookie = await register(env); // Create an account with an active session.
    const reset = await request(env, '/api/auth/forgot-password', 'POST', { email: 'learner@example.com' }); // Request a real short-lived reset credential.
    assert.equal(reset.status, 200); // Local development should expose its explicitly labeled reset URL.
    const resetToken = new URL(reset.data.developmentResetUrl).searchParams.get('token'); // Extract the random credential without logging it.
    const completed = await request(env, '/api/auth/reset-password', 'POST', { token: resetToken, password: 'new-secure-study-password' }); // Consume the credential to change the password.
    assert.equal(completed.status, 200); // A valid unexpired reset must succeed.
    assert.equal((await request(env, '/api/workspace', 'GET', undefined, cookie)).status, 401); // Revoke the previous browser's session immediately.
    assert.equal((await request(env, '/api/auth/reset-password', 'POST', { token: resetToken, password: 'another-study-password' })).status, 400); // Reject a second use of the same reset credential.
    assert.equal((await request(env, '/api/auth/login', 'POST', { email: 'learner@example.com', password: 'new-secure-study-password' })).status, 200); // Require the replacement password for future sessions.
    db.close(); // Release the test database.
}); // Finish reset lifecycle coverage.
test('revision schedules advance once and private mastery settings persist', async () => { // Verify the revision ladder and threshold configuration against the real database.
    const { env, db } = fixture(); // Isolate private schedules and settings.
    const cookie = await register(env); // Start with an authenticated learner.
    const topicId = topics[0].id; // Reuse a real seeded topic foreign key.
    assert.equal((await request(env, `/api/progress/topics/${topicId}`, 'POST', { status: 'Needs Revision' }, cookie)).status, 200); // Schedule a topic from the ordinary learning action.
    const reviewed = await request(env, `/api/revision/${topicId}/complete`, 'POST', {}, cookie); // Complete the first actual spaced review.
    assert.equal(reviewed.status, 200); // Save a legitimate review event.
    const interval = (Date.parse(reviewed.data.reviewAt) - Date.now()) / 86400000; // Inspect the next scheduled interval in days.
    assert.ok(interval > 2.99 && interval <= 3.01); // Advance from the initial one-day schedule to a three-day review.
    const duplicate = await request(env, `/api/revision/${topicId}/complete`, 'POST', {}, cookie); // Simulate a repeated click or retried completion action.
    assert.equal(duplicate.status, 409); // Keep repeated actions from racing through the spaced-repetition ladder.
    const updated = await request(env, '/api/settings', 'PUT', { dailyGoal: 5, easy: 100, medium: 90, hard: 85, assessment: 90 }, cookie); // Save a stricter personalized learning target.
    assert.equal(updated.status, 200); // Accept validated configurable thresholds.
    assert.equal(updated.data.medium, 90); // Return the actual stored threshold.
    const state = await request(env, '/api/workspace', 'GET', undefined, cookie); // Reload state through a separate authenticated API request.
    assert.equal(state.data.settings.dailyGoal, 5); // Persist the daily goal in the database.
    assert.equal(state.data.settings.hard, 85); // Persist mastery configuration independently of browser storage.
    assert.equal((await request(env, '/api/settings', 'PUT', { easy: 0 }, cookie)).status, 400); // Reject invalid thresholds before writing user settings.
    db.close(); // Release the real database handle.
}); // Finish revision and threshold persistence coverage.
