# Studying and changing CoreLab

Start with one real action and trace it through the files. For example, follow a checkpoint answer from the practice page to the workspace provider, through the REST service, into the database, and back to refreshed progress. This gives each type, component, and helper a concrete purpose.

Comments explain application code line by line where the language allows. JSON is the exception: it is a data format with no comment syntax. Its descriptive property names and indentation make curriculum records easy to edit. Compiler-generated build output, lockfiles, and third-party dependency code are not hand-annotated teaching source.

## Suggested reading order

| Read | What to understand |
| --- | --- |
| `shared/types.ts` | The shapes exchanged between curriculum, backend, and frontend. |
| `content/index.ts` and one content JSON record | How a subject contains modules and complete lessons without embedding course text in React. |
| `src/main.tsx` | How providers and routing wrap the application. |
| `src/App.tsx` | How navigation selects pages and keeps the surrounding workspace visible. |
| `src/lib/store.tsx` | How page actions choose authenticated API persistence or anonymous browser-local practice. |
| `src/pages/Learning.tsx` | How a lesson turns structured data into readable material and learning actions. |
| `src/pages/Practice.tsx` | How checkpoint and quiz interactions collect answers and show feedback. |
| `server/api.ts` | How inputs are validated, identities are checked, and learning records are updated. |
| `server/security.ts` | How passwords, sessions, tokens, and request errors are handled. |
| `server/db.ts` and `server/local.ts` | How one parameterized API runs on D1, SQLite, or Prisma/PostgreSQL. |
| `prisma/schema.prisma` and `drizzle/0000_initial.sql` | How rows relate and which invariants the database enforces. |
| `tests/backend.test.ts` | How realistic requests verify authentication, assessment behavior, and integrity. |

## Trace a checkpoint submission

1. A checkpoint is a `Question` inside one `Topic`. Its stable id is also the foreign-key target for attempts.
2. The practice page collects a choice or written response, then calls the provider's submission action.
3. The provider sends an authenticated JSON request or updates the clearly labeled browser-local practice workspace.
4. `handleApi` authenticates the account, finds the canonical question, bounds the answer length, and verifies the topic reference.
5. For an MCQ, the service compares the answer with the stored reference; it ignores a forged client correctness flag. A descriptive answer remains ungraded unless explicitly self-assessed.
6. The service atomically stores the attempt and activity event, then recomputes mastery and revision needs.
7. The frontend refreshes account state and displays feedback. Earlier attempts remain in history.

Read the comments at each step while keeping the corresponding `Attempt`, `Progress`, and `Workspace` interfaces open. A line that builds an object should match those documented shapes.

## Add a lesson

Use an existing record in the relevant subject's content file as a template. Give it a unique, stable id, the correct subject id, and a module name. Write a specific overview, explanatory sections, practical example, interview answer, revision notes, independent references, and Easy/Medium/Hard checkpoints. MCQ `answer` must exactly match one option; every question id must be unique.

For DBMS and NoSQL, the JSON seed fields are converted by `content/database-helper.ts`. Other subject loaders may consume complete `Topic` records. Keep each subject's existing source format rather than copying one format into an incompatible loader. Optional `hardChoice` adds an automatically scored advanced question alongside the descriptive Hard question for DBMS/NoSQL.

On a fresh database, normal initialization seeds the lesson. On an existing database, `npm run db:seed` adds missing ids but preserves existing rows. To revise existing content, use an explicit reviewed editorial database update that keeps topic JSON, material, and checkpoint records aligned. A source-only change is not a database content migration.

## Add or change a screen

Create a focused component in `src/pages/` or extend the appropriate existing page module. Add its route in `src/App.tsx` and a navigation entry when the page belongs in the sidebar. Reuse shared controls from `src/components/` and CSS variables from `src/styles.css` so both themes remain consistent.

Keep persistence inside provider actions. If the screen introduces a new server operation, document its request and response in `docs/API.md`, validate the input in the service, and derive ownership from the session. Include loading, error, and empty states. Confirm the page works with keyboard navigation and a narrow viewport.

## Change a learning rule

Mastery is enforced in `server/api.ts`. Anonymous practice mirrors its evidence requirements in `src/lib/store.tsx`; keep the two behaviors aligned. Dashboard and subject display calculations live in `src/lib/metrics.ts`. Changing a chart calculation alone must not silently redefine server mastery.

Before changing a threshold, check whether it is already configurable in Settings. If changing the rule itself, add a meaningful behavioral test: for example, verify that a partial topic quiz cannot grant mastery or that a newer wrong answer removes outdated mastery. Preserve earlier attempt records.

## Add a database field

Update the shared type if the field crosses the API boundary. Update the Prisma schema and append a PostgreSQL migration. Append the corresponding D1/SQLite schema migration and journal entry. Then update the service and adapter queries, seed data if appropriate, API documentation, and the relevant real-database test.

Do not edit an already applied migration to change production history. Keep schema changes bounded; use a separate, resumable backfill for large data changes. Never add `CREATE TABLE` to a hosted request handler.

## Change styling safely

The application uses theme variables for backgrounds, text, borders, and accents. Prefer them to hardcoded dark-only values. Keep visible focus indicators, labels, semantic headings, and text explanations of status. Color should reinforce meaning rather than carry it alone.

After a layout change, inspect the dashboard, a long lesson, the mobile drawer, the global search dialog, and account forms in both themes. Respect reduced-motion preferences and avoid introducing animation that is necessary to understand the interface.

## Checks before saving your changes

```bash
npm run typecheck # Verify the edited types and imports agree across the project.
npm test # Exercise meaningful account, database, and learning behavior.
npm run build # Confirm both client and hosted Worker still package successfully.
```

Then use the affected screen yourself. For persistence work, save something, reload, sign out, and sign back into the same account. Use a different account to confirm private data stays separate. For PostgreSQL-specific changes, run the configured PostgreSQL stack as well as the SQLite-backed tests.
