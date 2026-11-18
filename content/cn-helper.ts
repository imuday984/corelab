import type { Topic } from '../shared/types'; // Share the same lesson contract as the server and frontend.
export interface NetworkLesson { // Keep curriculum authoring readable without repeating presentation scaffolding.
    title: string; // Name the concept precisely.
    module: string; // Place this lesson in its curriculum module.
    slug?: string; // Override the identifier when two modules use the same title.
    definition: string; // State the concept and its practical purpose.
    mechanism: string; // Explain how the concept works internally.
    tradeoff: string; // Record the important limitation or comparison.
    example: string; // Connect the explanation to a concrete situation.
    misconception: string; // Supply an incorrect but plausible basic checkpoint choice.
    scenario: string; // Ask an applied question with a specific context.
    scenarioAnswer: string; // Give the correct applied answer.
    scenarioWrong: string; // Supply a plausible but incorrect applied answer.
    hard: string; // Ask an interview-level question that needs reasoning.
    hardAnswer: string; // Provide the reference explanation for self-assessment.
    reference: string; // Link to an independent authoritative reference.
    diagram?: string[]; // Add a step-by-step workflow where it helps understanding.
    hardQuiz?: { prompt: string; options: string[]; answer: string; explanation: string; hint: string }; // Optionally add an objective interview-level question without removing descriptive practice.
} // Finish the author-friendly curriculum input contract.
export function networkLesson(data: NetworkLesson): Topic { // Convert authored facts into the application's structured lesson format.
    const slug = data.slug ?? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); // Create a stable URL-safe identifier.
    const id = `cn-${slug}`; // Namespace identifiers so lessons from different subjects cannot collide.
    return { // Return independent data instead of embedding lesson copy in React components.
        id, // Use the same identifier for navigation, progress, and checkpoint ownership.
        title: data.title, // Display the authored lesson title.
        subjectId: 'cn', // Connect the topic to Computer Networks.
        module: data.module, // Preserve the explicit module grouping.
        minutes: 7, // Estimate a focused reading and reflection session.
        difficulty: data.module === 'Network Fundamentals' ? 'Easy' : 'Medium', // Set a starting expectation while keeping every checkpoint accessible.
        overview: data.definition, // Introduce the concept before its mechanics.
        sections: [ // Split conceptual understanding from limitations.
            { title: 'How it works', body: data.mechanism }, // Explain the actual protocol or mechanism.
            { title: 'Trade-offs and interview distinctions', body: data.tradeoff }, // Help learners reason beyond the definition.
        ], // Finish the detailed explanation sections.
        example: data.example, // Provide an applied example for the concept.
        interview: [{ question: data.hard, answer: data.hardAnswer, followUp: data.scenario }], // Connect a deep answer to a concrete interviewer follow-up.
        revision: [data.definition, data.tradeoff], // Keep the important facts available for last-minute review.
        resources: [{ title: 'Independent reference: protocol documentation', url: data.reference }], // Point learners to a source outside the authored explanation.
        diagram: data.diagram, // Preserve optional workflow steps for visual understanding.
        questions: [ // Give learners an accessible practice task at every difficulty.
            { // Begin the definition checkpoint.
                id: `${id}-easy`, // Keep this checkpoint stable across repeat attempts.
                difficulty: 'Easy', // Place the question in basic understanding.
                type: 'mcq', // Let the server score this objective question.
                prompt: `Which statement about ${data.title} is accurate?`, // Test the central concept directly.
                options: [data.definition, data.misconception, 'It eliminates every form of network delay and packet loss.'], // Include one true statement and two clear misconceptions.
                answer: data.definition, // Use exact choice text for consistent server-side scoring.
                explanation: data.mechanism, // Explain the mechanism after submission.
                hint: 'Identify the layer, responsibility, and guarantee this concept actually provides.', // Encourage reasoning without revealing the answer.
            }, // Finish the definition checkpoint.
            { // Begin the applied checkpoint.
                id: `${id}-medium`, // Give the applied question an independent attempt history.
                difficulty: 'Medium', // Place this scenario in applied understanding.
                type: 'mcq', // Score the scenario against its reference answer.
                prompt: data.scenario, // Ask the authored practical question.
                options: [data.scenarioWrong, data.scenarioAnswer, 'There is not enough information because networks never expose observable behavior.'], // Keep the correct answer away from the first position here.
                answer: data.scenarioAnswer, // Preserve the precise applied reference answer.
                explanation: `${data.scenarioAnswer} ${data.tradeoff}`, // Connect the answer to the relevant limitation.
                hint: data.example, // Give a concrete example as optional support.
            }, // Finish the applied checkpoint.
            { // Begin the interview checkpoint.
                id: `${id}-hard`, // Keep interview self-assessment distinct from MCQ performance.
                difficulty: 'Hard', // Require deeper interview-level reasoning.
                type: 'descriptive', // Ask learners to write and explicitly assess their answer.
                prompt: data.hard, // Present the authored follow-up scenario.
                answer: data.hardAnswer, // Provide a technically grounded comparison answer.
                explanation: data.tradeoff, // Reinforce the edge case or trade-off.
                hint: data.mechanism, // Offer the mechanics when the learner needs help.
            }, // Finish the interview checkpoint.
            ...(data.hardQuiz ? [{ id: `${id}-hard-mcq`, difficulty: 'Hard' as const, type: 'mcq' as const, ...data.hardQuiz }] : []), // Include an independently scored Hard question when this lesson supplies one.
        ], // Finish the three difficulty levels.
    }; // Return the complete topic record.
} // Finish the reusable curriculum adapter.
