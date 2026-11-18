// This portable REST service is shared by the Worker, local Express server, and integration tests.
import type { Attempt, Progress, Question, QuizResult, Topic, User, Workspace } from '../shared/types'; // Reuse the public data contract across every runtime.
import { row, rows, write, type Database, type Environment, type Statement } from './db'; // Keep SQL parameterized and runtime-independent.
import { digest, hashPassword, readSession, sessionCookie, token, verifyPassword } from './security'; // Centralize authentication primitives.
import { ensureCurriculum, getCurriculum } from './curriculum'; // Serve database-backed curriculum independently of user data.
export type { Environment } from './db'; // Let the Worker and local adapter share the same environment type.
export const defaultSettings = { dailyGoal: 3, easy: 100, medium: 80, hard: 70, assessment: 80 }; // Use explicit configurable mastery thresholds.
const intervals = [1, 3, 7, 14, 30]; // Apply a simple documented spaced-repetition schedule in days.
const now = (): string => new Date().toISOString(); // Store portable UTC ISO timestamps consistently.
const after = (milliseconds: number): string => new Date(Date.now() + milliseconds).toISOString(); // Calculate server-side expirations and review dates.
const id = (): string => crypto.randomUUID(); // Generate opaque record identifiers.
const json = (data: unknown, status = 200, headers: HeadersInit = {}): Response => { // Use a consistent success envelope with explicit cache protections.
    const output = new Headers(headers); // Accept every standard HeadersInit representation safely.
    output.set('Cache-Control', 'no-store'); // Prevent browsers and intermediaries from caching private records.
    return Response.json({ data }, { status, headers: output }); // Preserve session cookies alongside the documented response envelope.
}; // Finish the JSON response helper.
class ApiError extends Error { // Preserve expected HTTP errors without exposing internal SQL details.
    constructor(public status: number, message: string, public code = 'INVALID_REQUEST') { super(message); } // Keep status, readable message, and machine code together.
} // Finish the controlled error type.
const fail = (condition: unknown, status: number, message: string, code?: string): void => { if (condition) throw new ApiError(status, message, code); }; // Express input guards without deeply nested branches.
const text = (value: unknown, maximum = 5000): string => { // Validate text fields before they reach the database.
    fail(typeof value !== 'string' || value.length > maximum, 400, `Expected text of at most ${maximum} characters.`); // Reject invalid types and oversized payloads.
    return (value as string).trim(); // Normalize accidental surrounding whitespace.
}; // Finish text validation.
async function body(request: Request): Promise<Record<string, unknown>> { // Validate the JSON request boundary centrally.
    fail(Number(request.headers.get('content-length') || 0) > 65536, 413, 'Request is too large.'); // Reject oversized declared payloads before parsing.
    const raw = await request.text(); // Read once because Request bodies are streams.
    fail(raw.length > 65536, 413, 'Request is too large.'); // Enforce the bound even when Content-Length is absent.
    let parsed: unknown; // Preserve a distinction between JSON values and object payloads.
    try { parsed = JSON.parse(raw || '{}'); } catch { throw new ApiError(400, 'Send a valid JSON object.'); } // Convert parse failures into actionable client errors.
    fail(!parsed || typeof parsed !== 'object' || Array.isArray(parsed), 400, 'Send a JSON object.'); // Reject arrays and primitive JSON bodies.
    return parsed as Record<string, unknown>; // Expose validated object shape to individual handlers.
} // Finish request parsing.
interface PrivateUser extends User { password_hash: string; settings: string } // Keep sensitive database fields on the server only.
const publicUser = (user: PrivateUser): User => ({ id: user.id, name: user.name, email: user.email }); // Never serialize a password hash or settings blob as profile data.
async function authenticate(request: Request, db: Database): Promise<PrivateUser> { // Derive identity exclusively from a valid server session.
    const raw = readSession(request); // Read the opaque HttpOnly cookie.
    fail(!raw, 401, 'Sign in to save your learning progress.', 'UNAUTHENTICATED'); // Reject requests without a session.
    const user = await row<PrivateUser>(db, 'SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > ?', await digest(raw!), now()); // Enforce server-side expiration and ownership.
    fail(!user, 401, 'Your session has expired. Please sign in again.', 'UNAUTHENTICATED'); // Reject invalid or expired session tokens.
    return user!; // Pass the authenticated database identity to private handlers.
} // Finish authentication.
async function rateLimit(request: Request, db: Database, category: string, identifier = ''): Promise<void> { // Slow authentication abuse using durable buckets.
    const client = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'local'; // Prefer the trusted host-provided address when available.
    const bucketId = await digest(`${category}:${client}:${identifier}`); // Avoid retaining raw client addresses in rate-limit keys.
    const expires = after(15 * 60 * 1000); // Use a fifteen-minute authentication window.
    await write(db, 'INSERT INTO rate_limits (id, count, expires_at) VALUES (?, 1, ?) ON CONFLICT (id) DO UPDATE SET count = CASE WHEN rate_limits.expires_at < ? THEN 1 ELSE rate_limits.count + 1 END, expires_at = CASE WHEN rate_limits.expires_at < ? THEN ? ELSE rate_limits.expires_at END', bucketId, expires, now(), now(), expires); // Increment a bucket atomically across concurrent requests.
    const current = await row<{ count: number }>(db, 'SELECT count FROM rate_limits WHERE id = ?', bucketId); // Read the resulting count after the atomic update.
    fail((current?.count || 0) > 30, 429, 'Too many attempts. Please try again in fifteen minutes.', 'RATE_LIMITED'); // Apply the same response to existing and nonexistent accounts.
} // Finish persistent rate limiting.
function activity(db: Database, userId: string, topicId: string | null, kind: string): Statement { // Build activity writes for inclusion in an atomic batch.
    return db.prepare('INSERT INTO learning_activity (id, user_id, topic_id, kind, created_at) VALUES (?, ?, ?, ?, ?)').bind(id(), userId, topicId, kind, now()); // Record a real learner action rather than simulated chart data.
} // Finish the activity statement helper.
function progressStatement(db: Database, userId: string, topicId: string, status: string, reviewAt: string | null = null): Statement { // Build a unique topic-progress upsert.
    return db.prepare('INSERT INTO user_topic_progress (user_id, topic_id, status, viewed, updated_at, review_step, review_at) VALUES (?, ?, ?, 1, ?, 0, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET status = ?, viewed = 1, updated_at = ?, review_at = COALESCE(?, user_topic_progress.review_at)').bind(userId, topicId, status, now(), reviewAt, status, now(), reviewAt); // Preserve the review counter when an existing lesson changes state.
} // Finish the progress upsert helper.
async function workspace(db: Database, user: PrivateUser): Promise<Workspace> { // Return only records owned by the authenticated session.
    const [progress, attempts, quizzes, bookmarks, notes, activityRows] = await Promise.all([ // Fetch independent private collections together.
        rows<Record<string, unknown>>(db, 'SELECT * FROM user_topic_progress WHERE user_id = ?', user.id), // Load topic states for this user only.
        rows<Record<string, unknown>>(db, 'SELECT * FROM checkpoint_attempts WHERE user_id = ? ORDER BY created_at ASC', user.id), // Preserve all historical checkpoint attempts.
        rows<Record<string, unknown>>(db, 'SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC', user.id), // Preserve all historical quiz results.
        rows<{ topic_id: string }>(db, 'SELECT topic_id FROM bookmarks WHERE user_id = ?', user.id), // Load private bookmarks.
        rows<{ topic_id: string; text: string; updated_at: string }>(db, 'SELECT topic_id, text, updated_at FROM user_notes WHERE user_id = ?', user.id), // Load private notes.
        rows<{ date: string; count: number }>(db, 'SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM learning_activity WHERE user_id = ? GROUP BY substr(created_at, 1, 10) ORDER BY date', user.id), // Aggregate actual event counts by UTC calendar day.
    ]); // Finish parallel private reads.
    return { // Map portable SQL columns into the frontend's camel-case contract.
        user: publicUser(user), // Expose only safe profile fields.
        progress: progress.map(item => ({ topicId: item.topic_id, status: item.status, viewed: Boolean(item.viewed), updatedAt: item.updated_at, reviewStep: item.review_step, reviewAt: item.review_at })) as Progress[], // Preserve all five learning states.
        attempts: attempts.map(item => ({ id: item.id, topicId: item.topic_id, questionId: item.question_id, answer: item.answer, correct: item.correct === null ? null : Boolean(item.correct), difficulty: item.difficulty, createdAt: item.created_at })) as Attempt[], // Keep ungraded descriptive answers null.
        quizzes: quizzes.map(item => ({ id: item.id, subjectId: item.subject_id, ...(item.topic_id ? { topicId: item.topic_id } : {}), score: item.score, correct: item.correct, total: item.total, seconds: item.seconds, createdAt: item.created_at, answers: JSON.parse(String(item.answers)) })) as QuizResult[], // Decode server-scored answer histories.
        bookmarks: bookmarks.map(item => item.topic_id), // Return saved topic IDs instead of join records.
        notes: notes.map(item => ({ topicId: item.topic_id, text: item.text, updatedAt: item.updated_at })), // Return private editable study notes.
        activity: activityRows.map(item => ({ date: item.date, count: Number(item.count) })), // Normalize PostgreSQL COUNT values to numbers.
        settings: { ...defaultSettings, ...JSON.parse(user.settings) }, // Supply defaults when a future setting has not yet been saved.
    }; // Finish the workspace response.
} // Finish workspace loading.
export function topicMastered(topic: Topic, attempts: Attempt[], quizzes: QuizResult[], settings = defaultSettings): boolean { // Make mastery a testable server-side rule.
    const latest = new Map<string, Attempt>(); // Consider the latest answer for each checkpoint.
    for (const attempt of attempts.filter(item => item.topicId === topic.id)) latest.set(attempt.questionId, attempt); // Keep previous attempts in history while selecting current evidence.
    for (const difficulty of ['Easy', 'Medium', 'Hard'] as const) { // Require evidence at every available difficulty level.
        const questions = topic.questions.filter(question => question.difficulty === difficulty); // Read the actual curriculum checkpoint inventory.
        if (!questions.length) continue; // Do not invent unavailable checkpoint requirements.
        const answers = questions.map(question => latest.get(question.id)); // Align one current answer to each checkpoint.
        if (answers.some(answer => !answer || answer.correct === null)) return false; // Require all checkpoints at this level to have explicit grading.
        const correct = answers.filter(answer => answer?.correct).length; // Count only demonstrated or explicitly self-assessed correctness.
        if ((correct / questions.length) * 100 < settings[difficulty.toLowerCase() as 'easy' | 'medium' | 'hard']) return false; // Enforce configurable level accuracy.
    } // Finish checkpoint-level evidence checks.
    const required = Math.min(3, topic.questions.filter(question => question.type === 'mcq').length); // Require a real topic assessment using all available MCQs up to three.
    const assessment = quizzes.filter(quiz => quiz.topicId === topic.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; // Use the latest topic assessment so an older passing score cannot hide a new failure.
    const covered = assessment && topic.questions.filter(question => question.type === 'mcq').every(question => assessment.answers.some(answer => answer.questionId === question.id && answer.topicId === topic.id)); // Require the full topic inventory so a hand-selected difficulty subset cannot grant mastery.
    const recentQuiz = quizzes.filter(quiz => quiz.answers.some(answer => answer.topicId === topic.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; // Include mixed-assessment evidence when detecting a new weakness.
    if (recentQuiz && assessment && recentQuiz.createdAt >= assessment.createdAt && recentQuiz.answers.some(answer => answer.topicId === topic.id && !answer.correct)) return false; // Do not retain old mastery after a newer assessment reveals a mistake.
    return required > 0 && Boolean(assessment && covered && assessment.total >= required && assessment.score >= settings.assessment); // A click or material view can never confer mastery.
} // Finish the mastery rule.
async function refreshMastery(db: Database, user: PrivateUser, topic: Topic): Promise<void> { // Recalculate learning status after new assessment evidence.
    const state = await workspace(db, user); // Reuse the same ownership-scoped calculations as the dashboard.
    const existing = state.progress.find(item => item.topicId === topic.id); // Preserve manual reading completion separately from mastery.
    const mastered = topicMastered(topic, state.attempts, state.quizzes, state.settings); // Evaluate all configured mastery thresholds on the server.
    const latest = state.attempts.filter(item => item.topicId === topic.id).at(-1); // Detect newly incorrect checkpoint evidence.
    const status = mastered ? 'Mastered' : latest?.correct === false ? 'Needs Revision' : existing?.status === 'Mastered' ? 'In Progress' : existing?.status || 'In Progress'; // Remove stale mastery when evidence drops below the threshold.
    await write(db, 'INSERT INTO user_topic_progress (user_id, topic_id, status, viewed, updated_at, review_step, review_at) VALUES (?, ?, ?, 1, ?, 0, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET status = ?, updated_at = ?, review_at = COALESCE(user_topic_progress.review_at, ?)', user.id, topic.id, status, now(), after(86400000), status, now(), after(86400000)); // Schedule a first review without destroying an existing interval.
} // Finish mastery refresh.
async function handleAuthentication(request: Request, env: Environment, path: string): Promise<Response | null> { // Keep authentication routes separate from learning handlers.
    const db = env.DB; // Read the runtime-specific database binding.
    if (path === '/api/auth/logout' && request.method === 'POST') { // End the current session on both server and browser.
        const raw = readSession(request); // Read the current bearer cookie if present.
        if (raw) await write(db, 'DELETE FROM sessions WHERE id = ?', await digest(raw)); // Revoke only this session rather than other devices.
        return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', request, true) }); // Clear the HttpOnly cookie even after an expired session.
    } // Finish logout handling.
    if ((path === '/api/auth/login' || path === '/api/auth/register') && request.method === 'POST') { // Handle account creation and secure sign-in.
        const input = await body(request); // Parse and bound the request payload.
        const email = text(input.email, 254).toLowerCase(); // Normalize email uniqueness consistently.
        const password = typeof input.password === 'string' ? input.password : ''; // Preserve meaningful password whitespace instead of trimming it.
        fail(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'Enter a valid email address.'); // Reject malformed email addresses.
        fail(password.length < 10 || password.length > 256, 400, 'Use a password between 10 and 256 characters.'); // Enforce a meaningful minimum without arbitrary character rules.
        await rateLimit(request, db, 'authentication'); // Bound total authentication work per client address.
        await rateLimit(request, db, 'account', email); // Also slow repeated attacks against one account.
        let user = await row<PrivateUser>(db, 'SELECT * FROM users WHERE email = ?', email); // Look up the normalized account once.
        if (path.endsWith('/register')) { // Create an independently owned account.
            const name = text(input.name, 80); // Validate the editable profile name.
            fail(name.length < 2, 400, 'Enter a name with at least two characters.'); // Keep blank or one-character names out of the dashboard.
            fail(user, 409, 'An account with this email already exists. Try signing in.', 'EMAIL_EXISTS'); // Let the database uniqueness constraint backstop this friendly guard.
            user = { id: id(), name, email, password_hash: await hashPassword(password), settings: JSON.stringify(defaultSettings) }; // Derive a salted password hash before persistence.
            try { await write(db, 'INSERT INTO users (id, name, email, password_hash, settings, created_at) VALUES (?, ?, ?, ?, ?, ?)', user.id, user.name, user.email, user.password_hash, user.settings, now()); } catch (error) { // Handle simultaneous registrations safely.
                if (String(error).toLowerCase().includes('unique')) throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_EXISTS'); // Convert a duplicate database error into a useful response.
                throw error; // Let unexpected database failures use centralized error handling.
            } // Finish account insertion.
        } else { // Verify an existing account without exposing stored credentials.
            const valid = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, await hashPassword('unavailable-account-password')); // Spend derivation time for nonexistent accounts as well.
            fail(!user || !valid, 401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS'); // Return the same error for every failed login.
        } // Finish account creation or verification.
        const raw = token(); // Generate a fresh session on every successful authentication.
        await write(db, 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', await digest(raw), user!.id, after(30 * 86400000)); // Store only the session token hash.
        return json(publicUser(user!), path.endsWith('/register') ? 201 : 200, { 'Set-Cookie': sessionCookie(raw, request) }); // Set the secure server-managed session cookie.
    } // Finish login and registration handling.
    if (path === '/api/auth/forgot-password' && request.method === 'POST') { // Start a short-lived password reset without revealing account existence.
        const input = await body(request); // Parse the submitted email.
        const email = text(input.email, 254).toLowerCase(); // Normalize email lookup consistently with registration.
        await rateLimit(request, db, 'password-reset'); // Bound reset requests per client.
        await rateLimit(request, db, 'password-reset-account', email); // Bound repeated requests to one recipient.
        fail(!env.RESEND_API_KEY && env.DEVELOPMENT !== 'true', 503, 'Password-reset email delivery has not been configured by the site owner.', 'EMAIL_NOT_CONFIGURED'); // Make a missing delivery service explicit rather than pretending email was sent.
        const user = await row<PrivateUser>(db, 'SELECT * FROM users WHERE email = ?', email); // Keep the public response independent of this result.
        let developmentResetUrl: string | undefined; // Expose a reset URL only in explicit local development mode.
        if (user) { // Create credentials only for an existing account.
            const raw = token(); // Generate an unpredictable single-use reset token.
            const url = `${env.APP_ORIGIN || new URL(request.url).origin}/reset-password?token=${raw}`; // Use a configured same-site URL for email delivery.
            await db.batch([db.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id), db.prepare('INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)').bind(await digest(raw), user.id, after(30 * 60000))]); // Invalidate older links atomically before issuing a new one.
            if (env.RESEND_API_KEY) { // Deliver real reset links when a verified provider is configured.
                const delivery = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.RESET_FROM_EMAIL || 'CS Fundamentals <onboarding@resend.dev>', to: [email], subject: 'Reset your CS Fundamentals password', text: `Reset your password using this link within 30 minutes: ${url}\n\nIf you did not request this, ignore this message.` }) }); // Keep provider credentials server-side.
                fail(!delivery.ok, 503, 'Email delivery is temporarily unavailable. Please try again later.', 'EMAIL_DELIVERY_FAILED'); // Report provider failures instead of false success.
            } else if (env.DEVELOPMENT === 'true') developmentResetUrl = url; // Return a clearly labeled development aid without sending email.
        } // Finish account-specific reset work.
        return json({ message: 'If an account exists, a reset link has been sent.', ...(developmentResetUrl ? { developmentResetUrl } : {}) }); // Keep production account existence private.
    } // Finish reset initiation.
    if (path === '/api/auth/reset-password' && request.method === 'POST') { // Consume a valid reset credential and revoke all sessions.
        const input = await body(request); // Parse the token and replacement password.
        const raw = text(input.token, 256); // Bound the submitted random credential.
        const password = typeof input.password === 'string' ? input.password : ''; // Preserve intentional password whitespace.
        fail(password.length < 10 || password.length > 256, 400, 'Use a password between 10 and 256 characters.'); // Apply registration's password policy.
        await rateLimit(request, db, 'reset-complete'); // Bound invalid token probing and password derivation work.
        const hashed = await digest(raw); // Compare only credential hashes in the database.
        const reset = await row<{ user_id: string }>(db, 'SELECT user_id FROM password_resets WHERE id = ? AND expires_at > ?', hashed, now()); // Enforce the thirty-minute server expiration.
        fail(!reset, 400, 'This reset link is invalid or expired. Request a new one.', 'INVALID_RESET_TOKEN'); // Reject consumed and expired tokens alike.
        await db.batch([ // Update credentials and revoke all old access atomically.
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ? AND EXISTS (SELECT 1 FROM password_resets WHERE id = ? AND expires_at > ?)').bind(await hashPassword(password), reset!.user_id, hashed, now()), // Guard the password write against a simultaneously consumed reset token.
            db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset!.user_id), // Require every device to sign in with the new password.
            db.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(reset!.user_id), // Consume every outstanding reset link for this account.
        ]); // Finish the atomic credential reset.
        return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', request, true) }); // Clear any current browser session as well.
    } // Finish password reset completion.
    return null; // Let the authenticated application router handle remaining paths.
} // Finish authentication routing.
export async function handleApi(request: Request, env: Environment): Promise<Response> { // Expose the shared Fetch-compatible API entry point.
    try { // Convert controlled and unexpected failures into consistent JSON errors.
        const url = new URL(request.url); // Parse routing and query parameters once.
        const path = url.pathname.replace(/\/$/, '') || '/'; // Accept a harmless trailing slash consistently.
        const db = env.DB; // Select D1, local SQLite, or local PostgreSQL through one interface.
        fail(!db, 503, 'The database is not configured.', 'DATABASE_UNAVAILABLE'); // Make binding configuration failures visible.
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) { // Apply CSRF checks to every state-changing route, including authentication.
            const origin = request.headers.get('origin'); // Read the browser's origin declaration.
            fail(origin && origin !== url.origin && origin !== env.APP_ORIGIN, 403, 'This request came from an untrusted origin.', 'ORIGIN_REJECTED'); // Reject cross-origin cookie-bearing writes.
            fail(request.headers.get('sec-fetch-site') === 'cross-site', 403, 'Cross-site requests are not allowed.', 'ORIGIN_REJECTED'); // Defend same-site cookies with an additional browser signal.
            fail(!request.headers.get('content-type')?.includes('application/json'), 415, 'Use application/json for API requests.'); // Prevent cross-site form submissions from mutating the account.
        } // Finish state-changing request protections.
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' } }); // Do not grant cross-origin credential access.
        await ensureCurriculum(db); // Populate initial curriculum data only when the migrated database is empty.
        const authResponse = await handleAuthentication(request, env, path); // Handle public authentication operations first.
        if (authResponse) return authResponse; // Preserve authentication status and session cookie headers.
        if (request.method === 'GET' && (path === '/api/curriculum' || path.startsWith('/api/subjects') || path.startsWith('/api/topics'))) { // Make structured learning material available before sign-in.
            const curriculum = await getCurriculum(db); // Read the editable database records rather than React constants.
            if (path === '/api/curriculum') return json(curriculum); // Allow React to refresh the full curriculum in one request.
            if (path === '/api/subjects') return json(curriculum.subjects); // Return the six seeded subjects plus future database additions.
            const subjectMatch = path.match(/^\/api\/subjects\/([^/]+)(\/topics)?$/); // Recognize subject detail and topic-list routes.
            if (subjectMatch) { // Return a requested subject or its topics.
                const subject = curriculum.subjects.find(item => item.id === decodeURIComponent(subjectMatch[1])); // Resolve the stable subject slug.
                fail(!subject, 404, 'Subject not found.', 'NOT_FOUND'); // Avoid empty fake subject pages.
                return json(subjectMatch[2] ? curriculum.topics.filter(item => item.subjectId === subject!.id) : { ...subject, topics: curriculum.topics.filter(item => item.subjectId === subject!.id) }); // Return a coherent subject record or topic collection.
            } // Finish subject routes.
            const topicMatch = path.match(/^\/api\/topics\/([^/]+)(\/(material|checkpoints))?$/); // Recognize lesson, material, and checkpoint endpoints.
            if (topicMatch) { // Resolve one structured lesson.
                const topic = curriculum.topics.find(item => item.id === decodeURIComponent(topicMatch[1])); // Match an exact curriculum identifier.
                fail(!topic, 404, 'Topic not found.', 'NOT_FOUND'); // Return an honest missing-content state.
                return json(topicMatch[3] === 'checkpoints' ? topic!.questions : topic); // Serve one source of truth for lesson and checkpoint screens.
            } // Finish public topic routes.
        } // Finish public curriculum handling.
        const user = await authenticate(request, db); // Require a valid session for every remaining record access.
        if (path === '/api/auth/me' && request.method === 'GET') return json(publicUser(user)); // Return the signed-in profile without sensitive fields.
        if (path === '/api/auth/me' && request.method === 'PATCH') { // Support profile display-name changes.
            const input = await body(request); // Parse the profile update.
            const name = text(input.name, 80); // Bound the editable profile field.
            fail(name.length < 2, 400, 'Enter a name with at least two characters.'); // Keep the display name meaningful.
            await write(db, 'UPDATE users SET name = ? WHERE id = ?', name, user.id); // Derive the owner from the session, never the payload.
            return json({ ...publicUser(user), name }); // Refresh the frontend's safe profile contract.
        } // Finish profile updates.
        if (request.method === 'GET' && (path === '/api/workspace' || path.startsWith('/api/progress') || path.startsWith('/api/revision') || path === '/api/bookmarks' || path === '/api/notes' || path === '/api/quizzes/history')) { // Offer the requested read endpoints through one consistent ownership-scoped query layer.
            const state = await workspace(db, user); // Read only the authenticated user's private data.
            if (path === '/api/bookmarks') return json(state.bookmarks); // Expose saved lesson identifiers.
            if (path === '/api/notes') return json(state.notes); // Expose private study notes.
            if (path === '/api/quizzes/history') return json(state.quizzes); // Expose immutable assessment history.
            if (path === '/api/progress/activity') return json(state.activity); // Expose actual daily event counts.
            if (path === '/api/progress/topics') return json(state.progress); // Expose the five topic learning states.
            if (path === '/api/revision/today') return json(state.progress.filter(item => item.status === 'Needs Revision' || (item.reviewAt && item.reviewAt <= now()))); // Combine weak areas with due spaced reviews.
            if (path === '/api/revision/weak-topics') return json(state.progress.filter(item => item.status === 'Needs Revision')); // Highlight topics with poor recent evidence.
            return json(state); // Return the complete workspace for overview and subject analytics.
        } // Finish private read routes.
        if (path === '/api/settings' && request.method === 'PUT') { // Make mastery thresholds and the daily goal configurable.
            const input = await body(request); // Parse only documented setting names.
            const settings = { ...defaultSettings }; // Start with a complete safe settings object.
            for (const key of Object.keys(settings) as (keyof typeof settings)[]) { // Validate every configurable numeric value.
                const value = Number(input[key] ?? JSON.parse(user.settings)[key] ?? settings[key]); // Preserve saved values when a partial request omits a setting.
                fail(!Number.isInteger(value) || value < 1 || value > (key === 'dailyGoal' ? 100 : 100), 400, `${key} must be a whole number between 1 and 100.`); // Keep thresholds finite and meaningful.
                settings[key] = value; // Copy only validated documented keys.
            } // Finish settings validation.
            await write(db, 'UPDATE users SET settings = ? WHERE id = ?', JSON.stringify(settings), user.id); // Store settings independently for this user.
            user.settings = JSON.stringify(settings); // Use the updated thresholds for immediate mastery recalculation.
            const [state, catalog] = await Promise.all([workspace(db, user), getCurriculum(db)]); // Read the user's evidence and shared lesson inventory once.
            const recalculations: Statement[] = []; // Collect only topic statuses that actually change.
            for (const progress of state.progress) { // Reevaluate existing learning records after threshold changes.
                const topic = catalog.topics.find(item => item.id === progress.topicId); // Resolve the canonical checkpoint inventory.
                if (!topic) continue; // Skip an editorially removed lesson safely.
                const mastered = topicMastered(topic, state.attempts, state.quizzes, settings); // Evaluate the newly configured thresholds on the server.
                const status = mastered ? 'Mastered' : progress.status === 'Mastered' ? 'In Progress' : progress.status; // Remove stale mastery while preserving ordinary learning states.
                if (status !== progress.status) recalculations.push(db.prepare('UPDATE user_topic_progress SET status = ? WHERE user_id = ? AND topic_id = ?').bind(status, user.id, topic.id)); // Keep every status update scoped to the session owner.
            } // Finish threshold-driven status calculations.
            for (let index = 0; index < recalculations.length; index += 100) await db.batch(recalculations.slice(index, index + 100)); // Apply bounded transactional status batches.
            return json(settings); // Let the client refresh its displayed thresholds.
        } // Finish settings updates.
        const curriculum = await getCurriculum(db); // Load canonical question answers and lesson identities for mutations.
        const findTopic = (topicId: string): Topic => { // Centralize exact lesson lookup.
            const found = curriculum.topics.find(topic => topic.id === topicId); // Use the stable curriculum identifier.
            fail(!found, 404, 'Topic not found.', 'NOT_FOUND'); // Prevent dangling user records.
            return found!; // Return a guaranteed lesson after validation.
        }; // Finish the topic lookup helper.
        const progressMatch = path.match(/^\/api\/progress\/topics\/([^/]+)$/); // Match a single topic progress update.
        if (progressMatch && request.method === 'POST') { // Record learning state separately from assessment mastery.
            const topic = findTopic(decodeURIComponent(progressMatch[1])); // Validate the topic foreign-key target.
            const input = await body(request); // Parse the requested learning action.
            const status = text(input.status, 40); // Bound the state string.
            fail(!['Not Started', 'In Progress', 'Completed', 'Needs Revision'].includes(status), 400, 'Mastery is calculated from checkpoint and quiz evidence; select a learning status.'); // Never accept client-claimed mastery.
            await db.batch([progressStatement(db, user.id, topic.id, status, status === 'Needs Revision' || status === 'Completed' ? after(86400000) : null), activity(db, user.id, topic.id, status === 'In Progress' ? 'learn' : 'progress')]); // Update learning state and real activity atomically.
            await refreshMastery(db, user, topic); // Preserve demonstrated mastery when an ordinary learning action is recorded.
            return json(await workspace(db, user)); // Return the canonical updated workspace.
        } // Finish progress updates.
        const checkpointMatch = path.match(/^\/api\/checkpoints\/([^/]+)(\/(attempt|history))?$/); // Recognize checkpoint detail, attempt, and history routes.
        if (checkpointMatch) { // Resolve checkpoint ownership through its curriculum topic.
            const questionId = decodeURIComponent(checkpointMatch[1]); // Read the stable checkpoint identifier.
            const topic = curriculum.topics.find(item => item.questions.some(question => question.id === questionId)); // Find the actual parent lesson instead of trusting a body ID.
            const question = topic?.questions.find(item => item.id === questionId); // Read the canonical reference answer.
            fail(!topic || !question, 404, 'Checkpoint not found.', 'NOT_FOUND'); // Reject fabricated question identifiers.
            if (request.method === 'GET') { // Serve reference content or private attempt history.
                if (checkpointMatch[3] === 'history') return json((await workspace(db, user)).attempts.filter(attempt => attempt.questionId === questionId)); // Scope history to the signed-in owner.
                return json(question); // Return the structured checkpoint contract.
            } // Finish checkpoint reads.
            if (request.method === 'POST' && checkpointMatch[3] === 'attempt') { // Preserve a new answer rather than overwriting the prior attempt.
                const input = await body(request); // Parse the submitted answer and optional explicit descriptive self-rating.
                const answer = text(input.answer, 10000); // Bound free-text and SQL submissions.
                fail(!answer, 400, 'Write an answer before submitting.'); // Prevent empty answers from generating activity or attempts.
                fail(input.topicId && input.topicId !== topic!.id, 400, 'This checkpoint belongs to a different topic.'); // Reject contradictory frontend identifiers.
                const correct = question!.type === 'mcq' ? answer === question!.answer : typeof input.correct === 'boolean' ? input.correct : null; // Score MCQs on the server and keep descriptive submissions ungraded unless explicitly self-assessed.
                const attempt: Attempt = { id: id(), topicId: topic!.id, questionId, answer, correct, difficulty: question!.difficulty, createdAt: now() }; // Preserve the submitted answer with immutable timestamp and difficulty.
                await db.batch([db.prepare('INSERT INTO checkpoint_attempts (id, user_id, topic_id, question_id, answer, correct, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(attempt.id, user.id, topic!.id, questionId, answer, correct === null ? null : Number(correct), question!.difficulty, attempt.createdAt), activity(db, user.id, topic!.id, 'checkpoint')]); // Store attempt and activity as one transaction.
                await refreshMastery(db, user, topic!); // Reevaluate mastery and revision needs using the new evidence.
                return json({ attempt, referenceAnswer: question!.answer, explanation: question!.explanation }, 201); // Give immediate honest feedback without trusting a supplied MCQ score.
            } // Finish checkpoint submissions.
        } // Finish checkpoint routes.
        if (path === '/api/quizzes' && request.method === 'GET') return json({ subjects: curriculum.subjects, difficulties: ['Easy', 'Medium', 'Hard'], modes: ['topic', 'subject', 'mixed', 'mock'] }); // Describe the available assessment scopes without simulated history.
        if (path === '/api/quizzes/start' && request.method === 'POST') { // Select randomized assessment questions on the server.
            const input = await body(request); // Parse the selected subject, topic, level, and count.
            const subjectId = text(input.subjectId || 'all', 100); // Use all for a mixed fundamentals assessment.
            const topicId = input.topicId ? text(input.topicId, 200) : null; // Allow topic-wise assessments for mastery evidence.
            const difficulty = text(input.difficulty || 'all', 20); // Keep all difficulties accessible.
            const count = Math.min(20, Math.max(1, Math.floor(Number(input.count) || 10))); // Bound one assessment to a manageable number of questions.
            fail(subjectId !== 'all' && !curriculum.subjects.some(subject => subject.id === subjectId), 400, 'Choose a valid subject.'); // Reject fabricated subject filters.
            fail(!['all', 'Easy', 'Medium', 'Hard'].includes(difficulty), 400, 'Choose a valid difficulty level.'); // Validate the assessment level.
            if (topicId) findTopic(topicId); // Validate optional topic scope.
            const pool = curriculum.topics.filter(topic => (!topicId || topic.id === topicId) && (subjectId === 'all' || topic.subjectId === subjectId)).flatMap(topic => topic.questions.filter(question => question.type === 'mcq' && (difficulty === 'all' || question.difficulty === difficulty)).map(question => ({ ...question, topicId: topic.id }))); // Include automatically scorable questions only.
            for (let index = pool.length - 1; index > 0; index -= 1) { // Shuffle without biasing toward the original curriculum order.
                const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296; // Use runtime-safe random bytes instead of a deterministic order.
                const target = Math.floor(random * (index + 1)); // Pick an index inside the remaining shuffled range.
                [pool[index], pool[target]] = [pool[target], pool[index]]; // Swap the selected questions in place.
            } // Finish the Fisher-Yates shuffle.
            const selected = pool.slice(0, count); // Persist the complete selected inventory before showing it.
            fail(!selected.length, 400, 'No automatically scored questions are available for this selection.'); // Offer an honest empty assessment state.
            const quizId = id(); // Identify this server-selected assessment.
            const startedAt = now(); // Record the server start time for elapsed-time validation.
            const expiresAt = after(60 * 60000); // Allow up to one hour to complete the assessment.
            await write(db, 'INSERT INTO quizzes (id, user_id, subject_id, topic_id, questions, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)', quizId, user.id, subjectId, topicId, JSON.stringify(selected.map(question => ({ questionId: question.id, topicId: question.topicId }))), startedAt, expiresAt); // Persist the immutable question set and authenticated owner.
            return json({ id: quizId, questions: selected.map(question => ({ ...question, answer: '', explanation: '' })), startedAt, expiresAt }, 201); // Withhold reference feedback until after submission.
        } // Finish assessment creation.
        if (path === '/api/quizzes/submit' && request.method === 'POST') { // Score every question against canonical server-side answers.
            const input = await body(request); // Parse answers without accepting client score fields.
            fail(!Array.isArray(input.answers) || !input.answers.length || input.answers.length > 50, 400, 'Submit between 1 and 50 answers.'); // Bound assessment complexity and reject empty submissions.
            const supplied = (input.answers as Record<string, unknown>[]).map(answer => ({ questionId: text(answer.questionId, 200), topicId: text(answer.topicId, 200), answer: text(answer.answer, 10000) })); // Validate each submitted answer independently.
            fail(new Set(supplied.map(answer => answer.questionId)).size !== supplied.length, 400, 'Each assessment question may be submitted only once.'); // Prevent duplicate answers from inflating a score.
            let subjectId = text(input.subjectId || 'all', 100); // Keep a compatibility scope for unscheduled practice quizzes.
            let topicId = input.topicId ? text(input.topicId, 200) : null; // Topic mastery requires a complete topic assessment.
            let selected = supplied.map(answer => ({ questionId: answer.questionId, topicId: answer.topicId })); // Use the selected list only for compatibility practice submissions.
            let seconds = Math.min(3600, Math.max(0, Math.floor(Number(input.seconds) || 0))); // Bound fallback practice time without trusting score claims.
            let quizId: string | null = null; // Preserve the original server assessment when supplied.
            if (input.quizId) { // Enforce server-selected assessment inventory when available.
                quizId = text(input.quizId, 100); // Bound the opaque assessment identifier.
                const quiz = await row<{ subject_id: string; topic_id: string | null; questions: string; created_at: string; expires_at: string }>(db, 'SELECT * FROM quizzes WHERE id = ? AND user_id = ?', quizId, user.id); // Prevent cross-user assessment submission.
                fail(!quiz || quiz.expires_at < now(), 400, 'This assessment is missing or expired. Start a new one.', 'QUIZ_EXPIRED'); // Reject old or inaccessible definitions.
                const previous = await row<{ id: string }>(db, 'SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?', quizId, user.id); // Make duplicate network submissions return the already saved result.
                if (previous) return json((await workspace(db, user)).quizzes.find(result => result.id === previous.id)); // Keep retrying a submission from creating duplicate results.
                selected = JSON.parse(quiz!.questions); // Restore the immutable original inventory.
                subjectId = quiz!.subject_id; // Derive scope from the stored assessment rather than the request.
                topicId = quiz!.topic_id; // Derive topic-mastery eligibility from the stored assessment.
                seconds = Math.max(0, Math.floor((Date.now() - Date.parse(quiz!.created_at)) / 1000)); // Calculate elapsed time using the server timestamps.
                fail(supplied.some(answer => !selected.some(question => question.questionId === answer.questionId && question.topicId === answer.topicId)), 400, 'The submitted answers do not match this assessment.'); // Reject injected questions from another scope.
            } else if (topicId) { // Prevent a hand-selected easy subset from granting topic assessment mastery.
                const topic = findTopic(topicId); // Resolve the requested topic scope.
                const allQuestions = topic.questions.filter(question => question.type === 'mcq'); // Read the complete automatically scorable topic inventory.
                if (!allQuestions.every(question => selected.some(answer => answer.questionId === question.id && answer.topicId === topicId))) topicId = null; // Treat incomplete compatibility submissions as practice only.
            } // Finish definition and compatibility checks.
            const scored = selected.map(selection => { // Score the full inventory, including unanswered questions.
                const topic = findTopic(selection.topicId); // Validate the canonical question's parent topic.
                const question = topic.questions.find(item => item.id === selection.questionId); // Look up its reference answer independently of the client.
                fail(!question || question.type !== 'mcq', 400, 'Only valid multiple-choice questions can be automatically scored.'); // Keep descriptive questions out of automatic quiz grading.
                fail(subjectId !== 'all' && topic.subjectId !== subjectId, 400, 'A question does not belong to the selected subject.'); // Enforce the subject scope even for compatibility submissions.
                const answer = supplied.find(item => item.questionId === selection.questionId)?.answer || ''; // Count missing answers as incorrect.
                return { questionId: selection.questionId, topicId: selection.topicId, answer, correct: answer === question!.answer }; // Calculate correctness on the server.
            }); // Finish answer-level scoring.
            const correct = scored.filter(answer => answer.correct).length; // Count correct answers across the original inventory.
            const result: QuizResult = { id: id(), subjectId, ...(topicId ? { topicId } : {}), score: Math.round((correct / scored.length) * 100), correct, total: scored.length, seconds, createdAt: now(), answers: scored }; // Create an immutable result without trusting a client score.
            const affected = [...new Set(scored.filter(answer => !answer.correct).map(answer => answer.topicId))]; // Identify weak topics from actual mistakes.
            await db.batch([ // Save result, weak-area schedules, and learning activity atomically.
                db.prepare('INSERT INTO quiz_attempts (id, user_id, quiz_id, subject_id, topic_id, score, correct, total, seconds, created_at, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(result.id, user.id, quizId, subjectId, topicId, result.score, correct, result.total, seconds, result.createdAt, JSON.stringify(scored)), // Preserve the complete result and answer history.
                ...affected.map(weakTopicId => progressStatement(db, user.id, weakTopicId, 'Needs Revision', after(86400000))), // Schedule a first review for weak lessons.
                activity(db, user.id, topicId, 'quiz'), // Record one genuine assessment event.
            ]); // Finish the related database writes.
            for (const affectedTopicId of new Set(scored.map(answer => answer.topicId))) await refreshMastery(db, user, findTopic(affectedTopicId)); // Recalculate mastery for every assessed lesson.
            return json(result, 201); // Return accuracy, duration, and answer-level feedback immediately.
        } // Finish quiz submission.
        if (path === '/api/bookmarks' && request.method === 'POST') { // Save a topic for later revision.
            const input = await body(request); // Parse the topic selection.
            const topic = findTopic(text(input.topicId, 200)); // Validate the topic before inserting a relationship.
            await write(db, 'INSERT INTO bookmarks (user_id, topic_id, created_at) VALUES (?, ?, ?) ON CONFLICT (user_id, topic_id) DO NOTHING', user.id, topic.id, now()); // Make repeated saves idempotent.
            return json({ topicId: topic.id }, 201); // Return the saved topic identity.
        } // Finish bookmark creation.
        const bookmarkMatch = path.match(/^\/api\/bookmarks\/([^/]+)$/); // Recognize a single saved topic.
        if (bookmarkMatch && request.method === 'DELETE') { // Remove only the signed-in learner's bookmark.
            await write(db, 'DELETE FROM bookmarks WHERE user_id = ? AND topic_id = ?', user.id, decodeURIComponent(bookmarkMatch[1])); // Scope deletion using authenticated ownership.
            return json({ ok: true }); // Keep deletion idempotent when the bookmark was already absent.
        } // Finish bookmark deletion.
        if (path === '/api/notes' && request.method === 'POST') { // Support creating a topic note through the conventional collection endpoint.
            const input = await body(request); // Parse the topic identifier and personal note.
            const topic = findTopic(text(input.topicId, 200)); // Validate the note's curriculum foreign key.
            const note = text(input.text, 20000); // Keep personal notes bounded and plain text.
            const updatedAt = now(); // Record the actual saved edit time.
            await write(db, 'INSERT INTO user_notes (user_id, topic_id, text, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET text = ?, updated_at = ?', user.id, topic.id, note, updatedAt, note, updatedAt); // Upsert one note per authenticated learner and lesson.
            return json({ topicId: topic.id, text: note, updatedAt }, 201); // Return the same contract used by the topic editor.
        } // Finish conventional note creation.
        const noteMatch = path.match(/^\/api\/notes\/([^/]+)$/); // Recognize a topic's private study note.
        if (noteMatch && (request.method === 'PUT' || request.method === 'DELETE')) { // Support durable note editing and deletion.
            const topic = findTopic(decodeURIComponent(noteMatch[1])); // Validate the note's topic foreign key.
            if (request.method === 'DELETE') { // Remove only this owner's note.
                await write(db, 'DELETE FROM user_notes WHERE user_id = ? AND topic_id = ?', user.id, topic.id); // Scope deletion to the session owner.
                return json({ ok: true }); // Return a useful idempotent deletion result.
            } // Finish note deletion.
            const input = await body(request); // Parse the edited note text.
            const note = text(input.text, 20000); // Bound private notes without interpreting text as HTML.
            const updatedAt = now(); // Record the actual edit timestamp.
            await write(db, 'INSERT INTO user_notes (user_id, topic_id, text, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET text = ?, updated_at = ?', user.id, topic.id, note, updatedAt, note, updatedAt); // Preserve one private note per learner and topic.
            return json({ topicId: topic.id, text: note, updatedAt }); // Refresh the editor's saved state.
        } // Finish note editing.
        const revisionMatch = path.match(/^\/api\/revision\/([^/]+)\/complete$/); // Recognize a topic revision completion action.
        if (revisionMatch && request.method === 'POST') { // Advance the spaced-repetition schedule after an actual review.
            const topic = findTopic(decodeURIComponent(revisionMatch[1])); // Validate the reviewed lesson.
            const previous = await row<{ status: string; review_step: number; review_at: string | null }>(db, 'SELECT status, review_step, review_at FROM user_topic_progress WHERE user_id = ? AND topic_id = ?', user.id, topic.id); // Read the authenticated learner's review position.
            fail(previous?.review_at && previous.review_at > now() && previous.status !== 'Needs Revision', 409, 'This topic has already been reviewed. Its next review is scheduled.', 'REVISION_ALREADY_COMPLETE'); // Prevent repeated clicks from racing through the interval ladder.
            const step = previous ? previous.review_step + 1 : 0; // Advance one stage for each accepted review.
            const reviewAt = after(intervals[Math.min(step, intervals.length - 1)] * 86400000); // Use 1, 3, 7, 14, then 30 days.
            const status = previous?.status === 'Mastered' ? 'Mastered' : previous?.status === 'Completed' || previous?.status === 'Needs Revision' ? 'Completed' : 'In Progress'; // Revision completion does not manufacture mastery.
            await db.batch([ // Preserve the event, next schedule, and daily activity together.
                db.prepare('INSERT INTO user_topic_progress (user_id, topic_id, status, viewed, updated_at, review_step, review_at) VALUES (?, ?, ?, 1, ?, ?, ?) ON CONFLICT (user_id, topic_id) DO UPDATE SET status = ?, updated_at = ?, review_step = ?, review_at = ?').bind(user.id, topic.id, status, now(), step, reviewAt, status, now(), step, reviewAt), // Upsert the next review schedule for exactly one user/topic pair.
                db.prepare('INSERT INTO revision_history (id, user_id, topic_id, created_at, step) VALUES (?, ?, ?, ?, ?)').bind(id(), user.id, topic.id, now(), step), // Retain the completed revision in history.
                activity(db, user.id, topic.id, 'revision'), // Record a real review event for consistency analytics.
            ]); // Finish the atomic revision update.
            return json({ topicId: topic.id, reviewStep: step, reviewAt }); // Show the learner when the next review is due.
        } // Finish revision completion.
        throw new ApiError(404, 'API endpoint not found.', 'NOT_FOUND'); // Keep unknown operations from silently succeeding.
    } catch (error) { // Centralize API error responses without leaking SQL, tokens, or stack traces.
        if (error instanceof ApiError) return Response.json({ error: { message: error.message, code: error.code } }, { status: error.status, headers: { 'Cache-Control': 'no-store' } }); // Return actionable expected errors.
        console.error('API request failed:', error instanceof Error ? error.message : 'Unknown error'); // Log operational context while keeping response details private.
        return Response.json({ error: { message: 'Something went wrong while saving your work. Please try again.', code: 'INTERNAL_ERROR' } }, { status: 500, headers: { 'Cache-Control': 'no-store' } }); // Provide a stable retryable unexpected-error state.
    } // Finish centralized error handling.
} // Finish the portable API service.
