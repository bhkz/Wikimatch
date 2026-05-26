# Supabase V2

Phase 2 foundation for WikiMatch / Revision 90.

## Migration Order

1. `migrations/202605260001_v2_core_schema.sql`

This creates the V2 core schema described in `docs/v2/DATA_MODEL_PROPOSAL.md`:

- public football scope: `entities`, `wiki_articles`, `matches`, `match_watchlist`
- Wikimedia ingestion: `revision_traces`, `trace_private_content`, `public_trace_excerpts`
- editorial workflow: `story_candidates`, `published_stories`, `story_evidence`, comparisons, instability cases, methodology, corrections
- worker state: `ingest_checkpoints`, `ingest_failures`
- private Desk/AI tables: `ai_analysis_runs`, `editorial_reviews`
- public read views: `v_public_stories`, `v_public_observatory_traces`
- initial RLS policies for published stories, safe public excerpts, and published methodology

## Safety Rules

- Never expose `SUPABASE_SERVICE_KEY` to the Vite bundle.
- Keep service-role access in Supabase Edge Functions, Render worker, or trusted server code only.
- Public frontend should call `/api/public/v1/*`; it should not query private tables directly.
- `trace_private_content`, `story_candidates`, `ai_analysis_runs`, and `editorial_reviews` intentionally have no public policies.

## Apply

Use the Supabase CLI after linking a dedicated V2 project:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Do not run migrations against the legacy V1 project.
