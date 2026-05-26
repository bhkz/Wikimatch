-- PR02 live contract alignment (forward-only, additive)

alter table if exists public.entities
  add column if not exists subject_geography_label text,
  add column if not exists subject_latitude double precision,
  add column if not exists subject_longitude double precision,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table if exists public.wiki_articles
  add column if not exists monitoring_enabled boolean not null default true,
  add column if not exists canonical_url text;

create index if not exists idx_wiki_articles_monitoring_enabled on public.wiki_articles (monitoring_enabled);
create index if not exists idx_wiki_articles_language_code on public.wiki_articles (language_code);

alter table if exists public.matches
  add column if not exists scheduled_at timestamptz,
  add column if not exists home_team_entity_id uuid,
  add column if not exists away_team_entity_id uuid,
  add column if not exists home_score integer,
  add column if not exists away_score integer,
  add column if not exists official_source_name text,
  add column if not exists official_source_url text,
  add column if not exists source_verified_at timestamptz;

create index if not exists idx_matches_scheduled_at on public.matches (scheduled_at);

alter table if exists public.public_trace_excerpts
  add column if not exists publication_method text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists license_label text;

-- enforce safe public reads policy if table exists and RLS enabled
alter table if exists public.public_trace_excerpts enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='public_trace_excerpts' and policyname='public_read_safe_excerpts'
  ) then
    create policy public_read_safe_excerpts on public.public_trace_excerpts for select using (safe_to_publish = true);
  end if;
end $$;
