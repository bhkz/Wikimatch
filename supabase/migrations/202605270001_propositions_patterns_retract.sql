-- WikiMatch / Revision 90 V2 — Jalon B+D
-- Trace propositions (claims normalisées) + detected_patterns + retract log.
--
-- Contexte : suite à docs/v2/CORRECTIVE_AUDIT_2026-05-27.md, le pipeline
-- automatique est restructuré en :
--   trace brute  →  proposition extraite  →  pattern détecté  →  publication par template
-- L'IA n'est plus l'autorité de publication ; elle est un extracteur de
-- propositions normalisées (Jalon B). La publication finale est décidée
-- par le pattern matcher + safety filters (Jalon C).
-- Un kill switch admin (Jalon D) loggue les retraits.

-- ---------------------------------------------------------------------------
-- Trace propositions : objet intermédiaire entre revision_traces et stories
-- ---------------------------------------------------------------------------

create table if not exists public.trace_propositions (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null references public.revision_traces(id) on delete cascade,
  proposition_type text not null check (proposition_type in (
    'match_result',
    'goal_scored',
    'red_card',
    'yellow_card',
    'substitution',
    'sanction',
    'lineup_change',
    'transfer',
    'qualification',
    'performance',
    'biographical_fact',
    'noise',
    'other'
  )),
  normalized_payload jsonb not null default '{}'::jsonb,
  language_code text not null,
  extraction_provider text not null check (extraction_provider in ('openai', 'gemini', 'regex', 'manual')),
  extraction_confidence numeric(3, 2) check (extraction_confidence is null or (extraction_confidence >= 0 and extraction_confidence <= 1)),
  extraction_model text,
  extraction_prompt_version text,
  estimated_cost_eur numeric(10, 6),
  created_at timestamptz not null default now()
);

create index if not exists trace_propositions_trace_idx on public.trace_propositions(trace_id);
create index if not exists trace_propositions_type_idx on public.trace_propositions(proposition_type);
create index if not exists trace_propositions_lang_idx on public.trace_propositions(language_code);

alter table public.trace_propositions enable row level security;
-- Propositions privées : aucune lecture publique. Accès via service-role
-- (worker analyzer + pattern matcher + Desk admin).

-- ---------------------------------------------------------------------------
-- Detected patterns : ce que le pattern matcher a reconnu mais pas encore publié
-- ---------------------------------------------------------------------------

create table if not exists public.detected_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_type text not null check (pattern_type in (
    'article_instability',
    'language_convergence',
    'language_divergence',
    'under_radar',
    'match_recap'
  )),
  proposition_ids uuid[] not null default '{}',
  entity_id uuid references public.entities(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  article_id uuid references public.wiki_articles(id) on delete set null,
  detected_at timestamptz not null default now(),
  template_version text not null default 'v1',
  -- Résultat de l'évaluation safety / template
  safety_checks_passed boolean not null default false,
  safety_checks_payload jsonb not null default '{}'::jsonb,
  safety_blocked_reason text,
  -- Publication associée (si la story est passée jusqu'à published_stories)
  published_story_id uuid references public.published_stories(id) on delete set null,
  -- Retract (Jalon D)
  retracted_at timestamptz,
  retracted_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists detected_patterns_type_idx on public.detected_patterns(pattern_type);
create index if not exists detected_patterns_entity_idx on public.detected_patterns(entity_id);
create index if not exists detected_patterns_match_idx on public.detected_patterns(match_id);
create index if not exists detected_patterns_safety_idx on public.detected_patterns(safety_checks_passed);
create index if not exists detected_patterns_story_idx on public.detected_patterns(published_story_id);

drop trigger if exists detected_patterns_set_updated_at on public.detected_patterns;
create trigger detected_patterns_set_updated_at
before update on public.detected_patterns
for each row execute function public.set_updated_at();

alter table public.detected_patterns enable row level security;
-- Patterns privés : seuls les patterns convertis en `published_stories`
-- deviennent indirectement visibles via la table publiée. La table
-- detected_patterns elle-même reste privée.

-- ---------------------------------------------------------------------------
-- AI runs : ajout des champs nécessaires pour traçabilité par provider
-- (le schéma initial avait déjà provider/model_name/estimated_cost_eur, on
-- ajoute juste un index sur created_at pour la requête de budget journalier)
-- ---------------------------------------------------------------------------

create index if not exists ai_analysis_runs_created_at_idx
  on public.ai_analysis_runs(created_at desc);

-- ---------------------------------------------------------------------------
-- Retract log (kill switch admin — Jalon D)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_retract_log (
  id uuid primary key default gen_random_uuid(),
  target_table text not null check (target_table in ('published_stories', 'public_trace_excerpts', 'detected_patterns')),
  target_id uuid not null,
  reason text not null,
  admin_token_hash text,
  created_at timestamptz not null default now()
);

create index if not exists admin_retract_log_created_at_idx
  on public.admin_retract_log(created_at desc);

alter table public.admin_retract_log enable row level security;
-- Pas de policy publique : journal admin uniquement.

-- ---------------------------------------------------------------------------
-- Champs supplémentaires sur published_stories pour le pipeline automatique
-- (ajoutés idempotemment via ALTER TABLE IF NOT EXISTS)
-- ---------------------------------------------------------------------------

alter table public.published_stories
  add column if not exists detected_pattern_id uuid references public.detected_patterns(id) on delete set null,
  add column if not exists published_by_pipeline text check (published_by_pipeline is null or published_by_pipeline in ('manual', 'auto_template_v1')),
  add column if not exists retracted_at timestamptz,
  add column if not exists retracted_reason text;

create index if not exists published_stories_pattern_idx
  on public.published_stories(detected_pattern_id);

-- Permet de filtrer les stories non rétractées dans les vues publiques.
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
where publication_status in ('published', 'corrected')
  and retracted_at is null;
