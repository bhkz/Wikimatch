# DEPLOYMENT_RUNBOOK — Vercel + Supabase + Render

Runbook opérationnel pour remplacer l'ancien projet par WikiMatch V2 sans mélanger le legacy et la nouvelle base.

## 1. GitHub

Décision retenue : utiliser le nouveau dépôt `bhkz/Wikimatch`.

- `bhkz/Revision90` reste l'archive de l'ancien essai.
- `bhkz/Wikimatch` devient la source de vérité V2.
- Ne pas écraser l'ancien dépôt : cela garde un rollback lisible et évite de mélanger les historiques.

État actuel :

```bash
git remote -v
# origin  https://github.com/bhkz/Wikimatch.git
git branch --show-current
# main
```

## 2. Vercel

Objectif : garder le même projet Vercel si possible, mais remplacer le repo connecté.

Étapes :

1. Dans Vercel, ouvrir le projet existant.
2. Settings → Git → Connected Git Repository.
3. Déconnecter l'ancien repo si nécessaire.
4. Connecter `bhkz/Wikimatch`, branche `main`.
5. Framework preset : `Vite`.
6. Build command : `npm run build`.
7. Output directory : `dist`.
8. Ajouter les variables :

```bash
VITE_DATA_MODE=demo
VITE_PUBLIC_API_BASE=
```

Quand Supabase est prêt :

```bash
VITE_DATA_MODE=live
VITE_PUBLIC_API_BASE=
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

`SUPABASE_SERVICE_KEY` est uniquement pour les Vercel Functions. Ne jamais créer de variable `VITE_SUPABASE_SERVICE_KEY`.

Le fichier `vercel.json` contient déjà :

- rewrite SPA vers `/index.html` ;
- exclusion de `/api/*` ;
- headers sécurité ;
- cache long sur les assets.

## 3. Supabase

Meilleure option : garder le même projet Supabase seulement s'il n'a plus de données utiles.

Option recommandée :

1. Faire un backup SQL depuis Supabase avant toute suppression.
2. Créer un projet Supabase V2 dédié si le projet actuel contient encore des données utiles.
3. Si tu veux vraiment garder le même projet : reset le schéma uniquement après backup.
4. Appliquer les migrations dans l'ordre :

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Migrations actuelles :

- `202605260001_v2_core_schema.sql`
- `202605260002_public_page_snapshots.sql`

Seed initial :

```bash
npm run seed:snapshots
```

Variables locales nécessaires :

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

Ce seed publie les 10 contrats de pages V2 dans `public_page_snapshots`. Il ne branche pas encore Wikimedia.

### Erreur `column "wikidata_qid" does not exist`

Cette erreur signifie que le projet Supabase n'est pas vide et contient déjà
une ancienne table `public.entities`. Comme la migration utilise
`create table if not exists`, Postgres garde l'ancienne table au lieu de créer
la table V2.

Correction recommandée sur un projet dédié V2 ou après backup :

1. Ouvrir `supabase/RESET_PUBLIC_SCHEMA_FOR_V2.sql`.
2. L'exécuter dans Supabase SQL Editor.
3. Relancer ensuite, dans l'ordre :
   - `202605260001_v2_core_schema.sql`
   - `202605260002_public_page_snapshots.sql`
4. Lancer `npm run seed:snapshots`.

## 4. Render

Le worker V2 existe maintenant dans `worker/`.

Avant de connecter Render :

```bash
npm run seed:watchlist
```

Puis tester localement en dry-run :

```bash
npm run worker:dev
```

Render peut ensuite être connecté à `bhkz/Wikimatch` comme Background Worker.

Configuration :

```bash
Build Command: npm install
Start Command: npm run worker:start
```

Variables Render :

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
WIKIMEDIA_USER_AGENT=WikiMatch/2.0 (<contact>) Node
WORKER_DRY_RUN=true
WORKER_FETCH_DIFF=true
LOG_LEVEL=info
```

Passer `WORKER_DRY_RUN=false` seulement après lecture des premiers logs.

## 5. Ordre Exact

1. GitHub : utiliser `bhkz/Wikimatch`.
2. Vercel : connecter `bhkz/Wikimatch`, rester en `VITE_DATA_MODE=demo`.
3. Supabase : backup, migrations, seed snapshots.
4. Vercel : passer `VITE_DATA_MODE=live` + ajouter `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`.
5. Smoke test public : `/`, `/stories`, `/story/demo-divergence`, `/matches`, `/match/demo-france-belgique`, `/entity/demo-japan-goalkeeper`, `/explorer`, `/observatoire`, `/methodology`, `/search`.
6. Render : connecter le Background Worker en `WORKER_DRY_RUN=true`, puis passer à `false` après validation des logs.

## 6. Ce Qu'il Ne Faut Pas Faire

- Ne pas supprimer le projet Supabase sans backup.
- Ne pas mettre `SUPABASE_SERVICE_KEY` dans une variable `VITE_*`.
- Ne pas passer Render en `WORKER_DRY_RUN=false` avant d'avoir seedé `wiki_articles` et inspecté les logs.
- Ne pas écraser `bhkz/Revision90`.
- Ne pas connecter le mode live Vercel avant d'avoir appliqué les migrations et seedé `public_page_snapshots`.
