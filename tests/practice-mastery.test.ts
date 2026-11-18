import assert from 'node:assert/strict'; // Compare actual mastery outcomes with the intended learning rules.
import { test } from 'node:test'; // Run these focused domain tests with the project's standard test command.
import { topics } from '../content'; // Exercise the real seeded checkpoint structure instead of a simplified mock.
import { practiceTopicMastered } from '../src/lib/store'; // Verify the anonymous-practice rule used by the browser workspace.
import type { Attempt, QuizResult, Workspace } from '../shared/types'; // Keep fixtures aligned with the same application data contract.
const topic = topics[0]; // Select a representative complete lesson from the seed curriculum.
const stamp = '2026-11-17T10:00:00.000Z'; // Keep evidence order deterministic across test runs.
const attempt = (questionId: string, correct: boolean | null, createdAt = stamp): Attempt => ({ id: `${questionId}-${createdAt}`, topicId: topic.id, questionId, answer: 'A deliberate learner response', correct, difficulty: topic.questions.find(question => question.id === questionId)!.difficulty, createdAt }); // Create one explicit assessed or unassessed response.
const workspace = (): Workspace => ({ user: null, progress: [{ topicId: topic.id, status: 'Completed', viewed: true, updatedAt: stamp, reviewStep: 0, reviewAt: null }], attempts: [], quizzes: [], bookmarks: [], notes: [], activity: [], settings: { dailyGoal: 3, easy: 100, medium: 80, hard: 70, assessment: 80 } }); // Start with completed reading and no invented understanding evidence.
const assessment = (): QuizResult => ({ id: 'complete-topic-assessment', topicId: topic.id, subjectId: topic.subjectId, score: 100, correct: topic.questions.filter(question => question.type === 'mcq').length, total: topic.questions.filter(question => question.type === 'mcq').length, seconds: 60, createdAt: stamp, answers: topic.questions.filter(question => question.type === 'mcq').map(question => ({ questionId: question.id, topicId: topic.id, answer: question.answer, correct: true })) }); // Model a full topic assessment across every automatically scorable checkpoint.
function fullEvidence(): Workspace { // Assemble enough deliberate evidence to meet the default mastery thresholds.
    const result = workspace(); // Keep each test independent from the others.
    result.attempts = topic.questions.map(question => attempt(question.id, true)); // Assess every checkpoint at all three difficulty levels.
    result.quizzes = [assessment()]; // Add a complete passing topic assessment.
    return result; // Return the isolated mastery fixture.
} // Finish the evidence fixture factory.
test('reading completion alone never grants practice mastery', () => { // Guard the central distinction between reading and demonstrated understanding.
    assert.equal(practiceTopicMastered(topic, workspace()), false); // Require actual performance beyond the completed reading action.
}); // Finish the reading-only test.
test('complete checkpoint and topic assessment evidence grants practice mastery', () => { // Verify the intended successful learning path.
    assert.equal(practiceTopicMastered(topic, fullEvidence()), true); // Accept a learner who satisfies every configured requirement.
}); // Finish the successful mastery test.
test('a hand-selected partial topic quiz cannot grant practice mastery', () => { // Prevent a single easy answer from representing a full assessment.
    const evidence = fullEvidence(); // Begin with complete checkpoint evidence.
    evidence.quizzes[0].answers = evidence.quizzes[0].answers.slice(0, 1); // Deliberately remove the rest of the topic assessment inventory.
    assert.equal(practiceTopicMastered(topic, evidence), false); // Require every canonical MCQ in the topic assessment.
}); // Finish the incomplete-assessment test.
test('the latest incorrect response revokes outdated practice mastery', () => { // Ensure historical best answers cannot hide a current misunderstanding.
    const evidence = fullEvidence(); // Begin with a previously passing learner.
    const easy = topic.questions.find(question => question.difficulty === 'Easy')!; // Select an easy checkpoint whose threshold requires full understanding.
    evidence.attempts.push(attempt(easy.id, false, '2026-11-17T11:00:00.000Z')); // Preserve the earlier correct attempt and append the newer mistake.
    assert.equal(practiceTopicMastered(topic, evidence), false); // Evaluate the latest evidence instead of any historical correct answer.
}); // Finish the latest-response test.
test('unassessed descriptive submissions do not count as understanding', () => { // Protect the distinction between submitting text and explicitly assessing it.
    const evidence = fullEvidence(); // Begin with complete prior evidence.
    const hard = topic.questions.find(question => question.type !== 'mcq')!; // Select the authored descriptive checkpoint.
    evidence.attempts.push(attempt(hard.id, null, '2026-11-17T12:00:00.000Z')); // Append a new answer that has not been compared and assessed.
    assert.equal(practiceTopicMastered(topic, evidence), false); // Keep the latest unassessed response out of mastery calculations.
}); // Finish the descriptive-evidence test.
