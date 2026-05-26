# PUBLIC_API_PROPOSAL — V2

Proposition d'API publique en lecture seule. **À ne pas implémenter en Phase 0.** Sert de contrat cible pour `LivePublicDataProvider` (cf. [[TARGET_ARCHITECTURE]] §3 et [[IMPLEMENTATION_PLAN]] Phase 2).

## 0. Conventions

- Tous les endpoints sont en `GET`. Aucun `POST/PUT/PATCH/DELETE` publics.
- Réponses JSON, `Content-Type: application/json; charset=utf-8`.
- Erreurs : `{ "error": { "code": "...", "message": "..." } }`, codes HTTP standards.
- Cache : `Cache-Control: public, max-age=60, stale-while-revalidate=300` par défaut. `s-maxage=300` côté CDN. Override par endpoint en §6.
- Pagination : `?limit=20&cursor=<opaque>` ; réponse contient `next_cursor` ou `null`.
- Filtres : query-params explicites listés par endpoint.
- Localisation : pas de header `Accept-Language` en Phase 1. Les langues observées sont des **codes de wiki**, pas des préférences de lecture.
- Versionnement : préfixe `/api/public/v1/`. Pas de bump avant Phase 6.
- Anonyme uniquement : aucun token, aucun cookie. CORS large (`Access-Control-Allow-Origin: *`).
- Mode `demo` vs `live` : géré côté frontend via `PublicDataProvider` ; l'API ne sert **que** des données publiques **réelles**. Les fixtures restent côté frontend en mode `demo` (cf. [[TARGET_ARCHITECTURE]] §3).

**Implémentation P2 initiale (2026-05-26)** : les endpoints Vercel
`api/public/v1/*` lisent `public_page_snapshots.page_key` dans Supabase.
C'est un pont volontaire entre les contrats frontend riches et le modèle
normalisé. Il sera remplacé progressivement par des projections SQL / Desk
publication workflow, sans changer les routes publiques.

## 1. Homepage

```
GET /api/public/v1/home
```

**Réponse :**

```jsonc
{
  "featured_story": { /* PublishedStorySummary | null */ },
  "latest_stories": [ /* PublishedStorySummary[], max 6 */ ],
  "next_match": { /* PublicMatchSummary | null, avec source_verified */ },
  "editorial_indicators": {
    "published_stories_count": 12,
    "monitored_articles_count": 348,
    "compared_editions_count": 5
  }
}
```

**Exclus** : aucun candidat, aucun score brut, aucune fixture en mode live.

## 2. Stories

```
GET /api/public/v1/stories
GET /api/public/v1/stories/:slug
```

**Filtres `/stories`** : `type`, `match_slug`, `entity_slug`, `language`, `since`, `until`, `limit`, `cursor`.

**Réponse `/stories`** :

```jsonc
{
  "items": [ /* PublishedStorySummary[] */ ],
  "next_cursor": "..."
}
```

**Réponse `/stories/:slug`** :

```jsonc
{
  "story": { /* PublishedStoryDetail */ },
  "evidence": [ /* PublicStoryEvidence[] */ ],
  "comparison_snapshots": [ /* PublicComparisonSnapshot[] */ ],
  "related_story_slugs": ["..."],
  "methodology_version": "v0.3"
}
```

**Exclus** : `interpretation_text` interne au Desk, sortie IA, candidats associés.

## 3. Matchs

```
GET /api/public/v1/matches
GET /api/public/v1/matches/:slug
```

**Filtres `/matches`** : `phase`, `status`, `team_slug`, `since`, `until`, `limit`, `cursor`.

**Réponse `/matches/:slug`** :

```jsonc
{
  "match": { /* PublicMatchDetail, official_source_* obligatoire pour status='live'|'completed' */ },
  "stories": [ /* PublishedStorySummary[] */ ],
  "watchlist_summary": {
    "languages_compared": ["en","fr","es","ja"],
    "monitored_subjects_count": 18
  },
  "comparison_snapshots": [ /* PublicComparisonSnapshot[] */ ],
  "approved_sources": [
    { "label": "FIFA Match Center", "url": "https://...", "verified_at": "2026-06-12T18:30:00Z" }
  ]
}
```

**Règle** : si `status in ('live','completed')` et aucune source officielle n'est attachée, le champ `score`, `minute` et `events` doivent être **absents** (pas null, pas faux : absents).

## 4. Entités

```
GET /api/public/v1/entities/:slug
```

**Réponse :**

```jsonc
{
  "entity": { /* PublicEntityDetail */ },
  "articles_compared": [
    { "language_code": "ja", "canonical_url": "...", "monitoring_reason": "..." }
  ],
  "stories": [ /* PublishedStorySummary[] */ ],
  "matches": [ /* PublicMatchSummary[] */ ],
  "comparison_snapshots": [ /* PublicComparisonSnapshot[] */ ]
}
```

**Exclus** : aucun score d'activité brut, aucune métrique de fréquence d'edits.

## 5. Explorer

```
GET /api/public/v1/explorer
```

**Filtres** : `view_mode` (`atlas|matrix|timeline`), `story_type`, `language`, `since`, `until`.

**Réponse :**

```jsonc
{
  "stats": { /* ExplorerStats */ },
  "atlas_anchors": [ /* StoryGeoAnchor[] — uniquement des stories publiées */ ],
  "matrix_rows": [ /* ExplorerMatrixRow[] */ ],
  "timeline_events": [ /* ExplorerTimelineEvent[] */ ],
  "legend": [ /* ExplorerLegendItem[] */ ]
}
```

**Règle** : `atlas_anchors[].latitude/longitude` proviennent de `entities.subject_latitude/longitude` (sujet, jamais contributeur, cf. [[PRODUCT_RULES]] §6).

## 6. Observatoire

```
GET /api/public/v1/observatory/traces
GET /api/public/v1/observatory/traces/:id
```

**Filtres `/traces`** : `language`, `status`, `article_type`, `match_slug`, `q`, `limit`, `cursor`.

**Réponse `/traces`** :

```jsonc
{
  "stats": { /* ObservatoryPublicStats */ },
  "items": [
    {
      "id": "...",
      "observed_at": "2026-06-12T19:42:13Z",
      "language_code": "es",
      "article_canonical_url": "...",
      "section_label": "Sanción disciplinaria",
      "change_status": "substantive",
      "change_kind": "incident_mention_added",
      "summary": "Mention d'une altercation ajoutée à la section…",
      "added_excerpt": "…",          // depuis public_trace_excerpts uniquement si safe_to_publish=true
      "removed_excerpt": null,
      "translated_excerpt": "…",
      "source_attribution_label": "Wikipedia (es) — révision 12345678",
      "source_revision_url": "https://es.wikipedia.org/?diff=12345678",
      "license_label": "CC BY-SA 4.0",
      "related_story": null            // ou { slug, title }
    }
  ],
  "next_cursor": "..."
}
```

**Cache** : `max-age=30, stale-while-revalidate=120` (mise à jour plus fréquente que magazine).

**Exclus impérativement (RFC stricte, cf. [[SECURITY_PRIVACY_RULES]])** :
- contenu brut privé,
- identité de contributeur (`user_display`, IP, Temporary Account ID),
- candidats privés,
- sorties IA,
- logs internes,
- `revision_traces.public_status='private_raw'` (ne doivent jamais apparaître).

## 7. Méthodologie

```
GET /api/public/v1/methodology
```

**Réponse :**

```jsonc
{
  "current_version": "v0.3",
  "summary": "...",
  "content": { /* MethodologyData typé côté frontend */ },
  "history": [ /* MethodologyVersionEntry[] */ ]
}
```

**Cache** : `max-age=3600`.

**Alternative** : la page peut rester **statique** côté frontend si la méthodologie n'a pas besoin d'être administrée dynamiquement en Phase 1–4. Décision à arbitrer en Phase 2.

## 8. Recherche publique

```
GET /api/public/v1/search?q=<query>&type=&language=&limit=&cursor=
```

**Recherche limitée à** :
- `published_stories.title / excerpt / observation_text`,
- `matches.competition_label / stage_label / slug`,
- `entities.canonical_label / slug`,
- `public_trace_excerpts.public_added_excerpt / translated_excerpt` (uniquement `safe_to_publish=true`),
- `methodology_versions.content_json` champ "searchable".

**Réponse :**

```jsonc
{
  "items": [
    {
      "kind": "story" | "match" | "entity" | "trace" | "methodology",
      "slug": "...",
      "title": "...",
      "excerpt": "...",
      "language_code": "en",
      "route": "/story/...",
      "highlights": ["...mot recherché en contexte..."]
    }
  ],
  "next_cursor": "..."
}
```

**Exclus** :
- candidats privés,
- diffs privés,
- sorties IA,
- contributeurs,
- logs worker.

**Implémentation** : `tsvector` Postgres + GIN sur les vues `v_public_stories`, `v_public_observatory_traces`, etc. (cf. [[DATA_MODEL_PROPOSAL]] §16).

## 9. Cache, CDN et performance

| Endpoint | `s-maxage` CDN | `max-age` client | `stale-while-revalidate` |
| -------- | --------------: | ---------------: | -----------------------: |
| `/home`, `/stories`, `/stories/:slug`, `/matches`, `/matches/:slug`, `/entities/:slug`, `/explorer` | 300 | 60 | 300 |
| `/methodology` | 3600 | 600 | 3600 |
| `/observatory/traces`, `/observatory/traces/:id` | 60 | 30 | 120 |
| `/search` | 30 | 30 | 60 |

**Pas de polling** côté frontend. Pas de WebSocket public. Pas de SSE public.

## 10. Sécurité et stabilité

| Mesure | Détail |
| ------ | ------ |
| Anonyme uniquement | Aucun token, aucun cookie. |
| CORS | `Access-Control-Allow-Origin: *`. |
| Rate-limit IP | À définir Phase 2 : ~60 req/min sans burst contrôlé. À mettre derrière Cloudflare ou équivalent. |
| Schémas validés | Tous les paramètres `query` sont validés (Zod) côté API. |
| Erreurs génériques | 4xx avec message court, 5xx sans détail technique. Détails côté logs serveur uniquement. |
| Versionnement | `/v1/`. Toute breaking change = `/v2/`, deprecation documentée dans `/methodology`. |
| Conformité Wikimedia | Toutes les `source_revision_url` pointent vers `*.wikipedia.org` / `*.wikimedia.org`. |
| Licence des extraits | Champ `license_label` obligatoire, défaut `CC BY-SA 4.0`. |

## 11. Comportement demo vs live (côté frontend, rappel)

- En `demo` : l'API n'est pas appelée. `DemoPublicDataProvider` sert toutes les réponses depuis [src/mock*Data.ts](../../src).
- En `live` : `LivePublicDataProvider` appelle uniquement `/api/public/v1/*`. Aucun fallback vers les fixtures.
- En `live`, si l'endpoint répond `[]` ou `null`, l'UI affiche un **empty state honnête** (texte clair, pas de fixture, pas de placeholder fictif).

## 12. Endpoints internes du Desk (Phase 5, non publics — pour mémoire)

Ces endpoints n'apparaissent pas dans `/api/public/v1/*` et ne sont **jamais** exposés sans auth :

- `POST /api/desk/candidates/:id/approve`
- `POST /api/desk/candidates/:id/reject`
- `POST /api/desk/stories` (création depuis un candidat)
- `PATCH /api/desk/stories/:id` (édition)
- `POST /api/desk/excerpts/:trace_id/publish` (set `safe_to_publish=true`)
- `POST /api/desk/ai/runs` (demande IA, Desk uniquement)
- `POST /api/desk/corrections`

Documentés ici uniquement pour clarifier la **séparation public/privé** ; aucune URL `/api/desk/*` n'est routée côté frontend public.
