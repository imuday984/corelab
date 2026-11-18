// These small database contracts allow one API to run on Cloudflare D1 and local PostgreSQL.
export interface Statement { // Model a bound statement without depending on a hosting SDK.
    bind(...values: unknown[]): Statement; // Bind values separately from SQL to prevent injection.
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; // Return a predictable row collection.
    first<T = Record<string, unknown>>(): Promise<T | null>; // Return one row or null.
    run(): Promise<unknown>; // Execute a write statement.
} // Finish the statement contract.
export interface Database { // Model only the database operations the API needs.
    prepare(sql: string): Statement; // Compile a single SQL statement.
    batch(statements: Statement[]): Promise<unknown[]>; // Apply related writes atomically.
} // Finish the database contract.
export interface Environment { // Describe runtime bindings without exposing secrets to React.
    DB: Database; // Store durable curriculum and private learning records.
    RESEND_API_KEY?: string; // Optionally enable real password-reset delivery.
    RESET_FROM_EMAIL?: string; // Choose a verified sender for reset messages.
    APP_ORIGIN?: string; // Override the reset-link origin when behind a proxy.
    DEVELOPMENT?: string; // Permit local development reset links only when explicitly enabled.
} // Finish the runtime contract.
export const row = async <T>(db: Database, sql: string, ...values: unknown[]): Promise<T | null> => db.prepare(sql).bind(...values).first<T>(); // Read one parameterized row.
export const rows = async <T>(db: Database, sql: string, ...values: unknown[]): Promise<T[]> => (await db.prepare(sql).bind(...values).all<T>()).results; // Read parameterized rows.
export const write = (db: Database, sql: string, ...values: unknown[]): Promise<unknown> => db.prepare(sql).bind(...values).run(); // Execute one parameterized write.
