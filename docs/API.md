# REST API

Every successful response is `{ "data": ... }`. Errors are `{ "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status. Mutations require `Content-Type: application/json`; browser origins are checked. The server derives ownership from the HttpOnly `cs_session` cookie. Never send user IDs to select private records.

| Method | Endpoint | Body / result |
| --- | --- | --- |
| POST | `/api/auth/register` | `{name,email,password}`; returns safe profile and session cookie. Password: 10–256 characters. |
| POST | `/api/auth/login` | `{email,password}`; returns safe profile and session cookie. |
| POST | `/api/auth/logout` | `{}`; revokes this session and clears its cookie. |
| GET / PATCH | `/api/auth/me` | Read profile; PATCH `{name}` updates display name. |
| POST | `/api/auth/forgot-password` | `{email}`. Production requires `RESEND_API_KEY`; missing delivery configuration returns an explicit 503. Development may return `developmentResetUrl`. |
| POST | `/api/auth/reset-password` | `{token,password}`; single-use, 30-minute reset credentials; revokes all sessions. |
| GET | `/api/curriculum` | Shared `{subjects,topics}` from editable database curriculum records. |
| GET | `/api/subjects` | Subject catalog. |
| GET | `/api/subjects/:id` | Subject metadata and topics. |
| GET | `/api/subjects/:id/topics` | Topic list. |
| GET | `/api/topics/:id` | Structured lesson and questions. |
| GET | `/api/topics/:id/material` | Structured lesson content. |
| GET | `/api/topics/:id/checkpoints` | Difficulty-based checkpoint inventory. |
| GET | `/api/workspace` | Full private `Workspace` contract defined in `shared/types.ts`. |
| GET | `/api/progress/overview` | Private workspace used for overall calculations. |
| GET | `/api/progress/subjects` | Private workspace used for subject calculations. |
| GET | `/api/progress/topics` | Topic progress records. |
| GET | `/api/progress/activity` | Daily counts of actual learning events; UTC calendar dates. |
| POST | `/api/progress/topics/:id` | `{status}`: Not Started, In Progress, Completed, Needs Revision. The client cannot claim Mastered. |
| GET | `/api/checkpoints/:id` | Reference checkpoint. |
| POST | `/api/checkpoints/:id/attempt` | `{topicId,answer,correct?}`. MCQs are graded on the server; descriptive/SQL submissions remain ungraded unless the learner explicitly self-assesses `correct`. Returns `{attempt,referenceAnswer,explanation}`. |
| GET | `/api/checkpoints/:id/history` | Every private attempt, retained rather than overwritten. |
| GET | `/api/quizzes` | Available subject, difficulty, and assessment scopes. |
| POST | `/api/quizzes/start` | `{subjectId:"all" or slug,topicId?,difficulty?:"all" or level,count?:1..20}`. Returns `{id,questions,startedAt,expiresAt}` with a server-selected question inventory. |
| POST | `/api/quizzes/submit` | `{quizId,subjectId,topicId?,answers:[{questionId,topicId,answer}],seconds}`. Server validates the inventory, counts omitted answers incorrect, calculates accuracy and elapsed time, and preserves answer history. |
| GET | `/api/quizzes/history` | Completed results, newest first. |
| GET | `/api/revision/today` | Weak topics and spaced reviews due now. |
| GET | `/api/revision/weak-topics` | Topics requiring revision based on evidence. |
| POST | `/api/revision/:id/complete` | `{}`; retains revision history and schedules the next review. |
| GET / POST | `/api/bookmarks` | Read saved topic IDs; POST `{topicId}` saves idempotently. |
| DELETE | `/api/bookmarks/:topicId` | Remove only this user's saved topic. |
| GET | `/api/notes` | Private saved notes. |
| PUT / DELETE | `/api/notes/:topicId` | PUT `{text}` upserts a note; DELETE removes it. |
| PUT | `/api/settings` | `{dailyGoal,easy,medium,hard,assessment}` updates configurable private goals and mastery thresholds. |

## Learning rules

The server computes mastery from the most recent answer to each checkpoint. Every available difficulty must have graded answers for all of its checkpoints; accuracy must meet the configured threshold (defaults: Easy 100%, Medium 80%, Hard 70%). The latest topic assessment must also meet 80% accuracy and cover every available topic MCQ across difficulty levels. A newer mixed-assessment mistake also removes stale mastery. Opening or manually completing a lesson never grants mastery. Descriptive checkpoint correctness is explicitly self-assessed, not automatically inferred from text.

Spaced revision is scheduled at 1, 3, 7, 14, and 30 days. Mistakes schedule weak-topic revision. Notes, progress, and quiz history are stored independently for each account.

Quiz submissions without `quizId` are supported for compatible practice clients; a partial hand-selected topic subset is ineligible for topic mastery. New clients should always start a server-selected assessment.

## Persistence and deployment

The hosted Worker uses the `DB` Cloudflare D1 binding. The conventional Express server uses Prisma/PostgreSQL when `DATABASE_URL` is configured and a durable local SQLite file otherwise. Both run the same parameterized REST service and security checks. The database schema is migrated separately from initial curriculum data; requests never create hosted tables. A blank migrated installation is seeded with structured curriculum records on first use. Subsequent seeds only add missing records and preserve editorial changes.
