import seeds from './dbms-data.json'; // Load database lessons as editable structured data rather than hardcoding content in React.
import { buildDatabaseLessons, type DatabaseLessonSeed } from './database-helper'; // Reuse the documented curriculum conversion contract.
export const dbmsTopics = buildDatabaseLessons('dbms', seeds as DatabaseLessonSeed[]); // Export complete DBMS lessons for seeding and rendering.
