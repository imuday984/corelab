import assert from 'node:assert/strict'; // Fail with precise messages when curriculum records violate required invariants.
import test from 'node:test'; // Run content checks with the same built-in test runner used by backend tests.
import { DatabaseSync } from 'node:sqlite'; // Execute portable SQL examples against real sample tables rather than inspecting query strings alone.
import { subjects, topics } from '../content/index'; // Validate the complete authored curriculum consumed by both application runtimes.
const expectedSubjects = ['cn', 'dbms', 'nosql', 'oop', 'os', 'sql']; // Require all six subjects from the project brief.
const levels = ['Easy', 'Medium', 'Hard']; // Require every topic to expose the three independently accessible checkpoint levels.
test('curriculum contains all six subjects and stable globally unique identifiers', () => { // Protect cross-subject navigation and learner progress references.
    assert.deepEqual(subjects.map((subject) => subject.id).sort(), expectedSubjects); // Detect missing subjects and unintended duplicate metadata records.
    const topicIds = topics.map((topic) => topic.id); // Collect stable identifiers referenced by database progress, notes, and attempts.
    assert.equal(new Set(topicIds).size, topicIds.length, 'Topic identifiers must be globally unique.'); // Prevent one lesson from overwriting another lesson's learner state.
    const questionIds = topics.flatMap((topic) => topic.questions.map((question) => question.id)); // Collect checkpoint identifiers across the entire seed dataset.
    assert.equal(new Set(questionIds).size, questionIds.length, 'Checkpoint identifiers must be globally unique.'); // Prevent cross-topic attempt-history collisions.
    for (const subject of subjects) { // Verify every published subject has usable content rather than an empty dashboard card.
        assert.ok(topics.some((topic) => topic.subjectId === subject.id), `${subject.title} must contain lessons.`); // Require an actual topic record for each metadata entry.
    } // Finish checking subject coverage.
    for (const topic of topics) { // Check that lesson identifiers are safe and belong to their declared subject.
        assert.ok(expectedSubjects.includes(topic.subjectId), `${topic.id} references an unknown subject.`); // Catch orphaned lessons before seeding or rendering.
        assert.match(topic.id, new RegExp(`^${topic.subjectId}-[a-z0-9]+(?:-[a-z0-9]+)*$`), `${topic.id} must be a namespaced URL-safe slug.`); // Keep identifiers stable and safe for API paths.
    } // Finish checking stable identifier structure.
}); // Finish the curriculum identity test.
test('every lesson includes explanations, examples, interview answers, revision notes, and reference URLs', () => { // Reject empty placeholder topics while allowing concise lessons.
    for (const topic of topics) { // Apply material requirements to every authored lesson, not just a representative sample.
        assert.ok(topic.title.trim() && topic.module.trim(), `${topic.id} needs a title and module.`); // Preserve the requested subject-module-topic hierarchy.
        assert.ok(topic.overview.trim().length >= 30, `${topic.id} needs a meaningful overview.`); // Reject empty or one-word introductions.
        assert.ok(topic.sections.length >= 2, `${topic.id} needs at least two explanation sections.`); // Require structured explanations and practical distinctions.
        for (const section of topic.sections) { // Validate each section that the learning page will render.
            assert.ok(section.title.trim() && section.body.trim().length >= 30, `${topic.id} has an empty explanation section.`); // Catch missing explanatory body text.
        } // Finish inspecting detailed explanations.
        assert.ok(topic.example.trim().length >= 15, `${topic.id} needs a concrete example.`); // Ensure examples are actual content rather than blank labels.
        assert.ok(topic.interview.length > 0, `${topic.id} needs an interview question.`); // Require interview preparation beyond checkpoint practice.
        for (const question of topic.interview) { // Validate expandable interview answers and follow-ups.
            assert.ok(question.question.trim() && question.answer.trim().length >= 20 && question.followUp.trim(), `${topic.id} has incomplete interview material.`); // Ensure every expanded answer can actually teach the concept.
        } // Finish inspecting interview content.
        assert.ok(topic.revision.length > 0 && topic.revision.every((note) => note.trim()), `${topic.id} needs revision notes.`); // Avoid an empty quick-review section.
        assert.ok(topic.resources.length > 0, `${topic.id} needs an independent reference.`); // Keep authored explanations connected to outside technical documentation.
        for (const resource of topic.resources) { // Check each resource URL without requiring a flaky live network request.
            const url = new URL(resource.url); // Reject malformed URLs before exposing them as clickable resources.
            assert.equal(url.protocol, 'https:', `${topic.id} reference must use HTTPS.`); // Require secure external reference links.
            assert.ok(url.hostname.includes('.') && resource.title.trim(), `${topic.id} has incomplete resource metadata.`); // Reject empty hosts and inaccessible unnamed links.
        } // Finish validating independent resources.
    } // Finish checking material for all topics.
}); // Finish the learning-material completeness test.
test('every topic has all difficulty levels and every objective question has an exact valid answer', () => { // Protect assessment scoring and open difficulty navigation.
    for (const topic of topics) { // Check every lesson, including SQL challenge records.
        for (const difficulty of levels) { // Verify Easy, Medium, and Hard remain available independently.
            assert.ok(topic.questions.some((question) => question.difficulty === difficulty), `${topic.id} is missing ${difficulty} practice.`); // Prevent an empty difficulty tab.
        } // Finish checking the three levels.
        for (const question of topic.questions) { // Check scoring metadata for every authored checkpoint.
            assert.ok(question.id.startsWith(`${topic.id}-`), `${question.id} must belong to ${topic.id}.`); // Keep attempt ownership and curriculum lookup aligned.
            assert.ok(question.prompt.trim() && question.answer.trim() && question.explanation.trim() && question.hint.trim(), `${question.id} has incomplete learning feedback.`); // Ensure submitted attempts can show useful reference feedback.
            if (question.type === 'mcq') { // Apply stricter invariants to automatically scored questions only.
                assert.ok(question.options && question.options.length >= 2, `${question.id} needs at least two choices.`); // Require an actual multiple-choice decision.
                assert.equal(new Set(question.options).size, question.options.length, `${question.id} repeats an answer choice.`); // Eliminate visually ambiguous duplicate choices.
                assert.ok(question.options.includes(question.answer), `${question.id} answer must match an option exactly.`); // Prevent impossible-to-score exact-answer mismatches.
            } // Finish validating objective scoring metadata.
        } // Finish checking this topic's checkpoints.
    } // Finish checking assessment coverage.
}); // Finish the assessment-shape test.
test('representative networking lessons include objective Hard questions and retain descriptive practice', () => { // Ensure Hard quizzes can include networking questions without losing interview writing practice.
    const objectiveTopics = topics.filter((topic) => topic.subjectId === 'cn' && topic.questions.some((question) => question.difficulty === 'Hard' && question.type === 'mcq')); // Find topics available to automatically scored Hard assessments.
    assert.ok(objectiveTopics.length >= 8, 'At least eight CN topics must have objectively scored Hard checkpoints.'); // Require the requested representative Hard question bank.
    for (const topic of objectiveTopics) { // Check that adding objective questions did not remove the richer interview exercise.
        assert.ok(topic.questions.some((question) => question.difficulty === 'Hard' && question.type === 'descriptive'), `${topic.id} must retain descriptive Hard practice.`); // Preserve explicit written self-assessment alongside server-scored MCQs.
    } // Finish preserving descriptive practice.
}); // Finish the networking Hard assessment test.
test('all nine SQL challenges include coherent sample tables, expected output, and solution queries', () => { // Catch incomplete challenge data that would make practice impossible.
    const challenges = topics.filter((topic) => topic.subjectId === 'sql' && topic.module === 'Interview SQL Challenges'); // Select the specific interview exercises from the full SQL subject.
    assert.equal(challenges.length, 9, 'The initial curriculum must include all nine requested SQL challenges.'); // Protect explicit challenge coverage from the brief.
    for (const topic of challenges) { // Validate every challenge rather than just its listing entry.
        assert.ok(topic.sql, `${topic.id} needs SQL sample data.`); // Narrow the optional challenge field before checking its contents.
        assert.ok(topic.sql.tables.length > 0 && topic.sql.solution.trim(), `${topic.id} needs tables and a solution query.`); // Require runnable input and reference logic.
        assert.ok(topic.sql.expected.length > 0, `${topic.id} needs explicit expected output.`); // Give learners a way to compare their result.
        for (const table of topic.sql.tables) { // Inspect the dimensions and identifiers of each sample relation.
            assert.match(table.name, /^[a-z_][a-z0-9_]*$/i, `${topic.id} uses an invalid sample table identifier.`); // Keep generated test DDL limited to known-safe SQL identifiers.
            assert.ok(table.columns.length > 0 && table.rows.length > 0, `${topic.id} needs nonempty sample table data.`); // Reject unusable empty fixtures.
            assert.equal(new Set(table.columns).size, table.columns.length, `${topic.id} repeats a sample column.`); // Avoid ambiguous table definitions.
            for (const column of table.columns) assert.match(column, /^[a-z_][a-z0-9_]*$/i); // Limit column names to safe SQL identifiers before executing fixtures.
            for (const row of table.rows) assert.equal(row.length, table.columns.length, `${topic.id} sample row must match its columns.`); // Detect shifted or missing input cells.
        } // Finish checking sample relations.
    } // Finish validating complete SQL challenges.
}); // Finish the SQL fixture completeness test.
test('portable SQL reference solutions produce their stated output from the provided samples', async (context) => { // Execute actual SQL to catch incorrect expected answers and query logic.
    const challenges = topics.filter((topic) => topic.sql && !/\bDELETE\b/i.test(topic.sql.solution)); // PostgreSQL DELETE USING needs PostgreSQL; run the eight portable SELECT examples in built-in SQLite.
    assert.equal(challenges.length, 8, 'Eight portable SELECT challenges must be available for executable validation.'); // Keep a skipped destructive PostgreSQL dialect example explicit.
    for (const topic of challenges) { // Isolate each SQL lesson so failures identify the exact broken exercise.
        await context.test(topic.title, () => { // Create a named subtest for each independently executed query.
            const db = new DatabaseSync(':memory:'); // Give every exercise a fresh isolated relational database.
            try { // Close the database even when a sample or query fails.
                for (const table of topic.sql!.tables) { // Reconstruct the actual sample relations consumed by the reference query.
                    const definitions = table.columns.map((column, index) => { // Infer numeric columns from complete sample data to preserve arithmetic and sorting semantics.
                        const numeric = table.rows.every((row) => row[index] === 'NULL' || /^-?\d+(?:\.\d+)?$/.test(row[index])); // Keep salary and ID values numeric rather than lexicographic text.
                        return `"${column}" ${numeric ? 'NUMERIC' : 'TEXT'}`; // Identifiers were validated by the preceding fixture test and are quoted consistently.
                    }); // Finish building the fixture table definition.
                    db.exec(`CREATE TABLE "${table.name}" (${definitions.join(', ')})`); // Create one schema-only sample table in the isolated test database.
                    const insert = db.prepare(`INSERT INTO "${table.name}" VALUES (${table.columns.map(() => '?').join(', ')})`); // Parameterize every sample value instead of concatenating data into SQL.
                    for (const row of table.rows) insert.run(...row.map((value) => value === 'NULL' ? null : value)); // Preserve SQL NULL instead of inserting the literal text NULL.
                } // Finish loading the exercise inputs.
                const actual = db.prepare(topic.sql!.solution).all().map((row) => Object.values(row).map((value) => value === null ? 'NULL' : String(value))); // Execute the authored query and normalize values to the curriculum display format.
                assert.deepEqual(actual, topic.sql!.expected, `${topic.id} output does not match its stated expected result.`); // Verify joins, ranking, grouping, and NULL behavior against actual database results.
            } finally { // Release the fixture database regardless of assertion outcome.
                db.close(); // Avoid leaking a database handle across tests.
            } // Finish this exercise's isolated execution.
        }); // Finish the named SQL subtest.
    } // Finish executing all portable SQL reference queries.
}); // Finish the executable SQL correctness test.
