-- DANGER: this wipes the whole public schema of the selected Supabase project.
-- Use only on a fresh V2 project or after exporting/backing up anything useful.
--
-- Why this exists:
-- The V2 migrations assume an empty/new V2 schema. If an older Revision90
-- schema already has tables such as public.entities, `create table if not exists`
-- will keep the old shape and later statements can fail, for example:
--   ERROR: column "wikidata_qid" does not exist
--
-- After running this reset, run these files again in order:
-- 1. supabase/migrations/202605260001_v2_core_schema.sql
-- 2. supabase/migrations/202605260002_public_page_snapshots.sql

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

alter default privileges in schema public
grant all on tables to postgres, service_role;

alter default privileges in schema public
grant all on functions to postgres, service_role;

alter default privileges in schema public
grant all on sequences to postgres, service_role;
