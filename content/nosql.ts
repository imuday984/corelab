import seeds from './nosql-data.json'; // Load the independently editable NoSQL curriculum records.
import { buildDatabaseLessons, type DatabaseLessonSeed } from './database-helper'; // Reuse the common typed conversion for database lessons.
export const nosqlTopics = buildDatabaseLessons('nosql', seeds as DatabaseLessonSeed[]); // Export all NoSQL lessons for the curriculum and seed process.
