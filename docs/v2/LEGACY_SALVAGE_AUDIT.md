# LEGACY_SALVAGE_AUDIT — `C:\Users\thoma\revision90-worker`

Audit en lecture seule. Aucune modification effectuée dans ce dossier. Aucune valeur de secret n'a été lue ni recopiée.

## 1. Accessibilité et état du dépôt

- **Chemin accessible** : OUI.
- **Versionné Git** : OUI (présence de `.git`).
- **Documents racine** : `README.md`, `REVISION90_PRODUCT_PLAN.md` (daté 2026-05-25), `BRIEF_MOBILE.md`, `DESIGN.md`, `Dockerfile`, `info.txt`, `log.md`, `log2.txt`.
- **Dépendances tierces** : `node_modules` présent (NON inspecté).
- **Build artefacts** : `dist/` présent (NON inspecté).
- **Aucun `.env` ni secret n'a été ouvert.** Seul `.env.example` aurait pu être lu — pas nécessaire pour ce rapport.

## 2. Architecture détectée

Le legacy est un **monorepo léger** :

```
revision90-worker/
├── src/                          ← Worker SSE Wikimedia (Node 20+, TypeScript)
│   ├── ingest.ts                 ← Entrée worker
│   ├── filters.ts                ← Pre-filter SSE, safeUser, bytesDiff
│   ├── revert.ts                 ← Détection multilingue de reverts
│   ├── wiki-diff.ts              ← Fetch MediaWiki action=compare + parse HTML
│   ├── state.ts                  ← Checkpoint Last-Event-ID dans Supabase
│   ├── supabase.ts               ← Client Supabase service-role
│   ├── config.ts                 ← User-Agent Wikimedia
│   ├── index-loader.ts           ← Chargement de l'index entités → sitelinks
│   ├── health-server.ts          ← Endpoint /health
│   ├── types.ts                  ← WikimediaRecentChange, EditRow, IndexedEntity
│   ├── signal.ts                 ← Classification déterministe de signaux (scoring)
│   ├── interpret.ts              ← Interprétation IA (OpenAI gpt-4o-mini)
│   ├── promote.ts                ← Promotion candidats → cards publiques
│   ├── revert.ts / wiki-diff.test.ts / signal.test.ts ← Tests unitaires
│   ├── dashboard.ts              ← Cockpit (CLI ou serveur, NON CONFIRMÉ)
│   ├── start.ts / wc26.ts        ← Entrées secondaires
│
├── apps/web/                     ← Ancien frontend Next.js 15 + React 19
│   ├── app/, components/, lib/, public/
│   ├── e2e/ (Playwright)
│   ├── scripts/, lighthouserc.json, vercel.json
│   └── deps notables : @supabase/supabase-js, openai, cobe, canvas-confetti
│
├── sql/                          ← 16 migrations + analyze
│   ├── schema.sql                ← Base : entities, entity_sitelinks, edits, worker_state
│   ├── 2026-05-25-signal-model.sql
│   ├── 2026-05-25-signal-reset.sql
│   ├── 2026-05-25-diff-content.sql
│   ├── 2026-05-25-editorial-incidents.sql
│   ├── 2026-05-25-incident-reviews.sql
│   ├── 2026-05-31-match-watchlist.sql
│   ├── 2026-06-02-tournament-legacy.sql
│   ├── phase1-scoring.sql        ← drama_score formula
│   ├── phase1-drilldown.sql
│   ├── phase2-5-news-burst-and-score.sql
│   ├── phase2-credibility-analytics.sql
│   ├── phase2-trophy-detection.sql
│   ├── phase3-match-recaps.sql
│   ├── phase4-war-bursts.sql     ← Table edit-war + dédup, vues 24h
│   └── analyze-volume.sql
│
├── scripts/                      ← 11 scripts utilitaires Node/tsx
│   ├── build-index.ts            ← Sitelinks Wikidata multi-langues
│   ├── build-match-watchlist.ts  ← Watchlist par match
│   ├── build-wc26-schedule.ts
│   ├── import-wc26-schedule.ts
│   ├── seed-db.ts                ← Upsert entities + sitelinks
│   ├── verify-qids.ts            ← Validation Wikidata QID
│   ├── refresh-types.ts
│   ├── expand-seed.ts
│   ├── decisive-test-sample.ts
│   ├── decisive-test-analyze.ts
│   └── simulate-overview-load.ts
│
├── data/                         ← Index entités + seed (NON OUVERT en détail)
├── docs/                         ← 12 documents (brief, prd, methodology, deployment, a11y-audit, bmad-audit, sprint runbooks, launch-readiness, research-product-strategy)
├── Dockerfile                    ← Build worker pour Railway/Render
└── package.json                  ← Node 20+, tsx, @supabase/supabase-js, openai, eventsource, ws
```

## 3. Worker SSE Wikimedia ([src/ingest.ts](../../src/ingest.ts))

**Fiabilité observée — qualité bien supérieure à la moyenne pour un prototype :**

| Propriété | Implémentation observée |
| --------- | ----------------------- |
| Source | `https://stream.wikimedia.org/v2/stream/recentchange` via `eventsource@2` |
| User-Agent | Configurable via env `WIKIMEDIA_USER_AGENT`, défaut documenté avec contact ([src/config.ts](../../src/config.ts)) |
| Reprise via `Last-Event-ID` | OUI — header `Last-Event-ID` posé à la reconnexion |
| Persistance du checkpoint | Table `worker_state` Supabase, flush toutes les 30s + à l'arrêt SIGINT/SIGTERM |
| Watchdog | Toutes les 10s, reconnect si silence > 60s |
| Backoff exponentiel | OUI, plafond 30s, reset après 60s de stabilité |
| Batching d'inserts | OUI, taille 50, flush 1s |
| Idempotence/dédup | UNIQUE constraint `edits.wm_event_id` + `upsert(onConflict: 'wm_event_id', ignoreDuplicates: true)` |
| **Checkpoint après écriture confirmée** | **OUI** — `lastEventId` n'est mis à jour qu'après succès du `upsert` (ligne 196-208). Conforme à la règle V2 "checkpoint ne progresse qu'après écriture confirmée". |
| Retry en cas d'échec d'insert | OUI — batch remis en tête de queue, retry après 5s |
| Shutdown propre | SIGINT/SIGTERM → drain queue puis `flushState()` |
| Métriques | `[stats]` toutes les 5 min : matched, filtered, inserted, batches, errors, reverts, reconnects, queue |
| Endpoint health | OUI ([src/health-server.ts](../../src/health-server.ts), NON ouvert mais référencé) |
| Filtrage privacy | `safeUser` ([src/filters.ts](../../src/filters.ts)) masque IPv4, IPv6, Temporary Account IDs (`~…`) — **les IPs ne sont jamais stockées en clair** |

**Verdict : RÉUTILISABLE APRÈS REFACTOR LÉGER.** Le worker est solide. Adaptations V2 :
1. Conserver `wm_event_id`, `last_event_id` checkpoint, watchdog, backoff, batching.
2. Renommer la table de destination (`edits` → `revision_traces`) et étendre le schéma (champs `section_label`, `change_kind`, `public_status`, `revision_timestamp`, etc.).
3. Supprimer toute logique de scoring/promotion au stade ingestion — laisser pour Phase 5 (Desk privé).
4. Vérifier la conformité du User-Agent (contact réel maintenu).

## 4. Contenu des diffs ([src/wiki-diff.ts](../../src/wiki-diff.ts))

Fetcher MediaWiki `action=compare` + extraction `addedline`/`deletedline` + détection fine `<ins class="diffchange">` / `<del>` pour l'extrait du changement précis, timeout 8s, truncation **800 chars / side** + flag `truncated`, heuristique `isLinkOnlyDiff()` pour éviter les analyses inutiles.

**Verdict : RÉUTILISABLE TEL QUEL** (modulo : faire passer le contenu brut par `trace_private_content` et **ne jamais** l'afficher en `public_trace_excerpts` sans modération — cf. [[DATA_MODEL_PROPOSAL]] §3 et §4).

## 5. Stockage Supabase ([src/supabase.ts](../../src/supabase.ts), [src/state.ts](../../src/state.ts))

Client `@supabase/supabase-js@2`, **service-role key**, realtime via `ws`. State checkpoint upsert sur `worker_state` (singleton `id=1`).

**Verdict : RÉUTILISABLE TEL QUEL** pour le côté worker (service-role doit rester côté serveur, jamais en frontend — règle V2 confirmée).

## 6. Schéma de base initial ([sql/schema.sql](../../sql/schema.sql))

```sql
entities          (id PK, name, type CHECK, country_code, metadata jsonb)
entity_sitelinks  (wiki, title, entity_id FK → entities)  -- PK (wiki, title)
edits             (id BIGSERIAL, wm_event_id UNIQUE, entity_id, wiki, title,
                   user_display, is_anon, bytes_diff, comment, rev_old, rev_new,
                   is_revert, ts, ingested_at)
worker_state      (id=1, last_event_id, last_event_at, updated_at)
```

**Verdict : RÉUTILISABLE APRÈS REFACTOR** comme socle de [[DATA_MODEL_PROPOSAL]] §1 (`entities`) et §5 (`revision_traces`). À renommer / enrichir mais structure correcte.

## 7. Watchlist par match ([sql/2026-05-31-match-watchlist.sql](../../sql/2026-05-31-match-watchlist.sql))

```sql
match_watchlist (match_id, entity_id, role CHECK IN ('team','player_squad','coach','match_page','tournament','other'), added_at)
```

**Verdict : RÉUTILISABLE APRÈS REFACTOR**. Renommer `role` selon le modèle V2 (cf. [[DATA_MODEL_PROPOSAL]] §4).

## 8. Scripts utilitaires ([scripts/](../../scripts))

| Script | Verdict |
| ------ | ------- |
| `verify-qids.ts` | RÉUTILISABLE TEL QUEL — validation Wikidata QID, indispensable. |
| `build-index.ts` | RÉUTILISABLE TEL QUEL — résolution sitelinks multi-langues. |
| `seed-db.ts` | RÉUTILISABLE APRÈS REFACTOR — adapter au nouveau schéma `entities` / `wiki_articles`. |
| `import-wc26-schedule.ts` | RÉUTILISABLE APRÈS REFACTOR — séparer source officielle vérifiée (cf. règle "données sportives ≠ Wikimedia"). |
| `build-match-watchlist.ts` | RÉUTILISABLE APRÈS REFACTOR — bonne logique de scoping. |
| `build-wc26-schedule.ts` | À VÉRIFIER. |
| `expand-seed.ts`, `refresh-types.ts` | À VÉRIFIER. |
| `decisive-test-*` | À VÉRIFIER — utiles pour validation de qualité d'analyse. |
| `simulate-overview-load.ts` | À ABANDONNER — simulait la charge sur l'ancienne API `/api/overview` (polling). |

## 9. À ABANDONNER : signaux, IA décisive, scoring, edit-wars

| Élément | Fichier(s) | Raison |
| ------- | ---------- | ------ |
| `signal.ts` — `SignalType` (`activity_spike`, `large_change`, `anonymous_burst`, `revert_sequence`, `multi_language`, `match_window_activity`, `section_focus`), `score` 0–100, `confidence` | [src/signal.ts](../../src/signal.ts) | V2 interdit la promotion automatique fondée sur un score de volume/fréquence. |
| `interpret.ts` — OpenAI `gpt-4o-mini` produisant `headline / fact / inference / unknown`, budget USD daily cap, cache 5 min | [src/interpret.ts](../../src/interpret.ts) | V2 : l'IA n'est jamais éditrice autonome. Possible **réutilisation interne** dans le Desk privé Phase 5, jamais pour publier en automatique. |
| `promote.ts` — promotion candidats → cards publiques | [src/promote.ts](../../src/promote.ts) | Toute publication V2 passe par revue humaine. |
| `dashboard.ts` | [src/dashboard.ts](../../src/dashboard.ts) | Cockpit live abandonné. |
| `wc26.ts` | [src/wc26.ts](../../src/wc26.ts) | À VÉRIFIER — probablement fixtures dures. |
| `phase1-scoring.sql` — vue `entity_drama_now`, formule `drama_score = 2×edits + 3×langs + 5×reverts + 1×large_deltas` | [sql/phase1-scoring.sql](../../sql/phase1-scoring.sql) | Vocabulaire `drama` interdit. Formule volume-based interdite. |
| `phase4-war-bursts.sql` — table `war_bursts`, vue `war_bursts_24h` | [sql/phase4-war-bursts.sql](../../sql/phase4-war-bursts.sql) | Vocabulaire `war` interdit. **Aussi** : ancienne route `/api/wars/log` mentionnée en commentaire (client-driven writes) — risque de sécurité documenté comme déjà retiré. |
| `phase2-5-news-burst-and-score.sql` | [sql/phase2-5-news-burst-and-score.sql](../../sql/phase2-5-news-burst-and-score.sql) | "Burst" / "score" auto. |
| `phase1-drilldown.sql`, `phase2-trophy-detection.sql`, `phase2-credibility-analytics.sql`, `phase3-match-recaps.sql` | [sql/](../../sql) | Toutes basées sur des heuristiques scoring qui ne tiennent pas la promesse V2. À étudier individuellement pour reprendre éventuellement des concepts (ex. section parsing), pas les vues. |
| `apps/web/` — frontend Next.js 15 cockpit | [apps/web/](../../apps/web) | Le V2 AI Studio le remplace. Conserver pour référence/lecture seule. Dépendances notables qui **ne doivent pas revenir** : `cobe` (globe WebGL → `GlobeHero`), `canvas-confetti` (gamification), `openai` côté front. |
| `docs/methodology.md` (legacy) | [docs/methodology.md](../../docs/methodology.md) | Décrit la formule `drama_score`. À archiver. La V2 a [[PRODUCT_RULES]] + `src/pages/Methodology.tsx`. |

## 10. Tableau de synthèse de récupération

| Élément legacy | Fichier(s) | Décision | Justification | Risque |
| -------------- | ---------- | -------- | ------------- | ------ |
| Worker SSE EventSource | [src/ingest.ts](../../src/ingest.ts) | **REFACTOR** | Reprise reconnect/watchdog/backoff/batch/idempotence ; cibler `revision_traces` | Faible |
| Fetch diff MediaWiki | [src/wiki-diff.ts](../../src/wiki-diff.ts) | **TEL QUEL** | Robuste, sanitation OK | Faible si stocké en privé |
| Filtres + safeUser | [src/filters.ts](../../src/filters.ts) | **TEL QUEL** | Garantit que les IPs/TempAccounts ne sont jamais stockés en clair | Faible |
| Détection revert multilingue | [src/revert.ts](../../src/revert.ts) | **TEL QUEL** | Regex simple, multilingue | Faible |
| Checkpoint state | [src/state.ts](../../src/state.ts) | **TEL QUEL** | Pattern singleton clean | Faible |
| Health server | [src/health-server.ts](../../src/health-server.ts) | **À VÉRIFIER** | Non ouvert ; sans doute trivial | Faible |
| Client Supabase service-role | [src/supabase.ts](../../src/supabase.ts) | **TEL QUEL** | Bonne séparation backend | Faible |
| Schéma initial (`entities`/`entity_sitelinks`/`edits`/`worker_state`) | [sql/schema.sql](../../sql/schema.sql) | **REFACTOR** | Socle correct, enrichir et renommer | Faible |
| `match_watchlist` | [sql/2026-05-31-match-watchlist.sql](../../sql/2026-05-31-match-watchlist.sql) | **REFACTOR** | Concept réutilisable | Faible |
| `verify-qids.ts`, `build-index.ts` | [scripts/](../../scripts) | **TEL QUEL** | Indispensables pour QID Wikidata | Faible |
| `seed-db.ts`, `import-wc26-schedule.ts`, `build-match-watchlist.ts` | [scripts/](../../scripts) | **REFACTOR** | Adapter au nouveau schéma + séparer source sportive officielle | Moyen |
| Tests existants (`signal.test.ts`, `wiki-diff.test.ts`) | [src/](../../src) | **À VÉRIFIER / récupérer pour `wiki-diff`** | `signal.test.ts` à archiver | Faible |
| `signal.ts`, `interpret.ts`, `promote.ts`, `dashboard.ts`, `wc26.ts`, `start.ts` | [src/](../../src) | **ABANDON** (interpret peut renaître **isolé** dans le Desk privé Phase 5) | Vocabulaire et logique incompatibles V2 | Élevé si réintroduit naïvement |
| Migrations scoring/drama/war/burst/recaps | [sql/phase*.sql](../../sql) | **ABANDON** | Vocabulaire/logique interdits | Élevé si réintroduits |
| Ancien frontend Next.js | [apps/web/](../../apps/web) | **ABANDON** (référence seulement) | Remplacé par V2 AI Studio | Élevé si tout ou partie est ré-importé |
| `Dockerfile` (worker) | [Dockerfile](../../Dockerfile) | **À VÉRIFIER** | Probablement réutilisable pour le nouveau worker | Faible |
| Docs : `prd.md`, `brief.md`, `deployment.md`, `a11y-audit.md`, `front-end-spec.md`, `research-product-strategy.md`, `bmad-audit.md`, `phase-0-runbook.md`, `sprint-*.md`, `launch-readiness-p3.md` | [docs/](../../docs) | **À VÉRIFIER** archivage | Le `REVISION90_PRODUCT_PLAN.md` 2026-05-25 contient déjà le pivot — utile pour traçabilité | Faible |

## 11. Risques d'intégrité du legacy

| Catégorie | Risque |
| --------- | ------ |
| **Intégrité données** | Le worker actuel respecte déjà la règle "checkpoint après upsert confirmé". À préserver lors du refactor. Risque si Phase 3 introduit du fire-and-forget. |
| **Sécurité** | Service-role Supabase utilisée côté worker uniquement (correct). Mais l'ancien front Next.js dépend aussi de `@supabase/supabase-js` — vérifier qu'il n'expose pas la service-key (NON VÉRIFIÉ exhaustivement, à confirmer si on conserve quoi que ce soit de `apps/web/`). Ancien endpoint `/api/wars/log` mentionné comme retiré — confirmer qu'il l'est bien et n'a pas de jumeau. |
| **Privacy** | `safeUser` est conforme. Aucun stockage IP brute observé. **Mais** les diffs `wiki-diff.ts` peuvent contenir vandalisme, insultes, données personnelles, diffamation — V2 exige qu'ils restent **privés par défaut** (`trace_private_content`) et que la publication passe par `public_trace_excerpts.safe_to_publish=true`. |
| **Performance** | Worker bien dimensionné. Côté ancien front, polling agressif possible (`simulate-overview-load.ts` simulait `/api/overview`) — à ne pas reproduire en V2. |
| **Produit / sémantique** | La majorité du SQL est imprégnée du vocabulaire `drama / war / burst / score` qui est explicitement interdit en V2. |

## 12. Conclusion LEGACY_SALVAGE_AUDIT

Le legacy est techniquement de bonne qualité, surtout sur l'**ingestion**. Les briques d'infrastructure (worker SSE, fetch diff, filtres, checkpoint, scripts QID) sont **réutilisables** moyennant un refactor de schéma et la séparation stricte entre **collecte** (privée) et **publication** (humainement validée).

À l'inverse, **toute la couche éditoriale automatique** (scoring, IA d'interprétation publique, promotion automatique, vues `*_drama / *_war / *_burst`, ancien frontend cockpit avec globe et confetti) doit être **abandonnée** au sens V2. Une partie de l'IA d'interprétation peut renaître **strictement à l'intérieur du Desk privé** (Phase 5), jamais en feed public.
