# IMPLEMENTATION_PLAN — V2

Plan par phases. Chaque phase a un périmètre, une définition de terminé (DoD), des risques et des tests.

## État global au 2026-05-27

| Phase | Statut | Lien |
| ----- | ------ | ---- |
| Phase 0 — Audit V2 + legacy + docs | ✅ Livré | §Phase 0 |
| Phase 1 — Data layer demo/live | ✅ Livré | §Phase 1 |
| Phase 2 — Backend public + Supabase schema | ✅ Schéma livré ; endpoints API en place et purgés du fallback démo (cf. [[CORRECTIVE_AUDIT_2026-05-27]]) | §Phase 2 |
| Phase 3 — Worker ingestion Wikimedia | ✅ Livré (worker fait collecte uniquement après corrective Jalon A) | §Phase 3 |
| **Corrective Audit 2026-05-27** | ✅ Livré (4 jalons A→D) | [[CORRECTIVE_AUDIT_2026-05-27]] |
| Phase 4 — Observatoire sur données contrôlées | 🟡 Dépend de la prod du pipeline auto contraint | §Phase 4 |
| Phase 5 — Desk privé (modèle initial) | ❌ Remplacé par "automatique contraint" + kill switch admin (Corrective Jalon D) | — |
| Phase 6 — Données réelles & lancement | 🟡 Reste à câbler les données sportives officielles | §Phase 6 |

## Phase 0 — Audit (CETTE PHASE, en cours / livré)

**Périmètre :**
- Audit du frontend V2 ([[FRONTEND_AUDIT]]).
- Audit lecture seule du legacy ([[LEGACY_SALVAGE_AUDIT]]).
- Documents `docs/v2/*.md` (8 fichiers).
- Pas d'intégration backend, pas de Supabase, pas de Wikimedia connecté, pas de modifications massives de l'UI.

**DoD Phase 0 :**
- [x] `docs/v2/PRODUCT_RULES.md`
- [x] `docs/v2/FRONTEND_AUDIT.md`
- [x] `docs/v2/LEGACY_SALVAGE_AUDIT.md`
- [x] `docs/v2/TARGET_ARCHITECTURE.md`
- [x] `docs/v2/DATA_MODEL_PROPOSAL.md`
- [x] `docs/v2/SECURITY_PRIVACY_RULES.md`
- [x] `docs/v2/PUBLIC_API_PROPOSAL.md`
- [x] `docs/v2/IMPLEMENTATION_PLAN.md`
- [x] Build Vite vérifié (`npm run build` OK).
- [x] Typecheck vérifié (3 erreurs documentées, non bloquantes pour la build).
- [x] Aucune modification dans le legacy.
- [x] Aucune fixture supprimée ou modifiée dans V2.
- [ ] Rapport final livré au PO (cf. §0 ci-dessous "Format du rapport").

**Décisions attendues avant Phase 1** : cf. [[#blocages-et-decisions-attendues]].

---

## Phase 1 — Data layer frontend démo/live

**Objectif** : Introduire `PublicDataProvider` sans modifier la DA. Permettre de basculer `demo` → `live` via flag, même si `live` n'est pas encore alimenté.

**Fichiers concernés :**

| Type | Fichier | Action |
| ---- | ------- | ------ |
| Création | `src/data/PublicDataProvider.ts` | Interface + types provider |
| Création | `src/data/DemoPublicDataProvider.ts` | Implémentation à partir de `src/mock*Data.ts` |
| Création | `src/data/LivePublicDataProvider.ts` | Squelette, lève `NotImplementedError` Phase 1 |
| Création | `src/data/index.ts` | Sélection demo/live via `import.meta.env.VITE_DATA_MODE` |
| Création | `src/data/usePublicData.ts` | Hook React (`Suspense` ou pattern `useEffect`) |
| Modification | `src/pages/*.tsx` | Remplacer les imports `mock*` par `usePublicData(...)` |
| Modification | `src/components/HeroSection.tsx`, `FeaturedStoryCard.tsx`, `StoriesGrid.tsx`, `TrackedMatchPoster.tsx`, `ObservatoryTeaser.tsx` | Découpler de `mockHomeData`, recevoir données via props depuis la page parente |
| Modification | `package.json` devDependencies | Ajouter `@types/react`, `@types/react-dom`, optionnel `vitest` + `@testing-library/react` |
| Modification | `src/types.ts` | Compléter quelques types provider (`HomePageData`, `PublishedStorySummary`, etc.) déjà majoritairement présents |
| Création | `.env.example` (V2) | Ajouter `VITE_DATA_MODE=demo` |
| Création | `vitest.config.ts` (si tests introduits) | Configuration minimale |

**Stratégie de refactor :**
1. Créer `src/data/` sans toucher aux pages.
2. Migrer page par page (Home → StoryDetail → MatchDetail → etc.), commiter chaque migration séparément.
3. Découpler les 6 composants partagés à `mockHomeData` (inversion de la dépendance).
4. Vérifier `npm run build` à chaque commit.
5. Réparer les 3 erreurs `tsc --noEmit` ([[FRONTEND_AUDIT]] §6).

**Risques :**
- Régression DA si un composant casse en recevant des props au lieu d'importer la fixture → snapshot manuel des pages avant/après.
- Bundle qui grossit si `DemoPublicDataProvider` charge toutes les fixtures à l'init → `import()` dynamiques par page.

**Tests :**
- Typecheck strict passe (`tsc --noEmit` 0 erreur).
- Build Vite passe (`npm run build`).
- Smoke test manuel des 10 routes en mode `demo`.
- Test unitaire minimal `DemoPublicDataProvider.getStoryBySlug('demo-divergence')` retourne la story attendue.

**DoD :** 10 routes navigables, build vert, typecheck vert, mode `demo` 100% fonctionnel, mode `live` câblé mais non alimenté (empty states honnêtes).

**Aucune donnée réelle dans cette phase.** Aucune connexion API.

---

## Phase 2 — Backend public et base de données

**Objectif** : Mettre en place Postgres/Supabase, le schéma V2, RLS, et l'API publique en lecture seule.

**Fichiers / artefacts :**

- Nouveau dépôt ou monorepo `backend/` (à arbitrer en Phase 1).
- Migrations SQL : tables [[DATA_MODEL_PROPOSAL]] §1–§15.
- Vues publiques : `v_public_stories`, `v_public_observatory_traces`, etc. (DATA_MODEL §16).
- Policies RLS : [[SECURITY_PRIVACY_RULES]] §9.
- API publique : Vercel Functions `api/public/v1/*` implémentant [[PUBLIC_API_PROPOSAL]] §1–§8.
- Seed contrôlé : `public_page_snapshots` alimenté par `npm run seed:snapshots` depuis les fixtures existantes, puis remplacé progressivement par les snapshots produits par le Desk.
- Variables d'env : `SUPABASE_URL`, `SUPABASE_ANON_KEY` (frontend), `SUPABASE_SERVICE_KEY` (backend), `VITE_PUBLIC_API_BASE`.

**Stratégie :**
1. Créer un projet Supabase V2 dédié.
2. Appliquer les migrations Supabase dans l'ordre `202605260001_*` puis `202605260002_*`.
3. Activer RLS sur toutes les tables. Ajouter les policies `published`/`safe_to_publish`.
4. Implémenter les endpoints Vercel `/api/public/v1/*` un par un, dans l'ordre de la `PublicDataProvider`.
5. Câbler `LivePublicDataProvider` côté frontend pour chaque endpoint implémenté.
6. Seed initial : `npm run seed:snapshots`, puis smoke test `VITE_DATA_MODE=live`.
7. Tests d'intégration : requêtes anonymes refusées sur tables privées (cf. SECURITY_PRIVACY §9).

**Risques :**
- Mauvaise policy RLS exposant des candidats → tests d'intégration obligatoires AVANT merge.
- Performance des vues full-text → indices GIN + benchmarks.
- Coût Supabase si on dépasse l'offre gratuite → monitoring quotas + alarme.

**Tests :**
- Tests d'intégration RLS (requêtes anonymes vs service-role).
- Tests de contrat API (`zod` côté serveur, validation `zod` côté client).
- Tests de charge légers (~100 req/s sur `/observatory/traces`).

**DoD :** Base V2 vivante, API publique opérationnelle, frontend mode `live` retourne du contenu réel (le seed minimal), parité fonctionnelle avec le mode `demo` sur les 10 routes.

---

## Phase 3 — Worker Wikimedia fiable

**Objectif** : Refactor du worker legacy ([[LEGACY_SALVAGE_AUDIT]] §3) vers le nouveau schéma V2. Aucune story automatique, aucun scoring.

**Fichiers / artefacts :**

- `worker/src/ingest.ts` — refactor de [revision90-worker/src/ingest.ts](../../../revision90-worker/src/ingest.ts), insertion dans `revision_traces` + `trace_private_content`.
- `worker/src/filters.ts`, `worker/src/revert.ts`, `worker/src/wiki-diff.ts`, `worker/src/health-server.ts` — repris **tel quel**.
- `worker/src/state.ts` — refactor vers `ingest_checkpoints` multi-stream.
- `worker/src/index-loader.ts` — refactor vers `wiki_articles` (V2).
- `scripts/seed-db.ts`, `scripts/verify-qids.ts`, `scripts/build-index.ts` — refactor au nouveau schéma.
- `Dockerfile` worker repris du legacy.

**Strictement exclu Phase 3 :**
- `signal.ts` (scoring) — NON repris.
- `interpret.ts` (IA publique) — NON repris.
- `promote.ts` (publication auto) — NON repris.
- Toute migration SQL `phase*-*-score|burst|war|drama` — NON reprise.

**Stratégie :**
1. Copier `ingest.ts` du legacy dans le nouveau dépôt worker.
2. Adapter le type de destination (`EditRow` → `RevisionTrace`), insérer le diff brut dans `trace_private_content` lookup par `trace_id`.
3. Ne pas créer `public_trace_excerpts` automatiquement.
4. Vérifier la conformité User-Agent.
5. Tester en local sur un sous-ensemble de pages.

**Risques :**
- Coût Supabase si volume élevé → batching maintenu, indices `revision_traces (article_id, observed_at desc)`.
- Réintroduction silencieuse de logique de scoring → revue PR + check linter sur termes interdits.
- Perte de données si refactor casse le checkpoint → tests unitaires sur `state.ts` avant déploiement.

**Tests :**
- Test sur SSE simulé (`scripts/decisive-test-sample.ts` adapté).
- Vérification que `ingest_checkpoints.last_confirmed_event_id` n'avance qu'après upsert OK.
- Vérification que `safeUser` masque toujours IP/Temporary Accounts.

**DoD :** Worker tourne en local, stocke des `revision_traces` réelles + `trace_private_content`, aucune story publique n'est créée, le mode `live` reste cohérent avec les empty states.

---

## Phase 4 — Observatoire sur données contrôlées

**Objectif** : Activer `/observatoire` en `live` avec **uniquement** des extraits modérés.

**Fichiers / artefacts :**
- Procédure manuelle Desk-light (en attendant Phase 5) pour produire `public_trace_excerpts` à partir de `revision_traces` sélectionnés.
- Endpoint `/api/public/v1/observatory/traces` ([[PUBLIC_API_PROPOSAL]] §6) consommant `v_public_observatory_traces`.
- UI [src/pages/Observatory.tsx](../../src/pages/Observatory.tsx) consommant `LivePublicDataProvider.getObservatoryTraces()`.
- Filtres + pagination côté serveur.
- Attribution (`source_attribution_label`, `license_label`) visible.

**Risques :**
- Diff brut affiché par erreur → contrainte RLS `safe_to_publish=true` + tests d'intégration.
- Charge sur l'endpoint → cache CDN `s-maxage=60`.

**Tests :**
- Requête `/observatory/traces` avec un `safe_to_publish=false` en base → 0 résultat.
- Requête `/observatory/traces/:id` sur un id privé → 404.

**DoD :** Observatoire affiche des extraits réels, attribués, sous licence, sans diff brut, sans contributeur.

---

## Phase 5 — Desk privé minimal

**Objectif** : Workflow `candidate → review → story`, IA assistante encadrée.

**Fichiers / artefacts :**
- App `desk/` séparée (sous-domaine ou route protégée), auth Supabase.
- UI : liste candidats, détail candidat (diff privé, suggestions IA), action approve/reject.
- Backend : endpoints `/api/desk/*` ([[PUBLIC_API_PROPOSAL]] §12).
- IA isolée : `ai_analysis_runs` populated **uniquement** par actions Desk explicites. Pas d'IA dans le worker.
- L'`interpret.ts` du legacy peut renaître ici, isolé, avec garde-fous (budget EUR, cache, vocabulaire banni).
- **Provider IA confirmé (2026-05-26)** : **OpenAI `gpt-4o-mini`** primaire (réutilise le legacy `interpret.ts` quasi tel quel), **Gemini** en fallback automatique (`@google/genai` déjà dans `package.json`). Cap journalier `AI_DAILY_EUR_CAP=6.5` pour rester sous €200/mois all-in. Comptabilité par provider dans `ai_analysis_runs.metadata`.

**Risques :**
- IA qui publie automatiquement → contrôle d'accès strict : `editorial_reviews.decision='convert_to_story'` est l'unique chemin de publication.
- Coût IA → cap journalier (existant côté legacy, à reprendre).

**Tests :**
- Test d'intégration `convert_to_story` → crée bien `published_stories.publication_status='draft'`.
- Test d'intégration refus → ne crée rien de public.

**DoD :** Desk fonctionnel à 1 utilisateur, capable d'approuver une story et de publier 1 correction.

---

## Phase 6 — Données réelles et lancement

**Objectif** : Brancher Wikimedia en production, brancher une source sportive officielle, tester la charge, publier réellement.

**Fichiers / artefacts :**
- Worker déployé sur Railway/Render avec monitoring.
- Source sportive officielle (à choisir : SportRadar, OpenLigaDB, FIFA, ou import manuel) câblée dans `matches.official_source_*`.
- Test de charge sur `/observatory/traces`, `/search`.
- Monitoring : alerting sur `ingest_failures`, latence p95 API, build frontend.
- Code-splitting frontend (`React.lazy` par route) pour ramener le bundle JS < 250 kB par route.
- Documentation publique de méthodologie publiée et versionnée.
- Procédure de correction publique testée bout-en-bout.

**Risques :**
- Volume Wikimedia non maîtrisé → throttling côté worker, alerting `ingest_failures`.
- Source sportive payante → arbitrage budget en amont.
- Pic de trafic au coup d'envoi WC26 → cache CDN, statique sur magazine, scaling worker.

**Tests :**
- E2E Playwright sur les 10 routes en `live`.
- Charge ~500 req/s sur le magazine.
- Lighthouse score ≥ 90 sur `/`, `/methodology`, `/stories`.

**DoD :** Site public en `live`, première story publiée et corrigible, observabilité opérationnelle.

---

## Blocages et décisions attendues

| # | Sujet | Statut |
| - | ----- | ------ |
| 1 | Initialiser un Git dans le dossier V2 actuel ? (recommandé) | ✅ fait (branche `v2/audit-and-architecture`) |
| 2 | Conserver Supabase comme base V2 ? | ✅ confirmé |
| 3 | API publique : Edge Functions Supabase vs Vercel Functions vs PostgREST ? | ✅ confirmé : Vercel Functions pour l'API publique V2 initiale ; Supabase reste la base/RLS |
| 4 | Conserver le worker legacy (refactor) ou repartir from-scratch ? | ✅ refactor confirmé (cf. [[LEGACY_SALVAGE_AUDIT]] §3) |
| 5 | Source sportive officielle | 🟡 ouvert ; Wikipedia (page WC2026) en bootstrap P3 (cf. [[DATA_MODEL_PROPOSAL]] §4) |
| 6 | Domaine de production / sous-domaine du Desk | 🟡 ouvert P5 |
| 7 | Authentification du Desk | 🟡 reco Supabase Auth email OTP, à confirmer P5 |
| 8 | Provider IA Desk + cap budget | ✅ confirmé : OpenAI `gpt-4o-mini` primaire + Gemini fallback, cap €200/mois (`AI_DAILY_EUR_CAP=6.5`) |
| 9 | Hébergement (frontend, API, worker) | ✅ confirmé : Vercel + Supabase + Render |
| 10 | Code-splitting frontend par route — `React.lazy` (suspense) ? | 🟡 reporté P6 (warning Vite déjà documenté) |
| 11 | Tests : `vitest` + `@testing-library/react` + `playwright` ? | 🟡 ouvert (reco : socle minimal début P2) |
| 12 | Retirer `@google/genai` et `express` du frontend V2 si non utilisés en prod ? | 🟡 **À NE PAS retirer** : `@google/genai` sera utilisé en fallback IA depuis le Desk P5 (cf. décision #8). `express` peut être retiré en P2 si non nécessaire au runtime AI Studio. |

---

## Format du rapport de Phase 0

Voir le prompt §16 dans [prompt.txt](../../prompt.txt) — sections 1 à 12 du rapport final couvertes par le récapitulatif livré en réponse au PO. Documents `docs/v2/*.md` produits selon §13.3 et §14 du prompt.
