# DATA_MODEL_PROPOSAL — V2

Proposition de modèle de données. **À ne pas implémenter en Phase 0** — destiné à Phase 2 ([[IMPLEMENTATION_PLAN]]).

Hypothèse retenue : PostgreSQL via Supabase (cf. [[TARGET_ARCHITECTURE]] §4). Si une autre cible est validée, l'ossature logique reste valable.

## 0. Conventions

- Tous les `id` sont des `uuid` générés par défaut, sauf cas explicite.
- Tous les timestamps en `timestamptz`, par défaut `now()`.
- Toutes les colonnes texte courtes sont `text` ; pas de `varchar(N)` artificiel.
- Champs de métadonnées extensibles → `jsonb`.
- Aucune contrainte ne s'appuie sur une logique métier de scoring/buzz.
- Les conventions de nommage suivent le snake_case Postgres.

## 1. Entités footballistiques

```sql
create table entities (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique not null,
  type                     text not null check (type in ('player','team','coach','match','stadium','tournament')),
  canonical_label          text not null,
  wikidata_qid             text,
  subject_geography_label  text,
  subject_latitude         double precision,
  subject_longitude        double precision,
  metadata                 jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on entities (type);
create index on entities (wikidata_qid);
```

**Règle V2** : `subject_*` ne décrit **jamais** un contributeur. Seulement le sujet documenté (sélection, stade, etc.).

## 2. Articles Wikipédia

```sql
create table wiki_articles (
  id                  uuid primary key default gen_random_uuid(),
  entity_id           uuid not null references entities(id) on delete cascade,
  wiki_code           text not null,            -- ex: 'enwiki', 'frwiki'
  language_code       text not null,            -- ex: 'en', 'fr', 'ja'
  page_id             bigint,
  page_title          text not null,
  canonical_url       text not null,
  article_type        text not null check (article_type in ('player','team','match','tournament','stadium')),
  monitoring_enabled  boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (wiki_code, page_title)
);
create index on wiki_articles (entity_id);
create index on wiki_articles (monitoring_enabled) where monitoring_enabled = true;
```

Hérité du legacy `entity_sitelinks` (cf. [[LEGACY_SALVAGE_AUDIT]] §6) mais enrichi.

## 3. Matchs

```sql
create table matches (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  competition_label     text not null,
  stage_label           text not null,
  scheduled_at          timestamptz,
  home_team_entity_id   uuid references entities(id),
  away_team_entity_id   uuid references entities(id),
  status                text not null default 'upcoming'
                        check (status in ('upcoming','live','completed','cancelled')),
  official_source_name  text,
  official_source_url   text,
  source_verified_at    timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
```

**Règle V2 (cf. [[PRODUCT_RULES]] §11)** : aucun score / horaire / événement n'est exposé en `live` sans `source_verified_at IS NOT NULL`.

## 4. Périmètre de suivi par match

```sql
create table match_watchlist (
  id                 uuid primary key default gen_random_uuid(),
  match_id           uuid not null references matches(id) on delete cascade,
  article_id         uuid not null references wiki_articles(id) on delete cascade,
  role               text not null check (role in ('match','home_team','away_team','player','coach','tournament')),
  monitoring_reason  text not null,
  enabled            boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (match_id, article_id, role)
);
```

Hérité du legacy `match_watchlist` (cf. [[LEGACY_SALVAGE_AUDIT]] §7).

## 5. Traces / révisions observées

```sql
create table revision_traces (
  id                          uuid primary key default gen_random_uuid(),
  article_id                  uuid not null references wiki_articles(id) on delete cascade,
  wikimedia_event_id          text unique not null,
  revision_id                 bigint,
  previous_revision_id        bigint,
  observed_at                 timestamptz not null default now(),
  revision_timestamp          timestamptz not null,
  source_revision_url         text not null,
  source_diff_url             text,
  section_label               text,
  size_delta                  integer,
  revision_comment_sanitized  text,
  change_kind                 text,                   -- 'formatting'|'result_added'|'incident_added'|...
  public_status               text not null default 'private_raw'
                              check (public_status in ('private_raw','public_minor','public_substantive','linked_to_story')),
  ingest_status               text not null default 'observed'
                              check (ingest_status in ('observed','classified','reviewed','published_evidence')),
  created_at                  timestamptz not null default now(),
  unique (revision_id)
);
create index on revision_traces (article_id, observed_at desc);
create index on revision_traces (public_status);
create index on revision_traces (ingest_status);
```

**Privacy** :
- Aucune IP brute. Aucun `user_display` n'est exposé publiquement par défaut.
- Pas de fingerprint privé sans justification dédiée et validation explicite.
- `wikimedia_event_id UNIQUE` garantit l'idempotence (repris du legacy `edits.wm_event_id`).

## 6. Contenu privé des diffs

```sql
create table trace_private_content (
  trace_id           uuid primary key references revision_traces(id) on delete cascade,
  raw_added_text     text,
  raw_removed_text   text,
  fetched_at         timestamptz not null default now(),
  moderation_status  text not null default 'unreviewed'
                     check (moderation_status in ('unreviewed','flagged','approved_for_excerpt','rejected')),
  created_at         timestamptz not null default now()
);
```

**RLS** : `deny all` à la lecture publique (cf. [[SECURITY_PRIVACY_RULES]] §2). Accessible uniquement au worker et au Desk via service-role / auth dédiée.

## 7. Extraits publics modérés

```sql
create table public_trace_excerpts (
  trace_id                   uuid primary key references revision_traces(id) on delete cascade,
  public_added_excerpt       text,
  public_removed_excerpt     text,
  translated_excerpt         text,
  source_attribution_label   text not null,
  source_revision_url        text not null,
  license_label              text not null default 'CC BY-SA 4.0',
  safe_to_publish            boolean not null default false,
  reviewed_at                timestamptz,
  reviewed_by                uuid,
  created_at                 timestamptz not null default now()
);
create index on public_trace_excerpts (safe_to_publish) where safe_to_publish = true;
```

**Règle V2 non négociable** : aucun extrait n'est lisible en public tant que `safe_to_publish=false`.

## 8. Candidats privés

```sql
create table story_candidates (
  id                       uuid primary key default gen_random_uuid(),
  candidate_type           text not null,              -- 'language_divergence' | 'article_instability' | ...
  entity_id                uuid references entities(id),
  match_id                 uuid references matches(id),
  detection_reason         text not null,              -- texte libre, jamais affiché publiquement
  evidence_trace_ids       uuid[] not null default '{}',
  ai_assistance_payload    jsonb,                      -- sortie IA brute du Desk
  status                   text not null default 'pending'
                           check (status in ('pending','rejected','approved','converted_to_story')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
```

**Règle** : les candidats sont privés. Aucune surface publique ne les expose.

## 9. Stories publiées

```sql
create table published_stories (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  story_type            text not null
                        check (story_type in ('fact_entry','language_convergence','language_divergence',
                                              'article_instability','under_radar','match_recap')),
  title                 text not null,
  excerpt               text not null,
  observation_text      text not null,
  interpretation_text   text not null,
  limitation_text       text not null,
  entity_id             uuid references entities(id),
  match_id              uuid references matches(id),
  publication_status    text not null default 'draft'
                        check (publication_status in ('draft','published','corrected','retracted')),
  published_at          timestamptz,
  corrected_at          timestamptz,
  methodology_version   text,
  share_image_url       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on published_stories (publication_status);
create index on published_stories (story_type, published_at desc);
```

Cohérent avec les types frontend `PublishedStory`, `StoryArchiveItem` dans [src/types.ts](../../src/types.ts).

## 10. Preuves des stories

```sql
create table story_evidence (
  id              uuid primary key default gen_random_uuid(),
  story_id        uuid not null references published_stories(id) on delete cascade,
  trace_id        uuid references revision_traces(id) on delete set null,
  evidence_type   text not null
                  check (evidence_type in ('trace','compared_absence','official_match_event','comparison_snapshot')),
  public_label    text not null,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now()
);
create index on story_evidence (story_id, display_order);
```

## 11. Comparaisons entre éditions

```sql
create table comparison_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  story_id           uuid references published_stories(id) on delete set null,
  entity_id          uuid not null references entities(id),
  match_id           uuid references matches(id),
  comparison_topic   text not null,
  observed_at        timestamptz not null,
  observation_text   text not null,
  limitation_text    text not null,
  created_at         timestamptz not null default now()
);

create table comparison_snapshot_items (
  id                  uuid primary key default gen_random_uuid(),
  snapshot_id         uuid not null references comparison_snapshots(id) on delete cascade,
  article_id          uuid not null references wiki_articles(id),
  language_code       text not null,
  state               text not null
                      check (state in ('present','not_detected','reworded','unstable','not_compared')),
  public_excerpt_id   uuid references public_trace_excerpts(trace_id),
  short_observation   text not null,
  created_at          timestamptz not null default now()
);
```

Aligné sur les types `EntityComparisonCase`, `MatchLanguageComparison`, `ExplorerMatrixRow` côté frontend ([src/types.ts](../../src/types.ts)).

## 12. Instabilités d'article

```sql
create table article_instability_cases (
  id                 uuid primary key default gen_random_uuid(),
  article_id         uuid not null references wiki_articles(id),
  entity_id          uuid references entities(id),
  match_id           uuid references matches(id),
  passage_topic      text not null,
  status             text not null default 'candidate'
                     check (status in ('candidate','reviewed','published','rejected')),
  observation_text   text not null,
  limitation_text    text not null,
  detected_at        timestamptz not null,
  reviewed_at        timestamptz
);

create table article_instability_evidence (
  id                    uuid primary key default gen_random_uuid(),
  instability_case_id   uuid not null references article_instability_cases(id) on delete cascade,
  trace_id              uuid not null references revision_traces(id),
  action                text not null check (action in ('added','removed','restored','sourced','reworded')),
  display_order         integer not null default 0
);
```

Aligné sur `ArticleInstabilityCase` côté frontend.

## 13. Méthodologie et corrections

```sql
create table methodology_versions (
  id              uuid primary key default gen_random_uuid(),
  version_label   text unique not null,
  status          text not null default 'draft' check (status in ('draft','published','archived')),
  published_at    timestamptz,
  summary         text not null,
  content_json    jsonb not null default '{}'::jsonb
);

create table story_corrections (
  id                uuid primary key default gen_random_uuid(),
  story_id          uuid not null references published_stories(id) on delete cascade,
  correction_type   text not null,
  public_note       text not null,
  corrected_at      timestamptz not null,
  created_at        timestamptz not null default now()
);
```

## 14. Ingestion et erreurs

```sql
create table ingest_checkpoints (
  stream_name              text primary key,
  last_confirmed_event_id  text,
  last_confirmed_at        timestamptz,
  updated_at               timestamptz not null default now()
);

create table ingest_failures (
  id                       uuid primary key default gen_random_uuid(),
  stream_name              text not null,
  event_id                 text,
  revision_id              bigint,
  error_type               text not null,
  error_message_sanitized  text,
  retry_count              integer not null default 0,
  resolved_at              timestamptz,
  created_at               timestamptz not null default now()
);
create index on ingest_failures (stream_name, resolved_at);
```

Remplace le `worker_state` singleton du legacy en multi-stream + traçage explicite des échecs.

## 15. IA privée (Phase 5)

```sql
create table ai_analysis_runs (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid references story_candidates(id) on delete cascade,
  task_type       text not null,             -- 'translate'|'summarize'|'suggest_comparison'|...
  model_name      text not null,
  prompt_version  text not null,
  output_json     jsonb not null,
  created_at      timestamptz not null default now()
);

create table editorial_reviews (
  id                   uuid primary key default gen_random_uuid(),
  candidate_id         uuid not null references story_candidates(id) on delete cascade,
  reviewer_id          uuid not null,
  decision             text not null check (decision in ('approve','reject','request_changes','convert_to_story')),
  correction_notes     text,
  published_story_id   uuid references published_stories(id),
  reviewed_at          timestamptz not null default now()
);
```

**Strictement privé.** Ces données ne sont jamais accessibles via l'API publique.

## 16. Vues publiques recommandées

Pour limiter la surface RLS et faciliter le cache :

```sql
create view v_public_stories as
  select id, slug, story_type, title, excerpt, observation_text, interpretation_text,
         limitation_text, entity_id, match_id, published_at, corrected_at,
         methodology_version, share_image_url
  from published_stories
  where publication_status in ('published','corrected');

create view v_public_observatory_traces as
  select rt.id as trace_id,
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
  from revision_traces rt
  join wiki_articles wa on wa.id = rt.article_id
  join public_trace_excerpts pte on pte.trace_id = rt.id
  where pte.safe_to_publish = true
    and rt.public_status in ('public_minor','public_substantive','linked_to_story');
```

## 17. RLS

Voir [[SECURITY_PRIVACY_RULES]] pour les policies détaillées. Principes :

- `published_stories` : `select` public uniquement pour `publication_status in ('published','corrected')`.
- `public_trace_excerpts` : `select` public uniquement si `safe_to_publish=true`.
- Toutes les tables privées (`story_candidates`, `trace_private_content`, `ai_analysis_runs`, `editorial_reviews`, `ingest_*`) : `deny all` public ; accès via service-role (worker) ou auth Desk (Phase 5).

## 18. Points à valider avant implémentation (Phase 2)

| # | Point | Décision attendue |
| - | ----- | ----------------- |
| 1 | Conserver Supabase ou migrer vers Postgres "nu" | Recommandation : conserver Supabase pour Phase 2 (RLS clé en main). |
| 2 | API publique : PostgREST/Supabase auto vs Edge Functions custom | Edge Functions custom recommandées pour pouvoir versionner et tester. |
| 3 | Format de `change_kind` | Énumération vs `text` libre. Reco : `text` libre pour Phase 2, énumération si stabilisée. |
| 4 | Stocker `metadata jsonb` extensible vs colonnes fixes | OK pour `entities.metadata`, à limiter ailleurs. |
| 5 | Authentification Desk | Supabase Auth (email+OTP) recommandé, restera privé. |
| 6 | Données sportives officielles : table dédiée vs intégration dans `matches` | Recommandation : `matches.official_source_*` au début ; table dédiée `match_official_events` si besoin Phase 6. |
| 7 | Indexation full-text pour `/search` | Reco : `tsvector` Postgres + GIN sur `published_stories` + `methodology_versions`. |
| 8 | Stratégie multi-langue côté backend | Recommandation : pas de traduction stockée tant que pas validée. Pas de `i18n` tables initialement. |
