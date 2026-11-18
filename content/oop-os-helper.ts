// This authoring helper expands concise, topic-specific curriculum records into the shared lesson format.
import type { Topic, Question } from '../shared/types'; // Reuse the same content contract as the API and lesson screens.
export interface LessonSeed { // Keep authoring fields named so a student can safely edit one concept.
    title: string; // Display the concept's full name.
    module: string; // Group related concepts in the curriculum outline.
    definition: string; // Explain the concept in a technically precise sentence.
    mechanism: string; // Explain its internal behavior and relevant limitations.
    example: string; // Demonstrate a concrete use case or worked example.
    misconception: string; // Supply a plausible false statement for the basic checkpoint.
    appliedQuestion: string; // Ask a distinct practical question about this concept.
    appliedAnswer: string; // Supply the correct answer to the practical question.
    appliedWrong: string; // Supply a plausible incorrect practical answer.
    hardQuestion: string; // Ask an interview-level question requiring reasoning.
    hardAnswer: string; // Explain the reasoning expected in a strong interview answer.
    followUp: string; // Suggest an additional interview discussion.
    resource: string; // Link to an independent technical reference.
    diagram?: string[]; // Optionally provide a sequence or conceptual diagram.
} // Finish the curriculum authoring contract.
export function makeLessons(subjectId: 'oop' | 'os', seeds: LessonSeed[]): Topic[] { // Convert editable seed records into complete lessons.
    return seeds.map((seed) => { // Preserve the authored order within each subject.
        const slug = seed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); // Produce a readable, stable topic identifier.
        const moduleSlug = seed.module.toLowerCase().replace(/[^a-z0-9]+/g, '-'); // Distinguish repeated algorithm names in different modules.
        const id = `${subjectId}-${moduleSlug}-${slug}`; // Keep scheduling FCFS separate from disk FCFS.
        const basicOptions = [seed.definition, seed.misconception]; // Use one correct definition and one topic-specific misconception.
        const appliedOptions = [seed.appliedWrong, seed.appliedAnswer]; // Alternate the correct position so practice is less predictable.
        return { // Assemble the lesson expected by the learning page.
            id, // Connect checkpoints and learner progress to this lesson.
            title: seed.title, // Render the curriculum title without abbreviating it.
            subjectId, // Associate the lesson with Object-Oriented Programming or Operating Systems.
            module: seed.module, // Place the lesson under its authored module heading.
            minutes: seed.module === 'Core Concepts' ? 5 : 7, // Give a modest reading estimate for the concise reference material.
            difficulty: seed.module === 'Core Concepts' || seed.module === 'Process Management' ? 'Easy' : 'Medium', // Suggest a starting level without locking any practice.
            overview: seed.definition, // Introduce the concept before its details.
            sections: [ // Organize the lesson into focused blocks.
                { title: 'How it works', body: seed.mechanism }, // Explain the implementation or conceptual mechanism.
                { title: 'A practical application', body: seed.example }, // Connect the mechanism to a concrete example.
                { title: 'A common misconception', body: `Misconception: ${seed.misconception}\n\nCorrection: ${seed.definition}` }, // Explicitly distinguish the misleading statement from the correct concept.
            ], // Finish the structured explanation.
            example: seed.example, // Make the worked example available in the dedicated example panel.
            interview: [{ question: seed.hardQuestion, answer: seed.hardAnswer, followUp: seed.followUp }], // Provide a complete expandable interview answer.
            revision: [seed.definition, seed.appliedAnswer, seed.hardAnswer], // Preserve the most useful points for focused revision.
            resources: [{ title: 'Independent reference and further reading', url: seed.resource }], // Encourage checking the explanation against established documentation.
            questions: [ // Keep all difficulty levels immediately accessible.
                { id: `${id}-easy`, difficulty: 'Easy', type: 'mcq', prompt: `Which statement correctly explains ${seed.title}?`, options: basicOptions, answer: seed.definition, explanation: seed.mechanism, hint: 'Compare the definition with the misconception discussed in the lesson.' }, // Check the specific concept rather than whether the page was opened.
                { id: `${id}-medium`, difficulty: 'Medium', type: 'mcq', prompt: seed.appliedQuestion, options: appliedOptions, answer: seed.appliedAnswer, explanation: seed.example, hint: seed.definition }, // Test the authored practical scenario with an objectively scored answer.
                { id: `${id}-hard`, difficulty: 'Hard', type: 'descriptive', prompt: seed.hardQuestion, answer: seed.hardAnswer, explanation: seed.hardAnswer, hint: seed.followUp }, // Require an explicit comparison with the reference answer instead of automatically accepting prose.
            ], // Finish this lesson's checkpoint collection.
            ...(seed.diagram ? { diagram: seed.diagram } : {}), // Include a visual sequence only where it explains the topic.
        }; // Return the fully structured lesson.
    }); // Finish expanding the editable curriculum records.
} // Finish the shared OOP and OS content helper.

export interface HardQuizSeed { // Describe an additional objectively scored Hard question for a selected lesson.
    topicTitle: string; // Match the authored lesson by its human-readable title.
    prompt: string; // Ask a concrete question that requires deeper reasoning.
    options: string[]; // Provide distinct, technically meaningful answer choices.
    answer: string; // Store the exact correct option for consistent server-side scoring.
    explanation: string; // Explain why the correct answer follows from the scenario.
    hint: string; // Offer a smaller reasoning step before the learner submits.
} // Finish the optional Hard-quiz authoring contract.
export function withHardQuiz(topics: Topic[], extraQuestions: HardQuizSeed[]): Topic[] { // Preserve descriptive practice while adding scored Hard quiz coverage.
    return topics.map((topic) => { // Retain curriculum order and stable topic identifiers.
        const extra = extraQuestions.find((question) => question.topicTitle === topic.title); // Find any authored Hard MCQ for this topic.
        if (!extra) return topic; // Leave topics without an extra scored question unchanged.
        const question: Question = { // Build a checkpoint using the same contract as existing questions.
            id: `${topic.id}-hard-mcq`, // Avoid colliding with the existing descriptive Hard checkpoint.
            difficulty: 'Hard', // Make the checkpoint available to filtered Hard quizzes.
            type: 'mcq', // Enable objective grading on the server.
            prompt: extra.prompt, // Present the specific reasoning scenario.
            options: extra.options, // Render the authored choices.
            answer: extra.answer, // Match exactly one authored choice during scoring.
            explanation: extra.explanation, // Explain the conclusion after submission.
            hint: extra.hint, // Support learning before grading.
        }; // Finish the additional checkpoint.
        return { ...topic, questions: [...topic.questions, question] }; // Add the MCQ without deleting descriptive interview practice.
    }); // Finish extending the selected lessons.
} // Finish the optional Hard-quiz helper.
