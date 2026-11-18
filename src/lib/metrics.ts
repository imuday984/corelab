import type { Subject, Topic, Workspace } from "../../shared/types"; // Reuse the shared data contract for consistent calculations.
export const finished = ["Completed", "Mastered"]; // Count completed reading separately from checkpoint mastery.
export function subjectMetrics(subject: Subject, topics: Topic[], workspace: Workspace) { // Continue this clearly scoped calculation or control declaration.
    // Derive one subject's truthful progress from its saved records.
    const lessons = topics.filter((topic) => topic.subjectId === subject.id); // Limit denominators to the selected curriculum.
    const ids = new Set(lessons.map((topic) => topic.id)); // Make repeated topic ownership lookups inexpensive.
    const completed = workspace.progress.filter( // Calculate or retain this value for the current render.
        (item) => ids.has(item.topicId) && finished.includes(item.status), // Continue this clearly scoped calculation or control declaration.
    ).length; // Count explicitly finished lessons.
    const attempts = workspace.attempts.filter((item) => ids.has(item.topicId)); // Select this subject's assessment evidence.
    const levels = ["Easy", "Medium", "Hard"].map( // Calculate or retain this value for the current render.
        (level) => // Continue this clearly scoped calculation or control declaration.
            new Set( // Continue this clearly scoped calculation or control declaration.
                attempts // Continue this clearly scoped calculation or control declaration.
                    .filter((item) => item.difficulty === level && item.correct === true) // Continue the transformation of this collection.
                    .map((item) => item.questionId), // Continue the transformation of this collection.
            ).size, // Continue this clearly scoped calculation or control declaration.
    ); // Count distinct successful checkpoints per level.
    return { // Return the value or interface produced by this function.
        total: lessons.length, // Define this field in the shared component or request contract.
        completed, // Continue this clearly scoped calculation or control declaration.
        percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0, // Define this field in the shared component or request contract.
        levels, // Continue this clearly scoped calculation or control declaration.
        mastered: workspace.progress.filter((item) => ids.has(item.topicId) && item.status === "Mastered") // Define this field in the shared component or request contract.
            .length, // Continue the transformation of this collection.
    }; // Return display-ready measures.
} // Finish subject progress calculation.
export function overviewMetrics(topics: Topic[], workspace: Workspace) { // Continue this clearly scoped calculation or control declaration.
    // Derive statistics from saved learning records.
    const completed = workspace.progress.filter((item) => finished.includes(item.status)).length; // Count curriculum completion.
    const correct = new Set( // Calculate or retain this value for the current render.
        workspace.attempts.filter((item) => item.correct === true).map((item) => item.questionId), // Continue this clearly scoped calculation or control declaration.
    ).size; // Count unique successful checkpoints.
    const scored = workspace.attempts.filter((item) => item.correct !== null); // Exclude ungraded descriptive answers from accuracy.
    const accuracy = scored.length // Calculate or retain this value for the current render.
        ? Math.round((scored.filter((item) => item.correct).length / scored.length) * 100) // Choose the content appropriate to the current state.
        : 0; // Compute actual checkpoint accuracy.
    const quizQuestions = workspace.quizzes.reduce((sum, quiz) => sum + quiz.total, 0); // Weight differently sized assessments by their actual question count.
    const quizAccuracy = quizQuestions // Calculate or retain this value for the current render.
        ? Math.round((workspace.quizzes.reduce((sum, quiz) => sum + quiz.correct, 0) / quizQuestions) * 100) // Choose the content appropriate to the current state.
        : 0; // Average saved assessment scores.
    const completion = topics.length ? (completed / topics.length) * 100 : 0; // Normalize completion to a percentage.
    const mastery = topics.length // Calculate or retain this value for the current render.
        ? (workspace.progress.filter((item) => item.status === "Mastered").length / topics.length) * 100 // Choose the content appropriate to the current state.
        : 0; // Measure demonstrated mastery.
    const revised = workspace.progress.filter((item) => item.reviewStep > 0).length; // Count topics with recorded revision.
    const consistency = workspace.progress.length ? (revised / workspace.progress.length) * 100 : 0; // Measure revision coverage.
    const readiness = Math.round( // Calculate or retain this value for the current render.
        completion * 0.25 + accuracy * 0.25 + quizAccuracy * 0.25 + mastery * 0.15 + consistency * 0.1, // Continue this clearly scoped calculation or control declaration.
    ); // Combine the documented learning indicators.
    const dates = new Set(workspace.activity.filter((item) => item.count > 0).map((item) => item.date)); // Select real active days.
    let streak = 0; // Start with zero consecutive days.
    const cursor = new Date(); // Start from the current UTC calendar date.
    if (!dates.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1); // Allow today to remain unfinished.
    while (dates.has(cursor.toISOString().slice(0, 10))) { // Continue this clearly scoped calculation or control declaration.
        streak++; // Continue this clearly scoped calculation or control declaration.
        cursor.setUTCDate(cursor.getUTCDate() - 1); // Continue this clearly scoped calculation or control declaration.
    } // Count uninterrupted study dates.
    return { // Return the value or interface produced by this function.
        completed, // Continue this clearly scoped calculation or control declaration.
        correct, // Continue this clearly scoped calculation or control declaration.
        accuracy, // Continue this clearly scoped calculation or control declaration.
        quizAccuracy, // Continue this clearly scoped calculation or control declaration.
        completion: Math.round(completion), // Define this field in the shared component or request contract.
        readiness, // Continue this clearly scoped calculation or control declaration.
        streak, // Continue this clearly scoped calculation or control declaration.
        inProgress: workspace.progress.filter((item) => item.status === "In Progress").length, // Define this field in the shared component or request contract.
        revision: workspace.progress.filter( // Define this field in the shared component or request contract.
            (item) => // Continue this clearly scoped calculation or control declaration.
                item.status === "Needs Revision" || (item.reviewAt && new Date(item.reviewAt) <= new Date()), // Continue this clearly scoped calculation or control declaration.
        ).length, // Continue this clearly scoped calculation or control declaration.
    }; // Return dashboard metrics.
} // Finish overall progress calculation.
