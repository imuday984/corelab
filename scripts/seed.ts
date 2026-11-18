// Run this script after Prisma migrations to populate editable shared curriculum records.
import { getLocalEnv } from '../server/local'; // Use the same database selection as Express.
import { seedCurriculum } from '../server/curriculum'; // Keep seed logic shared with a first-launch hosted database.
const env = await getLocalEnv(); // Open the configured PostgreSQL or local SQLite database.
await seedCurriculum(env.DB); // Add missing records while preserving existing editorial changes.
console.log('Curriculum seed completed. Existing curriculum records were preserved.'); // Report completion without printing credentials or learner data.
process.exit(0); // Release the Prisma connection when this one-shot task finishes.
