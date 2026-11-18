import type { Topic } from '../shared/types'; // Use the same lesson contract as the API and learning screens.
import records from './sql-data.json'; // Keep editable lesson content in JSON rather than embedding it in React components.
export const sqlTopics = records as Topic[]; // Export the validated seed collection for subject navigation and database seeding.
