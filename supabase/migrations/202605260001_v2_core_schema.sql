-- WikiMatch / Revision 90 V2 core schema
-- Phase 2 foundation: public magazine data, private ingestion/review data,
-- RLS defaults, and public read views.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared timestamp helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public football / article scope
-- ---------------------------------------------------------------------------

create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  type text not null check (type in ('player', 'team', 'coach', 'match', 'stadium', 'tournament', 'referee')),
  canonical_label text not null,
  wikidata_qid text,
  subject_geography_label text,
  subject_latitude double precision,
  subject_longitude double precision,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entities_type_idx on public.entities(type);
create index if not exists entities_wikidata_qid_idx on public.entities(wikidata_qid);

drop trigger if exists entities_set_updated_at on public.entities;
create trigger entities_set_updated_at
before update on public.entities
for each row execute function public.set_updated_at();

create table if not exists public.wiki_articles (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  wiki_code text not null,
  language_code text not null,
  page_id bigint,
  page_title text not null,
  canonical_url text not null,
  article_type text not null check (article_type in ('player', 'team', 'match', 'tournament', 'stadium', 'referee')),
  monitoring_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wiki_code, page_title)
);

create index if not exists wiki_articles_entity_id_idx on public.wiki_articles(entity_id);
create index if not exists wiki_articles_monitoring_enabled_idx
  on public.wiki_articles(monitoring_enabled)
  where monitoring_enabled = true;

drop trigger if exists wiki_articles_set_updated_at on public.wiki_articles;
create trigger wiki_articles_set_updated_at
before update on public.wiki_articles
for each row execute function public.set_updated_at();

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  competition_label text not null,
  stage_label text not null,
  scheduled_at timestamptz,
  home_team_entity_id uuid references public.entities(id),
  away_team_entity_id uuid references public.entities(id),
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'completed', 'cancelled')),
  official_source_name text,
  official_source_url text,
  source_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_status_scheduled_at_idx
  on public.matches(status, scheduled_at);

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

create table if not exists public.match_watchlist (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  article_id uuid not null references public.wiki_articles(id) on delete cascade,
  role text not null
    check (role in ('match', 'home_team', 'away_team', 'player', 'coach', 'referee', 'tournament')),
  monitoring_reason text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (match_id, article_id, role)
);

create index if not exists match_watchlist_match_id_idx on public.match_watchlist(match_id);
create index if not exists match_watchlist_article_id_idx on public.match_watchlist(article_id);

-- ---------------------------------------------------------------------------
-- Wikimedia ingestion: private by default
-- ---------------------------------------------------------------------------

create table if not exists public.revision_traces (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.wiki_articles(id) on delete cascade,
  wikimedia_event_id text unique not null,
  revision_id bigint unique,
  previous_revision_id bigint,
  observed_at timestamptz not null default now(),
  revision_timestamp timestamptz not null,
  source_revision_url text not null,
  source_diff_url text,
  section_label text,
  size_delta integer,
  revision_comment_sanitized text,
  change_kind text,
  public_status text not null default 'private_raw'
    check (public_status in ('private_raw', 'public_minor', 'public_substantive', 'linked_to_story')),
  ingest_status text not null default 'observed'
    check (ingest_status in ('observed', 'classified', 'reviewed', 'published_evidence')),
  created_at timestamptz not null default now()
);

create index if not exists revision_traces_article_observed_idx
  on public.revision_traces(article_id, observed_at desc);
create index if not exists revision_traces_public_status_idx on public.revision_traces(public_status);
create index if not exists revision_traces_ingest_status_idx on public.revision_traces(ingest_status);

create table if not exists public.trace_private_content (
  trace_id uuid primary key references public.revision_traces(id) on delete cascade,
  raw_added_text text,
  raw_removed_text text,
  fetched_at timestamptz not null default now(),
  moderation_status text not null default 'unreviewed'
    check (moderation_status in ('unreviewed', 'flagged', 'approved_for_excerpt', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.public_trace_excerpts (
  trace_id uuid primary key references public.revision_traces(id) on delete cascade,
  public_added_excerpt text,
  public_removed_excerpt text,
  translated_excerpt text,
  source_attribution_label text not null,
  source_revision_url text not null,
  license_label text not null default 'CC BY-SA 4.0',
  safe_to_publish boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists public_trace_excerpts_safe_idx
  on public.public_trace_excerpts(safe_to_publish)
  where safe_to_publish = true;

-- ---------------------------------------------------------------------------
-- Editorial workflow
-- ---------------------------------------------------------------------------

create table if not exists public.story_candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_type text not null,
  entity_id uuid references public.entities(id),
  match_id uuid references public.matches(id),
  detection_reason text not null,
  evidence_trace_ids uuid[] not null default '{}',
  ai_assistance_payload jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'rejected', 'approved', 'converted_to_story')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists story_candidates_set_updated_at on public.story_candidates;
create trigger story_candidates_set_updated_at
before update on public.story_candidates
for each row execute function public.set_updated_at();

create table if not exists public.published_stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  story_type text not null
    check (story_type in ('fact_entry', 'language_convergence', 'language_divergence', 'article_instability', 'under_radar', 'match_recap')),
  title text not null,
  excerpt text not null,
  observation_text text not null,
  interpretation_text text not null,
  limitation_text text not null,
  entity_id uuid references public.entities(id),
  match_id uuid references public.matches(id),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'corrected', 'retracted')),
  published_at timestamptz,
  corrected_at timestamptz,
  methodology_version text,
  share_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists published_stories_publication_status_idx
  on public.published_stories(publication_status);
create index if not exists published_stories_type_published_idx
  on public.published_stories(story_type, published_at desc);

drop trigger if exists published_stories_set_updated_at on public.published_stories;
create trigger published_stories_set_updated_at
before update on public.published_stories
for each row execute function public.set_updated_at();

create table if not exists public.story_evidence (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.published_stories(id) on delete cascade,
  trace_id uuid references public.revision_traces(id) on delete set null,
  evidence_type text not null
    check (evidence_type in ('trace', 'compared_absence', 'official_match_event', 'comparison_snapshot')),
  public_label text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists story_evidence_story_order_idx
  on public.story_evidence(story_id, display_order);

create table if not exists public.comparison_snapshots (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.published_stories(id) on delete set null,
  entity_id uuid not null references public.entities(id),
  match_id uuid references public.matches(id),
  comparison_topic text not null,
  observed_at timestamptz not null,
  observation_text text not null,
  limitation_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comparison_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.comparison_snapshots(id) on delete cascade,
  article_id uuid not null references public.wiki_articles(id),
  language_code text not null,
  state text not null
    check (state in ('present', 'not_detected', 'reworded', 'unstable', 'not_compared')),
  public_excerpt_id uuid references public.public_trace_excerpts(trace_id),
  short_observation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.article_instability_cases (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.wiki_articles(id),
  entity_id uuid references public.entities(id),
  match_id uuid references public.matches(id),
  passage_topic text not null,
  status text not null default 'candidate'
    check (status in ('candidate', 'reviewed', 'published', 'rejected')),
  observation_text text not null,
  limitation_text text not null,
  detected_at timestamptz not null,
  reviewed_at timestamptz
);

create table if not exists public.article_instability_evidence (
  id uuid primary key default gen_random_uuid(),
  instability_case_id uuid not null references public.article_instability_cases(id) on delete cascade,
  trace_id uuid not null references public.revision_traces(id),
  action text not null check (action in ('added', 'removed', 'restored', 'sourced', 'reworded')),
  display_order integer not null default 0
);

create table if not exists public.methodology_versions (
  id uuid primary key default gen_random_uuid(),
  version_label text unique not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  summary text not null,
  content_json jsonb not null default '{}'::jsonb
);

create table if not exists public.story_corrections (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.published_stories(id) on delete cascade,
  correction_type text not null,
  public_note text not null,
  corrected_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Worker state / failures
-- ---------------------------------------------------------------------------

create table if not exists public.ingest_checkpoints (
  stream_name text primary key,
  last_confirmed_event_id text,
  last_confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ingest_failures (
  id uuid primary key default gen_random_uuid(),
  stream_name text not null,
  event_id text,
  revision_id bigint,
  error_type text not null,
  error_message_sanitized text,
  retry_count integer not null default 0,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ingest_failures_stream_resolved_idx
  on public.ingest_failures(stream_name, resolved_at);

-- ---------------------------------------------------------------------------
-- Private AI / Desk records
-- ---------------------------------------------------------------------------

create table if not exists public.ai_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.story_candidates(id) on delete cascade,
  task_type text not null,
  provider text not null check (provider in ('openai', 'gemini')),
  model_name text not null,
  prompt_version text not null,
  output_json jsonb not null,
  estimated_cost_eur numeric(10, 6),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.story_candidates(id) on delete cascade,
  reviewer_id uuid not null,
  decision text not null check (decision in ('approve', 'reject', 'request_changes', 'convert_to_story')),
  correction_notes text,
  published_story_id uuid references public.published_stories(id),
  reviewed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Public views
-- ---------------------------------------------------------------------------

create or replace view public.v_public_stories
with (security_invoker = true)
as
select
  id,
  slug,
  story_type,
  title,
  excerpt,
  observation_text,
  interpretation_text,
  limitation_text,
  entity_id,
  match_id,
  published_at,
  corrected_at,
  methodology_version,
  share_image_url
from public.published_stories
where publication_status in ('published', 'corrected');

create or replace view public.v_public_observatory_traces
with (security_invoker = true)
as
select
  rt.id as trace_id,
  rt.observed_at,
  wa.language_code,
  wa.canonical_url,
  rt.section_label,
  rt.public_status,
  rt.change_kind,
  pte.public_added_excerpt,
  pte.public_removed_excerpt,
  pte.translated_excerpt,
  pte.source_attribution_label,
  pte.source_revision_url,
  pte.license_label
from public.revision_traces rt
join public.wiki_articles wa on wa.id = rt.article_id
join public.public_trace_excerpts pte on pte.trace_id = rt.id
where pte.safe_to_publish = true
  and rt.public_status in ('public_minor', 'public_substantive', 'linked_to_story');

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.entities enable row level security;
alter table public.wiki_articles enable row level security;
alter table public.matches enable row level security;
alter table public.match_watchlist enable row level security;
alter table public.revision_traces enable row level security;
alter table public.trace_private_content enable row level security;
alter table public.public_trace_excerpts enable row level security;
alter table public.story_candidates enable row level security;
alter table public.published_stories enable row level security;
alter table public.story_evidence enable row level security;
alter table public.comparison_snapshots enable row level security;
alter table public.comparison_snapshot_items enable row level security;
alter table public.article_instability_cases enable row level security;
alter table public.article_instability_evidence enable row level security;
alter table public.methodology_versions enable row level security;
alter table public.story_corrections enable row level security;
alter table public.ingest_checkpoints enable row level security;
alter table public.ingest_failures enable row level security;
alter table public.ai_analysis_runs enable row level security;
alter table public.editorial_reviews enable row level security;

drop policy if exists public_read_published_stories on public.published_stories;
create policy public_read_published_stories
on public.published_stories
for select
to anon
using (publication_status in ('published', 'corrected'));

drop policy if exists public_read_safe_trace_excerpts on public.public_trace_excerpts;
create policy public_read_safe_trace_excerpts
on public.public_trace_excerpts
for select
to anon
using (safe_to_publish = true);

drop policy if exists public_read_published_methodology on public.methodology_versions;
create policy public_read_published_methodology
on public.methodology_versions
for select
to anon
using (status = 'published');

-- Keep supporting tables private by default. Public API functions can use the
-- service role and explicitly shape safe responses.
