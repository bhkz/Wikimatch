# TARGET_ARCHITECTURE — WikiMatch / Revision 90 V2

Architecture cible adaptée à la stack réellement détectée (cf. [[FRONTEND_AUDIT]]). À valider en bloc avant Phase 1.

## 1. Principes structurants

1. **Séparer collecte (Wikimedia)** et **publication (validée humainement)**.
2. **Séparer données publiques en lecture seule** et **données privées (Desk)**.
3. **Séparer traces Wikipédia** et **données sportives officielles**.
4. **Frontend public en lecture seule**, sans clé de service, sans écriture.
5. **Demo / Live** activable sans changement de code de l'UI.

## 2. Schéma textuel des couches

```
                      ┌──────────────────────────────────────────┐
                      │       Wikimedia EventStreams (SSE)        │
                      │  https://stream.wikimedia.org/v2/stream/  │
                      │            recentchange                   │
                      └──────────────────────────────────────────┘
                                       │
                                       ▼
                      ┌──────────────────────────────────────────┐
                      │   WORKER d'ingestion (Node 20+, TS)       │
                      │   - SSE + Last-Event-ID + watchdog        │
                      │   - filtres preFilter + safeUser          │
                      │   - fetch diff MediaWiki action=compare   │
                      │   - batch upsert idempotent               │
                      │   - checkpoint UNIQUEMENT après upsert OK │
                      │   - User-Agent identifié, contact réel    │
                      └──────────────────────────────────────────┘
                                       │
                                       ▼
                      ┌──────────────────────────────────────────┐
                      │   BASE DE DONNÉES (Postgres / Supabase)   │
                      │                                            │
                      │   PRIVÉ                                    │
                      │   - revision_traces (state-machine)        │
                      │   - trace_private_content (diffs bruts)    │
                      │   - story_candidates                        │
                      │   - ai_analysis_runs                        │
                      │   - editorial_reviews                       │
                      │   - ingest_checkpoints / ingest_failures    │
                      │                                            │
                      │   PUBLIC (RLS lecture seule, sélectif)     │
                      │   - entities (subset publiable)            │
                      │   - matches (avec sources officielles)     │
                      │   - published_stories                       │
                      │   - story_evidence                          │
                      │   - public_trace_excerpts (safe_to_publish)│
                      │   - comparison_snapshots / *_items          │
                      │   - article_instability_cases (publiées)    │
                      │   - methodology_versions                    │
                      └──────────────────────────────────────────┘
                                       │
                ┌──────────────────────┴────────────────────────┐
                ▼                                                ▼
   ┌─────────────────────────────┐               ┌─────────────────────────────┐
   │   API PUBLIQUE (lecture)     │               │   DESK PRIVÉ (futur P5)      │
   │   - GET /api/public/home     │               │   - candidats                │
   │   - /stories, /matches,      │               │   - IA assistante            │
   │     /entities, /explorer,    │               │   - revue éditoriale         │
   │     /observatory, /search    │               │   - publication              │
   │   - réponses dérivées de     │               │   - corrections              │
   │     vues / RLS               │               │   - auth dédiée              │
   └─────────────────────────────┘               └─────────────────────────────┘
                │
                ▼
   ┌─────────────────────────────────────────────────────────┐
   │   FRONTEND PUBLIC V2 (Vite + React 19 + TS + Tailwind 4) │
   │   - 10 pages, react-router-dom BrowserRouter             │
   │   - PublicDataProvider : DemoPublicDataProvider          │
   │                       ↔ LivePublicDataProvider           │
   │   - mode = "demo" | "live" via env / runtime flag        │
   │   - badges démo lorsque pertinent                        │
   │   - aucune écriture, aucune clé de service               │
   └─────────────────────────────────────────────────────────┘

   ┌─────────────────────────────┐
   │ SOURCES SPORTIVES VÉRIFIÉES │   ── à brancher en P6,
   │ (calendrier, scores, events)│      jamais via Wikipédia
   └─────────────────────────────┘
```

## 3. Stratégie demo/live côté frontend

### 3.1 Provider pattern

Le frontend expose **une seule** abstraction (cf. [[IMPLEMENTATION_PLAN]] Phase 1) :

```ts
// src/data/PublicDataProvider.ts
export interface PublicDataProvider {
  getHomePageData(): Promise<HomePageData>;
  getStories(filters?: StoryFilters): Promise<PublishedStorySummary[]>;
  getStoryBySlug(slug: string): Promise<PublishedStoryDetail | null>;
  getMatches(filters?: MatchFilters): Promise<PublicMatchSummary[]>;
  getMatchBySlug(slug: string): Promise<PublicMatchDetail | null>;
  getEntityBySlug(slug: string): Promise<PublicEntityDetail | null>;
  getExplorerData(filters?: ExplorerFilters): Promise<ExplorerData>;
  getObservatoryTraces(filters?: ObservatoryFilters): Promise<PublicTraceSummary[]>;
  getObservatoryTraceById(id: string): Promise<PublicTraceDetail | null>;
  getMethodologyData(): Promise<MethodologyData>;
  searchPublicContent(query: string, filters?: PublicSearchFilters): Promise<PublicSearchResult[]>;
}
```

### 3.2 Implémentations

```
DemoPublicDataProvider  ← alimentée par src/mock*Data.ts (existant)
LivePublicDataProvider  ← alimentée par fetch('/api/public/...') (Phase 2+)
```

### 3.3 Activation

```ts
// src/data/index.ts (Phase 1)
const MODE: PublicDataMode = (import.meta.env.VITE_DATA_MODE ?? 'demo') as PublicDataMode;
export const dataProvider: PublicDataProvider =
  MODE === 'live' ? new LivePublicDataProvider() : new DemoPublicDataProvider();
```

### 3.4 Consommation côté pages

Migration minimale (cf. [[IMPLEMENTATION_PLAN]] Phase 1) :

```ts
// Avant (V2 actuelle)
import { demoEntity, ... } from "../mockEntityData";

// Après
import { dataProvider } from "../data";
const entity = use(dataProvider.getEntityBySlug(slug)); // ou hook usePublicData()
```

Empty states honnêtes obligatoires en mode `live`. Aucune fixture ne doit fuiter dans `LivePublicDataProvider`.

## 4. Architecture backend

### 4.1 Hypothèses retenues, à valider

- **PostgreSQL via Supabase** (cohérent avec le legacy, gratuit en Phase 0, RLS natif, edge functions pour l'API publique éventuellement).
- **Node 20+ TypeScript** pour worker (cohérent avec le legacy).
- **API publique** : deux options à arbitrer en Phase 2.
  - **(a)** PostgREST / Supabase auto-generated APIs sous RLS strict.
  - **(b)** Couche API HTTP minimale (Edge Functions Supabase, Cloud Run, ou Express) qui appelle Postgres en service-role et applique les contrats.
- **Hébergement worker** : Railway/Render/Cloud Run avec healthcheck (existe déjà côté legacy).
- **Hébergement frontend** : Vercel ou hôte statique (le build Vite produit une SPA), avec rewrite SPA pour `react-router-dom` BrowserRouter.

### 4.2 Pourquoi cette stack

| Choix | Motivation | Alternative écartée |
| ----- | ---------- | ------------------- |
| Vite + React 19 | Stack du frontend AI Studio reçu. Préserver la DA. | Next.js 15 — ce serait un re-port complet du V2 vers RSC ; non justifié en Phase 0. |
| `react-router-dom` BrowserRouter | Déjà en place dans `App.tsx`. SPA simple, cache CDN possible. | Migration vers framework full-stack — coût élevé sans valeur Phase 1. |
| Supabase Postgres | Continuité legacy, RLS native, niveau gratuit suffisant pour Phase 2. | Postgres managé "nu" (Neon, RDS) — viable mais perd la RLS clé en main et l'auth pour le Desk. |
| Worker Node TS | Continuité avec [src/ingest.ts](../../src/ingest.ts) — code déjà fiable. | Réécriture Python/Rust — pas justifié, courbe d'apprentissage et perte des tests existants. |

### 4.3 Stratégie API publique en lecture seule

Voir [[PUBLIC_API_PROPOSAL]]. Principes :
- Réponses **dérivées** de tables filtrées par `publication_status='published'` ou via vues SQL.
- Réponses **toujours sans** : candidats, diffs bruts, sorties IA, identité contributeur, IP, scores internes.
- **Cache** agressif sur les pages éditoriales (`/`, `/stories`, `/story/:slug`, `/matches`, `/match/:slug`, `/entity/:slug`, `/methodology`).
- **Pagination** + filtres côté serveur sur `/observatory`, `/stories`, `/matches`, `/explorer`.
- **Pas de polling** depuis le navigateur. Le mode "temps réel" public est volontairement abandonné.

## 5. Desk privé (futur, Phase 5)

Séparé du frontend public. Probablement une route `/desk/*` protégée par auth (Supabase Auth) ou une application séparée. Aucune dépendance partagée avec le code public au-delà des types (`src/types.ts` étendu côté desk).

Fonctions :
- liste des `story_candidates` à examiner ;
- vue d'un candidat avec `trace_private_content` complet, suggestions IA (`ai_analysis_runs`) ;
- workflow d'`editorial_review` (approve / reject / convert_to_story) ;
- édition `comparison_snapshots`, `article_instability_cases` ;
- gestion des corrections (`story_corrections`).

L'IA d'`interpret.ts` du legacy peut renaître **ici, isolée** (cf. [[LEGACY_SALVAGE_AUDIT]] §9).

## 6. Worker d'ingestion (refactor du legacy)

Hérite directement de [src/ingest.ts](../../src/ingest.ts) du legacy. Modifications V2 :

| Aspect | Comportement V2 |
| ------ | --------------- |
| Source | Wikimedia EventStreams (inchangé) |
| Index entités | `wiki_articles` (table V2) au lieu de `entity_sitelinks` (legacy) |
| Filtres | `preFilter` + `safeUser` (inchangés, masquage IP et Temporary Account ID) |
| Stockage | Table `revision_traces` (V2) à la place de `edits` (legacy) |
| Contenu brut | Insert SÉPARÉ dans `trace_private_content` (lookup `trace_id`) — privé strict |
| Pas d'extraction publique au stade ingestion | `public_trace_excerpts` n'est jamais créé automatiquement |
| Scoring | **AUCUN** — pas de `signal_*`, pas de `score`, pas de promotion auto |
| IA | **AUCUN** appel au stade ingestion. L'IA vit dans le Desk privé |
| Checkpoint | `ingest_checkpoints` (V2) — toujours après upsert confirmé |
| Erreurs | `ingest_failures` (V2) — au lieu d'un simple compteur stat |
| Healthcheck | Conservé |

## 7. Données sportives officielles (Phase 6)

Branchement séparé, jamais via Wikipédia, jamais comme vérité par défaut.

- Source à choisir : SportRadar, OpenLigaDB, FIFA officielle, ou import manuel par le Desk.
- Champ `matches.official_source_name` + `official_source_url` + `source_verified_at` documente la provenance.
- En mode `live`, **aucun score ou horaire** n'est rendu sans `source_verified_at` non null.

## 8. Sécurité, RLS, secrets

Voir [[SECURITY_PRIVACY_RULES]] pour le détail. Résumé :

- Frontend public : aucune clé de service, aucun token écriture, aucune lecture sur tables privées.
- Worker : service-role Supabase uniquement côté serveur, jamais commit.
- Desk : auth Supabase + RLS par rôle.
- Diffs bruts : `trace_private_content` en RLS deny-all-public.
- Extraits publics : `public_trace_excerpts` lisibles publiquement **seulement si** `safe_to_publish=true`.
- User-Agent Wikimedia : email de contact réel et maintenu, conformément à la politique Wikimedia.

## 9. Déploiement recommandé

| Composant | Cible recommandée | Variables d'env requises |
| --------- | ----------------- | ------------------------ |
| Frontend V2 (Vite SPA) | Vercel (gratuit Pro), CDN devant | `VITE_DATA_MODE` (`demo`/`live`), `VITE_PUBLIC_API_BASE` |
| API publique | Supabase Edge Functions **ou** Vercel Functions (TS) | clé Supabase **anon** ou service-role côté Function |
| Base Postgres | Supabase project dédié V2 (séparé du legacy) | URL + service-role côté worker + auth pour le Desk |
| Worker | Railway / Render Background Worker (legacy déjà documenté pour) | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `WIKIMEDIA_USER_AGENT`, `LOG_LEVEL` |
| Desk privé (P5) | Sous-domaine séparé + auth Supabase | TBD |

## 10. Risques d'architecture identifiés

| Risque | Mitigation |
| ------ | ---------- |
| Fuite de fixtures en mode `live` | `LivePublicDataProvider` doit lever en cas de fallback sur mock. Tests d'intégration côté CI. |
| Service-role Supabase exposée côté frontend | Variable d'env distincte (`SUPABASE_SERVICE_KEY` jamais préfixée `VITE_`). Audit `.env*` + revue PR. |
| Diff brut affiché publiquement par accident | `public_trace_excerpts` est la **seule** source des extraits publics. RLS deny par défaut sur `trace_private_content`. Pipeline `safe_to_publish` documenté. |
| Score / classement contributeur réintroduit naïvement | Revue PR + `eslint` rule custom optionnelle interdisant l'usage de termes (`drama`, `war`, `burst`, `score`) côté frontend public. |
| Bundle JS > 500 kB | Code splitting `React.lazy` par route avant Phase 6. |
| Rate-limit Wikimedia | User-Agent respectueux, watchdog/backoff existants, monitoring `ingest_failures`. |
