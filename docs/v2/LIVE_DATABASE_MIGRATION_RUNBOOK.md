# LIVE_DATABASE_MIGRATION_RUNBOOK

## Migration introduced
- `supabase/migrations/202605271200_live_contract_alignment.sql`

## Local apply
1. Start local Supabase stack.
2. Apply migrations in order:
   - `supabase db reset` (local only)
   - or `supabase migration up`

## Production apply (manual)
1. Backup database.
2. Run migration via Supabase SQL editor or CI migration command.
3. Verify:
   - new columns exist
   - indexes created
   - `public_read_safe_excerpts` policy present

## Rollback
- Forward-only approach: use compensating migration; do not edit old migration files.
