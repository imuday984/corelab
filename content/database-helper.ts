import type { Topic } from '../shared/types'; // Import the common lesson contract without adding a runtime dependency.
export interface DatabaseLessonSeed { // Describe the editable source fields stored in the accompanying JSON curriculum.
    title: string; // Preserve the human-readable topic name from the project curriculum.
    module: string; // Group this lesson with its related database concepts.
    summary: string; // Explain what the concept means and why a developer needs it.
    mechanism: string; // Explain the important internal behavior accurately.
    tradeoff: string; // Explain an application, limitation, or comparison that an interviewer may ask about.
    example: string; // Provide a concrete scenario or code sample for the learner.
    easy: [string, string, string, string]; // Store a question followed by its correct answer and two plausible distractors.
    medium: [string, string, string, string]; // Store an applied question with a separately authored correct answer.
    hard: [string, string]; // Store an interview scenario and a specific reference answer for self-assessment.
    source: string; // Link to an independent technical source rather than presenting generated notes as authoritative.
    hardChoice?: { prompt: string; options: string[]; answer: string; explanation: string; hint: string }; // Optionally add an automatically scorable advanced scenario alongside descriptive practice.
} // Finish the editable database lesson source contract.
export function buildDatabaseLessons(subjectId: string, seeds: DatabaseLessonSeed[]): Topic[] { // Convert editable content records into the shared application shape.
    return seeds.map((seed) => { // Keep every record independent so adding a lesson requires only editing the data file.
        const id = `${subjectId}-${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`; // Derive a stable, readable identifier from each topic's title.
        const makeChoice = (level: 'Easy' | 'Medium', input: DatabaseLessonSeed['easy']) => ({ // Construct consistent multiple-choice metadata around topic-specific questions.
            id: `${id}-${level.toLowerCase()}`, // Connect question attempts to this exact curriculum record.
            difficulty: level, // Keep Easy and Medium accessible without prerequisite locks.
            type: 'mcq' as const, // Ask the backend to score an exact choice rather than grade free text automatically.
            prompt: input[0], // Show the authored topic-specific checkpoint question.
            options: [input[1], input[2], input[3]], // Preserve the three meaningful choices; assessment code may shuffle their order.
            answer: input[1], // Keep the correct reference value independent of display order.
            explanation: level === 'Easy' ? seed.mechanism : seed.tradeoff, // Explain the concept behind the answer after submission.
            hint: level === 'Easy' ? seed.summary : seed.mechanism, // Point the learner back to relevant material without grading their response.
        }); // Finish constructing the checkpoint record.
        return { // Return the complete learning material consumed by both API and React pages.
            id, // Reuse this identifier for notes, bookmarks, progress, and attempts.
            title: seed.title, // Display the curriculum topic name.
            subjectId, // Associate this record with DBMS or NoSQL.
            module: seed.module, // Preserve the subject's module hierarchy.
            minutes: 7, // Give the learner a conservative estimate for reading and reflecting on this concise lesson.
            difficulty: seed.module.includes('Fundamentals') ? 'Easy' : 'Medium', // Suggest a starting level while keeping all questions available.
            overview: seed.summary, // Introduce the lesson in a concise paragraph.
            sections: [ // Separate internal behavior from engineering consequences.
                { title: 'How it works', body: seed.mechanism }, // Explain the central mechanism with correct terminology.
                { title: 'Design implications', body: seed.tradeoff }, // Connect the theory to a practical design decision.
            ], // Finish the structured explanatory sections.
            example: seed.example, // Show a concrete example that can be discussed in an interview.
            interview: [{ question: seed.hard[0], answer: seed.hard[1], followUp: `Which assumption in this example would change your choice of ${seed.title.toLowerCase()}?` }], // Encourage the learner to justify trade-offs beyond memorized definitions.
            revision: [seed.summary, seed.tradeoff], // Preserve two concept-specific notes for later revision.
            resources: [{ title: 'Reference documentation', url: seed.source }], // Provide an independent source to verify and extend the lesson.
            questions: [ // Include all three difficulty levels in every lesson.
                makeChoice('Easy', seed.easy), // Check the core definition using a topic-specific question.
                makeChoice('Medium', seed.medium), // Test an applied design or behavior question.
                ...(seed.hardChoice ? [{ ...seed.hardChoice, id: `${id}-hard-mcq`, difficulty: 'Hard' as const, type: 'mcq' as const }] : []), // Include an authored advanced multiple-choice scenario when this lesson supplies one.
                { id: `${id}-hard`, difficulty: 'Hard', type: 'descriptive', prompt: seed.hard[0], answer: seed.hard[1], explanation: seed.hard[1], hint: seed.tradeoff }, // Require explicit comparison with a reference answer before self-assessing a descriptive response.
            ], // Finish the checkpoint collection.
        }; // Finish this topic's complete curriculum record.
    }); // Finish mapping the editable source records.
} // Finish the shared database curriculum builder.
