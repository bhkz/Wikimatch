# STAGING_DATABASE_APPLICATION_RUNBOOK

## Required env vars
- SUPABASE_URL
- SUPABASE_SERVICE_KEY

## Commands
- supabase migration up
- npm run import:wc26:schedule -- --apply
- npm run resolve:wc26:articles -- --apply
- npm run build:wc26:watchlists -- --apply
- npm run verify:wc26:coverage
