# CoreLab

CoreLab is a CS fundamentals learning workspace for interview preparation. It combines a structured curriculum, lesson notes, difficulty-based checkpoints, scored quizzes, spaced revision, and progress analytics across OOP, Operating Systems, DBMS, SQL, Computer Networks, and NoSQL.

The initial curriculum contains **225 lessons and 708 checkpoints**. The learning cycle is **Learn → Understand → Practice → Test → Revise → Master**. Reading a lesson or clicking Completed does not grant mastery.

## Run locally

Use **Node.js 24 or later** and npm. The built-in SQLite adapter requires Node's `node:sqlite`; Docker is optional and is used only for PostgreSQL.

### Quick preview with SQLite

No database service or account with an external provider is needed. Keep `DATABASE_URL` unset to select the durable development database.

```bash
npm ci # Install the exact dependency versions recorded in package-lock.json.
unset DATABASE_URL # Select the explicit zero-service SQLite development adapter.
npm run dev # Start Vite and the same-origin REST API; open the URL printed by Vite.
```

The application creates `work/development.sqlite` and applies the initial SQLite schema on first startup. New migrated databases receive the initial curriculum automatically. Anonymous practice stays in that browser. Register an account to keep private progress in the server database and use it from another device that can reach the same server. Browser-local practice and an account workspace are separate; signing in does not silently import anonymous records.

### Preferred local stack: Express + Prisma + PostgreSQL

```bash
npm ci # Install frontend, Express, Prisma, and development dependencies.
cp .env.example .env # Create your local configuration; .env is ignored by Git.
docker compose up -d db # Start the development PostgreSQL service and persistent named volume.
set -a # Export the configuration values read by the shell in the next line.
. ./.env # Load the trusted local file into this shell; do not load an untrusted file.
set +a # Restore ordinary shell variable behavior.
npm run db:generate # Generate the Prisma client for the PostgreSQL schema.
npm run db:migrate # Apply the versioned PostgreSQL migrations.
npm run db:seed # Add the initial subjects, modules, topics, materials, and checkpoints.
npm run dev # Run frontend development with the integrated REST API against PostgreSQL.
```

Use the same exported environment for the standalone Express server:

```bash
npm run build # Build the React client and the separate hosted Worker artifact.
PORT=3000 npm run dev:api # Serve the Express API and built React application on http://localhost:3000.
```

For the standalone server, set `APP_ORIGIN=http://localhost:3000` if password-reset links should use that origin. Behind a production reverse proxy, use HTTPS and set `APP_ORIGIN` to the browser-facing origin. Set `NODE_ENV=production` to disable development reset-link disclosure.

`docker compose stop` preserves the database volume. `docker compose down` removes containers while retaining the named volume unless explicitly told otherwise. Use a private password and managed backups for any real deployment; the example credentials are for local development.

## Account and email configuration

Passwords are salted and derived with PBKDF2-SHA-256. Sessions are server-managed; the browser holds an HttpOnly, SameSite cookie, with Secure enabled for HTTPS. Protected API reads and writes derive the user identity from the session rather than trusting a submitted user id.

Production password-reset delivery uses Resend. Set `RESEND_API_KEY`, `RESET_FROM_EMAIL` with a verified sender, and `APP_ORIGIN`. Hosted runtime secrets belong in the hosting environment, never the React bundle or repository. Without a delivery provider, the production reset endpoint returns a clear configuration error. Development mode can return a clearly labeled reset URL for local testing. Reset tokens expire after 30 minutes, are single-use, and revoke existing sessions when consumed.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server with the portable API attached on the same origin. |
| `npm run dev:api` | Standalone Express server using PostgreSQL when configured, otherwise SQLite. |
| `npm run typecheck` | Check frontend, backend, shared contracts, and build scripts without emitting files. |
| `npm test` | Run integration and scoring tests using isolated in-memory relational databases. |
| `npm run build` | Build `dist/client` and a self-contained `dist/server/index.js` Worker. |
| `npm run db:generate` | Generate the Prisma client. |
| `npm run db:migrate` | Apply PostgreSQL migration history. |
| `npm run db:seed` | Insert missing initial curriculum records while preserving existing editorial data. |

## Learning behavior

- Topic states distinguish Not Started, In Progress, Completed, Needs Revision, and Mastered.
- All Easy, Medium, and Hard checkpoints are accessible immediately. Descriptive and SQL answers require an explicit self-assessment after comparison with the reference; submission alone is ungraded.
- Account quiz inventories, scoring, omitted answers, timing, and history are managed by the server. Anonymous practice uses the corresponding browser-local workflow.
- Mastery requires graded evidence across every available difficulty and a complete topic assessment. Defaults are Easy 100%, Medium 80%, Hard 70%, and topic assessment 80%; settings make thresholds configurable.
- Revision uses intervals of 1, 3, 7, 14, and 30 days. Incorrect performance identifies topics for another review.
- Readiness combines completion 25%, checkpoint accuracy 25%, average quiz score 25%, topic mastery 15%, and revision coverage 10%. It is a learning indicator, not a forecast of interview or placement success.
- Saved notes, bookmarks, attempts, revision schedules, and quiz histories belong to the authenticated account. Daily activity and streak calculations use UTC dates.

## Curriculum and editing

Curriculum lives in `content/`, independently of React components, and is seeded into shared database records. `shared/types.ts` documents the complete `Subject`, `Topic`, checkpoint, and workspace contracts. Topic ids connect lessons to existing user history; preserve an id when revising a lesson.

For existing installations, `db:seed` adds missing records and deliberately preserves existing topic JSON. Changing a source record does not overwrite editorial database changes. Update the intended database content record explicitly as an editorial operation, and keep `topics.data`, `learning_material.data`, and checkpoint records consistent. A disposable development database may instead be recreated after backing up anything you want to keep.

JSON files contain data only because JSON does not support comments. TypeScript, CSS, SQL, Prisma, YAML, and configuration files use explanatory comments where their syntax allows. See [the code study guide](docs/CODE_STUDY_GUIDE.md) for a reading order and practical editing examples.

The learning material is an educational draft with independent reference links for further study and fact-checking. It has not been represented as professionally or independently human-reviewed courseware. SQL challenges provide sample tables, expected records, and reference queries; the application compares written answers and does not execute arbitrary submitted SQL.

## Hosting architecture

Local conventional deployment uses **React + Vite + TypeScript + Tailwind, Express, Prisma, and PostgreSQL**. The managed Sites deployment uses **the same React client and REST service on a Cloudflare Worker with D1**. The database adapter changes; user-specific API logic and validation remain shared. SQLite is the convenient local preview/test adapter, rather than a claim that the hosted service runs PostgreSQL.

`.openai/hosting.json` declares the Site identity and `DB` binding. `drizzle/` contains the hosted D1 schema; `prisma/migrations/` contains the PostgreSQL equivalent. Both must evolve together. Schema changes belong in migrations, not request handling. The build embeds the verified Vite assets in the Worker and emits hosting metadata under `dist/`.

## Verify changes

```bash
npm run typecheck # Catch contract and integration mistakes before building.
npm test # Verify real authentication, authorization, database constraints, assessments, and mastery rules.
npm run build # Confirm the client and hosted Worker can both be packaged.
```

For UI changes, also inspect dark/light themes, narrow-screen navigation, keyboard focus, one lesson, a checkpoint submission, a quiz result, saved notes, and sign-out. Automated tests run against real SQLite constraints and the shared service; they do not replace exercising a configured PostgreSQL deployment or checking real email delivery.

Further documentation: [Architecture](docs/ARCHITECTURE.md), [API reference](docs/API.md), and [Code study guide](docs/CODE_STUDY_GUIDE.md).
