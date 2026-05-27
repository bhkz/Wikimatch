# RUNBOOK — Passage en mode live

État au 2026-05-27 après livraison des 4 jalons correctifs (cf. [[CORRECTIVE_AUDIT_2026-05-27]]).

> [!WARNING]
> **RÈGLE DE SÉCURITÉ CRITIQUE :** Ne jamais commiter ou exposer de token d'administration (`ADMIN_TOKEN`) ou de secret en clair dans le dépôt Git.
> Tout secret ayant été exposé publiquement (comme dans les versions précédentes de ce runbook) doit être considéré comme **compromis** et immédiatement **révoqué** et **remplacé** sur les environnements de production et de staging (Vercel, Render).
> Rappel : la suppression d'un fichier ou d'une ligne sensible dans un nouveau commit ne nettoie pas l'historique Git public. En cas d'exposition historique, il est obligatoire de faire une rotation immédiate du secret concerné.

Ce runbook est divisé en deux blocs :

- **§A — Actions que je (Claude) ne peux pas faire** : je les liste précisément ; à toi de les exécuter.
- **§B — Diagnostic une fois live** : checks à passer après ouverture du mode live.

---

## §A — Actions à exécuter par toi

### A.1 — Appliquer les 3 migrations dans Supabase prod (≈3 min)

1. Va dans https://app.supabase.com → ton projet V2 → **SQL Editor**.
2. Pour chacun des 3 fichiers ci-dessous (dans l'**ordre**), ouvre-le, copie tout le contenu, colle dans l'éditeur, clique **Run** :

   1. [`supabase/migrations/202605260001_v2_core_schema.sql`](../../supabase/migrations/202605260001_v2_core_schema.sql)
   2. [`supabase/migrations/202605260002_public_page_snapshots.sql`](../../supabase/migrations/202605260002_public_page_snapshots.sql)
   3. [`supabase/migrations/202605270001_propositions_patterns_retract.sql`](../../supabase/migrations/202605270001_propositions_patterns_retract.sql) ← **livré au Jalon B+D**

3. Vérifie dans **Table Editor** que tu vois bien :
   - `entities`, `wiki_articles`, `matches`, `match_watchlist`
   - `revision_traces`, `trace_private_content`, `public_trace_excerpts`
   - `published_stories`, `story_evidence`, `story_corrections`
   - **`trace_propositions`** (nouvelle)
   - **`detected_patterns`** (nouvelle)
   - **`admin_retract_log`** (nouvelle)
   - `ai_analysis_runs`, `editorial_reviews`, `ingest_checkpoints`, `ingest_failures`
   - `methodology_versions`, `comparison_snapshots`, `comparison_snapshot_items`
   - `article_instability_cases`, `article_instability_evidence`
   - `public_page_snapshots`

   Et dans **Database → Functions/Policies** que les policies `public_read_published_stories`, `public_read_safe_trace_excerpts`, `public_read_published_methodology` existent.

### A.2 — Seeder la watchlist (≈2 min)

Le seed live initial couvre **16 entités** (1 tournoi + 7 équipes + 8 joueurs) et **~50 articles Wikipédia** en 5 langues. C'est volontairement modéré pour ne pas saturer le pipeline au démarrage.

Localement, avec `SUPABASE_URL` et `SUPABASE_SERVICE_KEY` posés dans `.env.local` :

```powershell
npm run seed:watchlist -- --live
```

Tu devrais voir :

```
[seed:watchlist] loading worker/seeds/wc26-watchlist.live.json
[seed:watchlist] ✅ 16 entities upserted
[seed:watchlist] ✅ 50 monitored wiki articles upserted
```

Le seed est **idempotent** : tu peux le relancer sans risque pour ajouter des articles supplémentaires plus tard.

### A.3 — Configurer les variables d'env Vercel (≈5 min)

Va dans https://vercel.com → ton projet → **Settings → Environment Variables**.

Ajoute (en `Production`, `Preview` et `Development`) :

| Clé | Valeur | Notes |
| --- | ------ | ----- |
| `SUPABASE_URL` | `https://<projet>.supabase.co` | Depuis Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role) | **Server-side uniquement**, jamais préfixé `VITE_` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (anon) | Côté frontend OK |
| `VITE_DATA_MODE` | `live` | Le frontend appelle l'API Vercel |
| `VITE_PUBLIC_API_BASE` | (vide) | Same-origin → `/api/public/v1` |
| `ADMIN_TOKEN` | `<GENERATE_A_NEW_RANDOM_ADMIN_TOKEN>` | **Token à générer de manière aléatoire (32+ caractères)** |

> **ADMIN_TOKEN suggéré** : Générer un jeton aléatoire sécurisé et le stocker uniquement dans les variables d'environnement.
>
> Tu peux générer un token fort localement (ex. en PowerShell) : `[Convert]::ToBase64String((1..24 | %{ Get-Random -Max 256 }))`.

Garde ce token de côté : il sert à appeler `POST /api/admin/retract`.

### A.4 — Configurer le service Render unique (≈5 min)

Un seul service Render (`revision90`) lance les 3 jobs dans le même process Node via [runtime/src/index.ts](../../runtime/src/index.ts) — chaque job tourne en sous-process tsx, mais Render ne voit qu'un service. Le `render.yaml` à la racine est le blueprint.

**Variables à poser dans Render → Settings → Environment :**

| Catégorie | Variable | Valeur |
| --------- | -------- | ------ |
| Supabase | `SUPABASE_URL` | `https://<projet>.supabase.co` |
| Supabase | `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role) |
| Worker SSE | `WIKIMEDIA_USER_AGENT` | `WikiMatch/2.0 (<CONTACT_EMAIL_OR_PROJECT_URL>) Node` |
| Worker SSE | `WORKER_DRY_RUN` | `true` ← bascule en `false` après vérif |
| Worker SSE | `WORKER_FETCH_DIFF` | `true` |
| Analyzer | `OPENAI_API_KEY` | `sk-...` |
| Analyzer | `GEMINI_API_KEY` | `AIza...` |
| Analyzer | `AI_DAILY_EUR_CAP` | `6.50` |
| Analyzer | `ANALYZER_DRY_RUN` | `true` ← bascule en `false` après le worker |
| Analyzer | `ANALYZER_POLL_INTERVAL_MS` | `10000` |
| Analyzer | `ANALYZER_BATCH_SIZE` | `5` |
| Patterns | `PATTERNS_DRY_RUN` | `true` ← bascule en `false` en dernier |
| Patterns | `PATTERNS_POLL_INTERVAL_MS` | `30000` |
| Patterns | `AUTO_PUBLICATION_ENABLED` | `false` ← **Verrou absolu** (opt-in requis pour publier) |
| Commun | `LOG_LEVEL` | `info` |

> [!NOTE]
> **RÈGLE SUR `WIKIMEDIA_USER_AGENT` :** La variable `WIKIMEDIA_USER_AGENT` doit obligatoirement être configurée avec un moyen de contact valide (email ou URL de projet) dans l'environnement Render pour respecter les règles d'accès de l'API Wikimedia, mais aucune adresse email personnelle réelle ne doit être commise dans ce dépôt public.

**Vars à supprimer si présentes** (leftover) :
- `AI_DAILY_USD_CAP` (n'existe nulle part dans le code)

**Start command Render** : `npm start` (déjà déclaré dans `render.yaml`). Si ton service existant a une vieille `startCommand` du type `npm run worker:start`, change-la en `npm start`.

**Optionnel — désactiver un job** : ajoute `RUNTIME_RUN_WORKER=false`, `RUNTIME_RUN_ANALYZER=false` ou `RUNTIME_RUN_PATTERNS=false` selon ce que tu veux couper temporairement.

### A.5 — Déployer (≈5 min)

#### Vercel

- Si tu as déjà connecté le repo : push automatique a déclenché un build. Vérifie dans **Deployments**.
- Sinon : **New Project → Import Git Repository → `bhkz/Wikimatch`** → Framework `Vite`. Build command défaut = `vite build`. Output `dist`. Add env vars de §A.3.

#### Render

- Si tu as déjà connecté le repo : **Blueprint Sync** dans le dashboard Render relit `render.yaml`.
- Sinon : **New → Blueprint → Connect repo `bhkz/Wikimatch`**. Render lit `render.yaml` et te demande de remplir les variables `sync: false`.

### A.6 — Protocoles de Répétition Générale et Verrou de Publication

Pour valider le dispositif WikiMatch en conditions réelles (notamment lors du match de test **PSG — Arsenal** le 30 mai), tu as le choix entre deux protocoles de répétition. Le second est **fortement recommandé** pour pouvoir analyser les données recueillies.

#### Protocole 1 : Test technique court sans persistance (Optionnel)
Ce protocole ultra-conservateur sert uniquement à vérifier que les services démarrent, se connectent correctement à Supabase et reçoivent le flux Wikimedia global, sans rien enregistrer en base de données.
* `WORKER_DRY_RUN=true` → Le worker écoute et filtre le flux SSE, mais n'écrit rien en base.
* `ANALYZER_DRY_RUN=true` → L'analyzer simule l'extraction sans insérer de proposition.
* `PATTERNS_DRY_RUN=true` → Le pattern matcher simule la détection et logue les candidats.
* `AUTO_PUBLICATION_ENABLED=false` → Verrou de sécurité absolu.

#### Protocole 2 : Répétition générale réelle sur PSG — Arsenal (Recommandé)
Ce mode est le plus riche pour la préparation. Il permet de collecter les vraies modifications Wikipédia et de voir précisément ce que le pipeline IA aurait publié, sans que rien n'apparaisse publiquement sur ton site Vercel.
* `WORKER_DRY_RUN=false` → **Le worker écrit les traces réelles** de la watchlist dans `revision_traces` et `trace_private_content`.
* `ANALYZER_DRY_RUN=false` → **L'analyzer écrit les propositions réelles** de modifications dans `trace_propositions` et `ai_analysis_runs`.
* `PATTERNS_DRY_RUN=true` → **Le pattern matcher tourne en mode simulation (Dry-Run)**. Il examine les propositions réelles et logue en détails les résultats :
  `[publisher] DRY_RUN — pattern=article_instability safety=OK title="..."`
  Cela te permet d'inspecter les titres générés, les extraits de sources et la qualité rédactionnelle directement dans les logs de Render.
* `AUTO_PUBLICATION_ENABLED=false` → **Verrou de sécurité absolu.** Même si une erreur de manipulation passait `PATTERNS_DRY_RUN` à `false` sur Render, le verrou de sécurité intercepterait la publication automatique et bloquerait toute insertion en DB de story publique, renvoyant un statut `PUBLICATION DISABLED`.

---

### A.7 — Analyse Post-Match et Bascule Live Progressive

#### Étape 1 : Phase d'observation active (Pendant le match)
Configure tes variables Render selon le **Protocole 2 (Recommandé)** ci-dessus. Laisse le système tourner de manière autonome avant, pendant et après le match PSG — Arsenal.

#### Étape 2 : Analyse post-match (Après le match)
1. Va dans ton éditeur SQL Supabase et examine les traces et les propositions réelles recueillies pour voir la réactivité du worker.
2. Ouvre les logs Render du service `wikimatch-patterns` et recherche les lignes préfixées par `[publisher] DRY_RUN`.
3. Analyse les candidats détectés : Est-ce qu'il y a eu des faux positifs ? Les titres et observations étaient-ils fidèles à la réalité ? La safety a-t-elle bloqué des candidats suspects ?

#### Étape 3 : Bascule progressive vers le Live Public
Une fois que tu as validé manuellement la pertinence des logs observés pendant le match de test :

1. `PATTERNS_DRY_RUN=false` → Le pattern matcher est autorisé à s'exécuter normalement. *Note : Tant que `AUTO_PUBLICATION_ENABLED` reste à `false`, la publication automatique publique reste verrouillée et produit des logs `PUBLICATION DISABLED`.*
2. Une future phase intermédiaire de prépublication contrôlée peut ainsi être menée en examinant les logs sans impact sur le site public.

> [!IMPORTANT]
> **CRITÈRE D'ACTIVATION DU MODE LIVE PUBLIC (`AUTO_PUBLICATION_ENABLED=true`) :**
> N'active `AUTO_PUBLICATION_ENABLED=true` dans l'environnement de Render qu'après avoir validé la répétition générale réelle et confirmé la parfaite qualité rédactionnelle et l'absence de faux positifs. Une fois activée, toute story détectée s'affichera instantanément sur ta page d'accueil Vercel publique.

À cette étape, ouvre ton URL Vercel : la home affichera la première story réelle dès qu'un pattern passera.

---

En attendant qu'une story passe :

- Sur Vercel, ouvre `/` → tu dois voir le hero **"Aucune histoire publiée pour l'instant"** (introduit au Jalon A, cf. `src/pages/Home.tsx → HomeNoStoriesHero`).
- `/stories` → grille vide, pas de featured.
- `/observatoire` → traces vides, pas de source chain (le `featuredSourceChain` hardcodé a été retiré).
- `/match/anything` → 404 honnête (plus de fallback snapshot).

Si tu vois encore le contenu fictif **France — Belgique** ou **Ren Ito** affiché comme `isDemo: false` : c'est que `VITE_DATA_MODE` n'est pas posé à `live` sur Vercel, ou que le déploiement n'a pas pris la dernière version. Force un redeploy.

### A.9 — Tester le kill switch (1 min)

Une fois qu'une story est publiée automatiquement :

```bash
curl -X POST https://<ton-domaine-vercel>/api/admin/retract \
  -H "Authorization: Bearer <ADMIN_TOKEN_FROM_VERCEL_ENV>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_table": "published_stories",
    "target_id": "<uuid de la story>",
    "reason": "test du kill switch"
  }'
```

Vérifie ensuite dans Supabase :
- `published_stories.publication_status` = `'retracted'`
- `published_stories.retracted_at` ≠ null
- `admin_retract_log` contient une row avec le `sha256(token)` (jamais le token brut)

La story disparaît du frontend (la vue `v_public_stories` filtre `retracted_at is null`).

---

## §B — Diagnostic une fois live

### B.1 — Métriques à surveiller (Supabase SQL Editor)

```sql
-- Traces collectées dans les dernières 24h
select count(*) as traces_24h
from revision_traces
where observed_at >= now() - interval '24 hours';

-- Propositions extraites par type, dernières 24h
select proposition_type, count(*), avg(extraction_confidence)::numeric(3,2) as avg_conf
from trace_propositions
where created_at >= now() - interval '24 hours'
group by proposition_type
order by 2 desc;

-- Coût IA cumulé aujourd'hui (UTC)
select coalesce(sum(estimated_cost_eur), 0) as eur_today
from ai_analysis_runs
where created_at >= date_trunc('day', now() at time zone 'utc');

-- Patterns détectés et leur résultat safety, dernières 24h
select pattern_type,
       count(*) filter (where safety_checks_passed) as published,
       count(*) filter (where not safety_checks_passed) as blocked,
       count(*) filter (where retracted_at is not null) as retracted
from detected_patterns
where detected_at >= now() - interval '24 hours'
group by pattern_type;

-- Stories publiées non rétractées
select slug, story_type, title, published_at, published_by_pipeline
from published_stories
where publication_status in ('published', 'corrected')
  and retracted_at is null
order by published_at desc
limit 20;
```

### B.2 — Si rien ne sort du pipeline après 24h

Causes possibles dans l'ordre :

1. **Watchlist trop étroite** : `wiki_articles` ne couvre pas les articles édités → relancer `seed:watchlist --live` ou ajouter des entités.
2. **Worker en DRY_RUN** : vérifier `WORKER_DRY_RUN=false` sur Render.
3. **Trace fetched mais analyzer ne tourne pas** : vérifier logs Render `wikimatch-analyzer`, et que `OPENAI_API_KEY` / `GEMINI_API_KEY` sont posés.
4. **Toutes les propositions sont `noise`** : c'est probablement correct — la majorité des edits Wikipédia sont du formatage. Élargir la watchlist à des sujets plus actifs.
5. **Tous les patterns sont `blocked_safety`** : regarder `detected_patterns.safety_blocked_reason`. Si `forbidden_vocabulary` ou `national_tension` reviennent souvent, c'est que les templates produisent trop de copy qui ne passe pas — à ajuster.

### B.3 — Si le coût IA explose

Le cap journalier `AI_DAILY_EUR_CAP=6.50` arrête l'IA dès qu'il est atteint, le analyzer retombe en regex gratuit jusqu'au lendemain.

Si tu veux **réduire le coût immédiatement** :
- Baisser `AI_DAILY_EUR_CAP` à `2.00` ou moins dans Render.
- Augmenter `ANALYZER_POLL_INTERVAL_MS` à `30000` ou `60000` (moins de polling = moins d'appels).
- Réduire `ANALYZER_BATCH_SIZE` à `2`.

### B.4 — Si une story problématique passe

Retracter immédiatement via `POST /api/admin/retract` (cf. §A.9). La story disparaît du frontend en < 60s (cache CDN).

Si le même pattern revient : ouvrir `patterns/src/safety.ts` et étendre la liste appropriée (`VANDALISM_KEYWORDS`, `FORBIDDEN_VOCAB`, `FORBIDDEN_NATIONAL_TENSION`, `FORBIDDEN_CAUSAL_PATTERNS`).

---

## §C — Ce que je peux faire dans un prochain tour si tu veux

- **Étendre les patterns** : `language_divergence` et `match_recap` (pas encore implémentés au Jalon C).
- **Lib `bad-words` propre** : remplacer la liste minimale de `safety.ts` par une lib multilingue (`leo-profanity` + dictionnaires régionaux).
- **Source sportive officielle** : ajout d'un connecteur (OpenLigaDB, FIFA, ou autre) pour `matches.official_source_*` afin que les scores réels puissent apparaître.
- **Dashboard admin minimal** : page React derrière le bearer token qui liste les 50 dernières stories avec bouton retract en un clic.
- **Index full-text Postgres** : `tsvector` + GIN sur `published_stories.title/excerpt/observation_text` pour que `/api/public/v1/search` soit performant à grande échelle.
- **Méthodologie versionnée** : seeder `methodology_versions` v0.3-auto avec le contenu actuel des règles produit, et exposer via `/api/public/v1/methodology`.
- **Tests** : socle Vitest + tests unitaires sur `patterns/src/safety.ts` (PII, vocab interdit, causalité) et `patterns/src/templates.ts` (snapshot test des outputs).
- **CI GitHub Actions** : workflow `npm run lint` + `npm run build` sur chaque PR.

---

## §D — Récap "tout en un coup"

| Étape | Qui | Durée | Notes |
| ----- | --- | ----- | ----- |
| Appliquer 3 migrations SQL | **toi** sur Supabase | 3 min | §A.1 |
| Seed watchlist live | **toi** local | 2 min | §A.2 |
| Vars Vercel | **toi** sur Vercel | 5 min | §A.3 — ADMIN_TOKEN fourni |
| Vars Render × 3 services | **toi** sur Render | 10 min | §A.4 |
| Premier déploiement | **toi** Vercel + Render | 5 min | §A.5 |
| 24-48h dry run + diagnostic | **toi** | 1-2 j | §A.6 |
| Bascule live en 3 étapes | **toi** | 6-12h | §A.7 |
| Vérif frontend empty states | **toi** | 1 min | §A.8 |
| Test kill switch | **toi** curl | 1 min | §A.9 |

Tu peux me dire "go" quand tu veux que j'attaque les extensions de §C.
