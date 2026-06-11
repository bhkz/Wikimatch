-- ============================================================================
-- ATLAS MONDIAL 2026 — schéma `atlas` (spec §15)
-- Les anciennes tables du schéma `public` (projet Wikimatch abandonné) ne sont
-- PAS touchées ici ; elles seront droppées à la main plus tard.
--
-- ⚠️ Après application : ajouter `atlas` aux "Exposed schemas" de l'API
-- Supabase (Dashboard → Settings → API) pour la lecture anon via PostgREST.
--
-- RLS : lecture publique (anon) sur tout, écriture uniquement service role
-- (le service role bypasse RLS ; aucune policy d'écriture n'est créée).
-- ============================================================================

create schema if not exists atlas;

grant usage on schema atlas to anon, authenticated, service_role;
alter default privileges in schema atlas grant select on tables to anon, authenticated;
alter default privileges in schema atlas grant all on tables to service_role;

-- ----------------------------------------------------------------------------
-- Tables (spec §15, verbatim)
-- ----------------------------------------------------------------------------

create table atlas.nations (
  code text primary key,                 -- FIFA 3 lettres
  name_fr text not null, flag text not null, color text not null,
  fifa_rank int not null, fifa_points numeric not null,
  fd_team_id int unique, group_letter text,
  status text not null default 'alive' check (status in ('alive','eliminated','champion')),
  eliminated_at timestamptz, eliminated_by_match int
);

create table atlas.hexes (
  id int primary key,                    -- stable, issu de map-generated.json
  q int not null, r int not null, unique(q,r),
  city_name text not null, is_capital bool not null default false,
  original_owner text references atlas.nations(code),  -- null = neutre d'origine
  owner text, state text not null default 'owned'
    check (state in ('owned','neutral','ruins','memorial')),
  conquered bool not null default false
);
create index on atlas.hexes(owner) where owner is not null;

create table atlas.matches (
  id int primary key,                    -- provider id
  stage text not null check (stage in ('GROUP','R32','R16','QF','SF','THIRD','FINAL')),
  group_letter text, matchday int,       -- 1..3 en groupes
  home text references atlas.nations(code), away text references atlas.nations(code),
  kickoff_utc timestamptz not null,
  status text not null default 'SCHEDULED',
  score_home int, score_away int, duration text, pens_home int, pens_away int,
  raw jsonb, updated_at timestamptz not null default now()
);

create table atlas.match_overrides (     -- saisie admin, prime sur l'API
  match_id int primary key references atlas.matches(id),
  score_home int not null, score_away int not null, duration text not null,
  pens_home int, pens_away int, note text, created_at timestamptz default now()
);

create table atlas.resolutions (
  match_id int primary key references atlas.matches(id),   -- PK = idempotence
  winner text, loser text, is_draw bool not null default false,
  goal_diff int not null default 0, base_gain int not null,
  m_overext numeric(4,2) not null, final_gain int not null,
  hexes_taken int[] not null default '{}', inherited_hexes int[] default '{}',
  narrative text not null, resolved_at timestamptz not null default now(),
  engine_version text not null
);

create table atlas.hex_events (          -- append-only, source du replay
  id bigint generated always as identity primary key,
  hex_id int references atlas.hexes(id), match_id int,
  type text not null check (type in ('captured','inherited','neutral_claimed',
    'ruined','memorial','world_conquered','admin_fix')),
  from_owner text, to_owner text, from_state text, to_state text,
  narrative text, created_at timestamptz not null default now()
);

create table atlas.snapshots (
  date date primary key,
  frame jsonb not null,                  -- [{id,owner,state}] compact
  deltas jsonb not null,                 -- par nation: ±hexes du jour
  og_image_url text, story_image_url text
);

create table atlas.sim_runs (
  id bigint generated always as identity primary key,
  run_at timestamptz not null default now(), seed text not null,
  iterations int not null, engine_version text not null,
  probs jsonb not null    -- par nation: {p_qualify,p_top2,p_third_rescued,p_win_group,
                          --              p_r16,p_qf,p_sf,p_final,p_champion}
);

create table atlas.match_stakes (
  match_id int primary key references atlas.matches(id),
  sim_run_id bigint references atlas.sim_runs(id),
  drama int not null check (drama between 0 and 100),
  components jsonb not null,             -- swing, closeness, elim_flag, stage_w, upset_pot
  computed_at timestamptz default now()
);

create table atlas.qualification_conditions (
  group_letter text not null, nation text not null, sim_run_id bigint,
  status text not null check (status in ('qualified','eliminated','contender')),
  conditions jsonb not null,             -- [{text, gd_dependent}]
  primary key (group_letter, nation)
);

create table atlas.recaps (
  date date primary key,
  sections jsonb not null,               -- contenu structuré §8
  published_at timestamptz
);

create table atlas.game_config (key text primary key, value jsonb not null,
                                updated_at timestamptz default now());
create table atlas.ingest_state (key text primary key, value jsonb not null);
create table atlas.job_log (
  id bigint generated always as identity primary key,
  job text not null, ok bool not null, detail jsonb, created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- RLS : lecture publique, écriture service-role uniquement
-- ----------------------------------------------------------------------------

do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'atlas'
  loop
    execute format('alter table atlas.%I enable row level security', t);
    execute format(
      'create policy "public read" on atlas.%I for select to anon, authenticated using (true)', t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- game_config : valeurs initiales (spec §19) — surchargées en base sans deploy
-- ----------------------------------------------------------------------------

insert into atlas.game_config (key, value) values
  ('gain_group',  '2'),
  ('gain_r32_r16','4'),
  ('gain_qf',     '5'),
  ('gain_sf',     '6'),
  ('gain_third',  '3'),
  ('gain_final',  '10'),
  ('gain_goaldiff_cap', '2'),
  ('hard_cap',    '12'),
  ('overext_min', '0.5'),
  ('overext_max', '2.0'),
  ('inherit_ratio','0.5'),
  ('resolution_confirm_delay_s', '300'),
  ('elo_divisor', '600'),
  ('draw_base',   '0.26'),
  ('draw_slope',  '0.20'),
  ('draw_min',    '0.10'),
  ('mu_goals',    '2.6'),
  ('sim_iterations', '10000'),
  ('swing_iterations','2000'),
  ('drama_weights', '{"swing":0.35,"close":0.25,"elim":0.20,"stage":0.10,"upset":0.10}'),
  ('stage_weights', '{"GJ1":0.3,"GJ2":0.6,"GJ3":1,"R32":0.8,"R16":0.8,"QF":0.9,"SF":1,"FINAL":1}'),
  ('recap_time',  '"07:30"'),
  ('snapshot_time','"07:30"'),
  ('poll_fast_s', '120'),
  ('poll_slow_s', '1800'),
  ('tiebreakers', '["points","goal_difference","goals_for","head_to_head","fair_play_random","drawing_of_lots"]'),
  ('stage_mapping', '{"GROUP_STAGE":"GROUP","LAST_32":"R32","LAST_16":"R16","QUARTER_FINALS":"QF","SEMI_FINALS":"SF","THIRD_PLACE":"THIRD","FINAL":"FINAL"}'),
  ('game_over',   'false')
on conflict (key) do nothing;
