// Curriculum seeding inserts structured records without creating schema during requests.
import { subjects, topics } from '../content/index'; // Load the versioned initial curriculum from content files.
import type { Subject, Topic } from '../shared/types'; // Keep database content aligned with the shared contract.
import { rows, type Database, type Statement } from './db'; // Use the portable parameterized database interface.
const pending = new WeakMap<Database, Promise<void>>(); // Prevent duplicate initialization within one runtime.
const moduleId = (topic: Topic): string => `${topic.subjectId}:${topic.module}`; // Give every module a stable per-subject identity.
function inserts(db: Database, table: string, columns: string[], records: unknown[][], conflictColumns: string[]): Statement[] { // Build bounded multi-row inserts from developer-authored table and column identifiers.
    const statements: Statement[] = []; // Collect fewer SQL queries than there are seed records.
    const rowsPerStatement = Math.floor(100 / columns.length); // Stay within D1's one-hundred-bound-parameter limit.
    for (let index = 0; index < records.length; index += rowsPerStatement) { // Split a table into predictable portable query sizes.
        const selected = records.slice(index, index + rowsPerStatement); // Keep each query's values within the D1 bound.
        const placeholders = selected.map(() => `(${columns.map(() => '?').join(', ')})`).join(', '); // Bind every record value separately from authored SQL identifiers.
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} ON CONFLICT (${conflictColumns.join(', ')}) DO NOTHING`; // Preserve existing editorial records during repeat seeds.
        statements.push(db.prepare(sql).bind(...selected.flat())); // Reuse the exact same bound SQL on D1, SQLite, and PostgreSQL.
    } // Finish batching this table's records.
    return statements; // Preserve insertion order for foreign-key dependencies.
} // Finish the portable multi-row insert helper.
export async function seedCurriculum(db: Database): Promise<void> { // Insert initial data while preserving later database edits.
    const modules = new Map(topics.map(topic => [moduleId(topic), topic])); // Deduplicate repeated module titles before binding SQL values.
    const statements = [ // Order all writes so parent foreign keys exist before child records.
        ...inserts(db, 'subjects', ['id', 'data'], subjects.map(subject => [subject.id, JSON.stringify(subject)]), ['id']), // Seed shared subject metadata in one bounded query.
        ...inserts(db, 'modules', ['id', 'subject_id', 'title'], [...modules].map(([id, topic]) => [id, topic.subjectId, topic.module]), ['id']), // Seed subject modules before topic records.
        ...inserts(db, 'topics', ['id', 'subject_id', 'module_id', 'data'], topics.map(topic => [topic.id, topic.subjectId, moduleId(topic), JSON.stringify(topic)]), ['id']), // Store complete editable structured lessons.
        ...inserts(db, 'learning_material', ['topic_id', 'data'], topics.map(topic => [topic.id, JSON.stringify({ overview: topic.overview, sections: topic.sections, example: topic.example, interview: topic.interview, revision: topic.revision, resources: topic.resources })]), ['topic_id']), // Keep learning materials independently addressable.
        ...inserts(db, 'checkpoints', ['id', 'topic_id', 'data'], topics.flatMap(topic => topic.questions.map(question => [question.id, topic.id, JSON.stringify(question)])), ['id']), // Seed stable checkpoint references without one query per question.
    ]; // Finish the parent-before-child seed inventory.
    await db.batch(statements); // Seed the complete curriculum atomically using thirty-eight queries for the initial dataset.
} // Finish initial data seeding.
export async function ensureCurriculum(db: Database): Promise<void> { // Initialize an empty installation once, with no runtime DDL.
    let operation = pending.get(db); // Reuse an initialization already in flight.
    if (!operation) { // Initialize only once for this database adapter instance.
        operation = (async () => { // Encapsulate the bounded initial read and data seed.
            const existing = await rows<{ id: string }>(db, 'SELECT id FROM subjects LIMIT 1'); // Check whether curriculum already exists.
            if (!existing.length) await seedCurriculum(db); // Seed only an empty database so editorial changes remain intact.
        })(); // Start the initialization immediately.
        pending.set(db, operation); // Share the same promise across simultaneous requests.
        operation.catch(() => pending.delete(db)); // Permit recovery after a transient database failure.
    } // Finish initialization selection.
    await operation; // Wait until foreign-key targets are available.
} // Finish curriculum initialization.
export async function getCurriculum(db: Database): Promise<{ subjects: Subject[]; topics: Topic[] }> { // Read editable content from the database.
    const [subjectRows, topicRows] = await Promise.all([rows<{ data: string }>(db, 'SELECT data FROM subjects'), rows<{ data: string }>(db, 'SELECT data FROM topics')]); // Read the independent shared content records together.
    return { subjects: subjectRows.map(item => JSON.parse(item.data) as Subject), topics: topicRows.map(item => JSON.parse(item.data) as Topic) }; // Decode the structured contracts at the service boundary.
} // Finish content loading.
