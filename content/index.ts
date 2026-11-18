import type { Subject } from '../shared/types'; // Share subject metadata with both runtimes.
import { oopTopics } from './oop'; // Load object-oriented programming lessons independently of React.
import { osTopics } from './os'; // Load operating-system lessons independently of React.
import { dbmsTopics } from './dbms'; // Load database-management lessons independently of React.
import { sqlTopics } from './sql'; // Load SQL lessons and worked challenges.
import { cnTopics } from './cn'; // Load computer-network lessons.
import { nosqlTopics } from './nosql'; // Load non-relational database lessons.
export const subjects: Subject[] = [ // Keep the presentation metadata editable in one place.
    { id: 'oop', title: 'Object-Oriented Programming', shortTitle: 'OOPs', description: 'Think in objects. Design code that lasts.', color: '#b49cff', icon: 'Boxes' }, // Identify the object-oriented curriculum.
    { id: 'os', title: 'Operating Systems', shortTitle: 'Operating Systems', description: 'Understand what happens under the hood.', color: '#7fafff', icon: 'Cpu' }, // Identify the systems curriculum.
    { id: 'dbms', title: 'Database Management', shortTitle: 'DBMS', description: 'Build a strong foundation in data.', color: '#f1bb75', icon: 'Database' }, // Identify relational data foundations.
    { id: 'sql', title: 'Structured Query Language', shortTitle: 'SQL', description: 'Turn questions into powerful queries.', color: '#7ad5b6', icon: 'CodeXml' }, // Identify query language practice.
    { id: 'cn', title: 'Computer Networks', shortTitle: 'Networks', description: 'Connect the dots, one packet at a time.', color: '#e69bc3', icon: 'Network' }, // Identify networking fundamentals.
    { id: 'nosql', title: 'NoSQL Databases', shortTitle: 'NoSQL', description: 'Explore data beyond rows and columns.', color: '#7bcbd9', icon: 'Layers' }, // Identify non-relational systems.
]; // Finish the subject catalog.
export const topics = [...oopTopics, ...osTopics, ...dbmsTopics, ...sqlTopics, ...cnTopics, ...nosqlTopics]; // Expose a single ordered seed curriculum.
