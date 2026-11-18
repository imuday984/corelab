// This file is the contract shared by curriculum, API services, and React screens.
export type Difficulty = 'Easy' | 'Medium' | 'Hard'; // Keep the three assessment levels consistent everywhere.
export type TopicStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Needs Revision' | 'Mastered'; // Separate reading from demonstrated mastery.
export interface Question { // Describe a checkpoint or quiz question stored with a topic.
    id: string; // Give every question a stable curriculum identifier.
    difficulty: Difficulty; // Select the question's difficulty tab.
    type: 'mcq' | 'descriptive' | 'sql'; // Determine how the learner answers.
    prompt: string; // Present the task in plain language.
    options?: string[]; // Supply choices only for automatically scored questions.
    answer: string; // Keep the reference answer available for review.
    explanation: string; // Explain why the reference answer is correct.
    hint: string; // Offer help without marking the answer correct.
}
export interface Topic { // Describe one self-contained learning lesson.
    id: string; // Use stable slugs to connect progress to content.
    title: string; // Show the lesson name in navigation.
    subjectId: string; // Associate the lesson with its subject.
    module: string; // Group related lessons within a subject.
    minutes: number; // Estimate focused reading time.
    difficulty: Difficulty; // Give learners a useful starting expectation.
    overview: string; // Introduce the concept and why it matters.
    sections: { title: string; body: string }[]; // Divide the explanation into readable sections.
    example: string; // Provide a practical example or code sample.
    interview: { question: string; answer: string; followUp: string }[]; // Provide expandable interview preparation.
    revision: string[]; // Summarize the most useful revision points.
    resources: { title: string; url: string }[]; // Link to independent reference material.
    questions: Question[]; // Include accessible Easy, Medium, and Hard practice.
    diagram?: string[]; // Optionally show a short visual workflow.
    sql?: { tables: { name: string; columns: string[]; rows: string[][] }[]; expected: string[][]; solution: string; alternative?: string }; // Add complete SQL challenge examples.
}
export interface Subject { // Describe the metadata used on subject cards.
    id: string; // Connect the subject to lessons and analytics.
    title: string; // Show the full subject name.
    shortTitle: string; // Show a concise label in charts.
    description: string; // Explain what this subject teaches.
    color: string; // Supply the subject's accessible accent color.
    icon: string; // Identify a Lucide icon in the presentation layer.
}
export interface Attempt { // Preserve each checkpoint attempt instead of overwriting history.
    id: string; // Identify this individual attempt.
    topicId: string; // Connect the attempt to its lesson.
    questionId: string; // Connect the attempt to its question.
    answer: string; // Preserve the learner's answer.
    correct: boolean | null; // Leave descriptive answers ungraded until explicitly self-assessed.
    difficulty: Difficulty; // Calculate performance by level.
    createdAt: string; // Place the attempt in learning history.
}
export interface Progress { // Describe one learner's progress in one topic.
    topicId: string; // Enforce a single progress record per learner and topic.
    status: TopicStatus; // Distinguish the five learning states.
    viewed: boolean; // Remember whether the material was opened.
    updatedAt: string; // Power recent activity and continue learning.
    reviewStep: number; // Track the spaced repetition interval.
    reviewAt: string | null; // Schedule the next revision.
}
export interface QuizResult { // Preserve a completed assessment and its answers.
    id: string; // Identify the attempt in history.
    subjectId: string; // Use 'all' for mixed fundamentals assessments.
    topicId?: string; // Support topic-specific mastery evidence.
    score: number; // Record percentage accuracy calculated by the server.
    correct: number; // Record the number of correct answers.
    total: number; // Record the number of scored questions.
    seconds: number; // Record the time spent on the assessment.
    createdAt: string; // Order quiz history chronologically.
    answers: { questionId: string; topicId: string; answer: string; correct: boolean }[]; // Connect mistakes to revision recommendations.
}
export interface User { // Expose only safe profile fields to the client.
    id: string; // Use the authenticated server identity for all ownership checks.
    name: string; // Personalize the workspace.
    email: string; // Show the signed-in account.
}
export interface Workspace { // Return the signed-in learner's complete private workspace.
    user: User | null; // Use null for an anonymous practice workspace.
    progress: Progress[]; // Store topic learning and revision state.
    attempts: Attempt[]; // Retain checkpoint history.
    quizzes: QuizResult[]; // Retain quiz history.
    bookmarks: string[]; // Store bookmarked topic identifiers.
    notes: { topicId: string; text: string; updatedAt: string }[]; // Store personal study notes.
    activity: { date: string; count: number }[]; // Aggregate real learning events by calendar date.
    settings: { dailyGoal: number; easy: number; medium: number; hard: number; assessment: number }; // Make mastery thresholds editable.
}
