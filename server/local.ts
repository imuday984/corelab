// Local development uses a real SQLite file by default and the requested Prisma/PostgreSQL adapter when configured.
import { DatabaseSync } from 'node:sqlite'; // Use Node's built-in development database without a native package dependency.
import { mkdirSync, readFileSync } from 'node:fs'; // Initialize the local migration and development database directory.
import { resolve } from 'node:path'; // Resolve files from the documented project root.
import type { Database, Environment, Statement } from './db'; // Implement the same database contract used by hosted D1.
interface SqliteStatement extends Statement { sql: string; values: unknown[] } // Retain bound statements so a batch can execute them atomically.
export function sqliteDatabase(filename = ':memory:'): Database { // Expose a reusable real-database adapter for development and integration tests.
    const sqlite = new DatabaseSync(filename); // Open an isolated memory database or persistent local file.
    sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;'); // Enforce relational integrity and tolerate brief concurrent writes.
    const make = (sql: string, values: unknown[] = []): SqliteStatement => ({ // Defer SQL execution until the statement's read or write method is called.
        sql, // Preserve the SQL for transactional batches.
        values, // Preserve parameter values separately from SQL text.
        bind(...next: unknown[]): Statement { return make(sql, next); }, // Return an immutable bound statement.
        async all<T>(): Promise<{ results: T[] }> { return { results: sqlite.prepare(sql).all(...values as never[]) as T[] }; }, // Return the same collection shape as D1.
        async first<T>(): Promise<T | null> { return (sqlite.prepare(sql).get(...values as never[]) as T | undefined) || null; }, // Normalize missing rows to null.
        async run(): Promise<unknown> { return sqlite.prepare(sql).run(...values as never[]); }, // Execute one parameterized write.
    }); // Finish a deferred SQLite statement.
    return { // Return a D1-compatible adapter with one extra development migration hook.
        prepare: make, // Keep every application query parameterized.
        async batch(statements: Statement[]): Promise<unknown[]> { // Guarantee all related local writes commit or roll back together.
            sqlite.exec('BEGIN IMMEDIATE'); // Reserve the write transaction before applying related changes.
            try { // Roll back the entire batch if any foreign key or uniqueness constraint fails.
                const result = []; // Retain per-statement results for caller compatibility.
                for (const statement of statements as SqliteStatement[]) result.push(sqlite.prepare(statement.sql).run(...statement.values as never[])); // Apply each bound statement in order.
                sqlite.exec('COMMIT'); // Publish the complete atomic change.
                return result; // Match D1's batch result shape.
            } catch (error) { // Keep partial writes out of the database.
                sqlite.exec('ROLLBACK'); // Undo every statement in the failed batch.
                throw error; // Preserve the original failure for centralized API handling.
            } // Finish transactional error handling.
        }, // Finish the batch implementation.
        migrate(sql: string): void { sqlite.exec(sql); }, // Apply schema only at development startup or explicit test setup.
        close(): void { sqlite.close(); }, // Allow tests to release their real database handle.
    } as Database & { migrate(sql: string): void; close(): void }; // Keep development-only hooks outside the production interface.
} // Finish the real SQLite adapter.
interface PrismaStatement extends Statement { sql: string; values: unknown[] } // Preserve statements for PostgreSQL transaction execution.
async function postgresDatabase(): Promise<Database> { // Use Prisma only when DATABASE_URL explicitly selects PostgreSQL.
    const { PrismaClient } = await import('@prisma/client'); // Defer generated-client loading so SQLite previews work before prisma generate.
    const prisma = new PrismaClient(); // Read DATABASE_URL through the Prisma datasource configuration.
    const sqlFor = (sql: string): string => { let index = 0; return sql.replace(/\?/g, () => `$${++index}`); }; // Translate portable value placeholders to PostgreSQL positional parameters.
    const make = (sql: string, values: unknown[] = []): PrismaStatement => ({ // Build one deferred parameterized PostgreSQL statement.
        sql, // Preserve the original placeholder form for transactions.
        values, // Keep user-supplied values outside SQL text.
        bind(...next: unknown[]): Statement { return make(sql, next); }, // Create an immutable bound statement.
        async all<T>(): Promise<{ results: T[] }> { return { results: await prisma.$queryRawUnsafe(sqlFor(sql), ...values) as T[] }; }, // Use Prisma's parameter binding for reads.
        async first<T>(): Promise<T | null> { return (await prisma.$queryRawUnsafe(sqlFor(sql), ...values) as T[])[0] || null; }, // Normalize an empty result to null.
        async run(): Promise<unknown> { return prisma.$executeRawUnsafe(sqlFor(sql), ...values); }, // The SQL template is authored in the service; arguments remain bound values.
    }); // Finish the PostgreSQL statement adapter.
    return { // Expose the same interface as D1 and local SQLite.
        prepare: make, // Keep database choice outside application logic.
        async batch(statements: Statement[]): Promise<unknown[]> { // Use a real database transaction for related writes.
            return prisma.$transaction((statements as PrismaStatement[]).map(statement => prisma.$executeRawUnsafe(sqlFor(statement.sql), ...statement.values))); // Commit or roll back the complete ordered write group.
        }, // Finish PostgreSQL transaction handling.
    }; // Finish the PostgreSQL adapter.
} // Finish Prisma-backed database initialization.
let localEnvironment: Promise<Environment> | undefined; // Reuse one development connection across API requests and hot reloads.
export function getLocalEnv(): Promise<Environment> { // Initialize local infrastructure once at application startup.
    localEnvironment ||= (async () => { // Choose the explicitly configured persistent database.
        let db: Database; // Keep the public adapter type runtime-independent.
        if (process.env.DATABASE_URL) db = await postgresDatabase(); // Use the requested PostgreSQL stack when its URL is configured.
        else { // Offer a zero-service local preview using durable SQLite.
            mkdirSync(resolve(process.cwd(), 'work'), { recursive: true }); // Keep development state under the authorized project directory.
            const local = sqliteDatabase(process.env.SQLITE_PATH || resolve(process.cwd(), 'work/development.sqlite')) as Database & { migrate(sql: string): void }; // Persist preview accounts across server restarts.
            const existing = await local.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").first(); // Check whether the initial migration was applied.
            if (!existing) local.migrate(readFileSync(resolve(process.cwd(), 'drizzle/0000_initial.sql'), 'utf8')); // Run schema setup at startup, never against hosted D1 request handling.
            db = local; // Reuse the initialized real relational database.
        } // Finish local database selection.
        return { DB: db, DEVELOPMENT: process.env.NODE_ENV === 'production' ? 'false' : 'true', RESEND_API_KEY: process.env.RESEND_API_KEY, RESET_FROM_EMAIL: process.env.RESET_FROM_EMAIL, APP_ORIGIN: process.env.APP_ORIGIN }; // Keep development-only reset behavior disabled for production Express deployments.
    })(); // Start local setup immediately and retain its promise.
    return localEnvironment; // Give Express and Vite the same database instance.
} // Finish local environment initialization.
