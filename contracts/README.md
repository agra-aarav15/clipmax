# Contracts

Language-neutral JSON Schemas shared by the TypeScript app and the Python worker.

| File                             | Producer                 | Consumer      | Stored in               |
| -------------------------------- | ------------------------ | ------------- | ----------------------- |
| `transcript.schema.json`         | worker (Phase 4)         | app (Phase 5) | `public.transcripts`    |
| `highlight-analysis.schema.json` | LLM, validated by worker | worker, app   | `public.clips` (mapped) |

## Rules

1. Times are **seconds**, floating point, measured from the start of the source video.
2. The worker validates every LLM response against the highlight schema **before** any database
   write. One automatic repair attempt is allowed; a second failure fails the job.
3. Duration bounds (30–60 s, hard limits 20–75 s) and word-boundary snapping are enforced in code,
   not in the schema.
4. A breaking change requires bumping the `$id` path and updating both consumers in the same
   commit.
5. The TypeScript side uses zod in `packages/shared/src/api.ts`; the Python side uses pydantic
   models in Phase 4. Both must agree with these files.
