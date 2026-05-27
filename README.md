# WikiMatch

WikiMatch est un observatoire expérimental qui suit des modifications d’articles Wikipédia liées à des matchs de football afin d’identifier des traces documentaires vérifiables, sans confondre édition linguistique, opinion publique et récit national.

## État du projet

Le projet est actuellement en phase de préparation et de validation en direct (live) en amont de la Coupe du Monde 2026. Certaines routes, fonctionnalités ou données peuvent encore présenter un caractère expérimental.

## Architecture

- **Frontend :** Single Page Application construite avec React et Vite.
- **API Publique :** Serverless Functions déployées sur Vercel (`/api/public/v1/*`).
- **Ingestion :** Worker SSE écoutant en continu le flux temps réel global de Wikipédia (`Wikimedia EventStreams`).
- **Stockage :** Base de données relationnelle Supabase (PostgreSQL) avec politiques de sécurité RLS (Row Level Security).
- **Pipelines IA & Traitement :** Services autonomes d'analyse (`analyzer`) et de détection de motifs narratives (`pattern matcher`) s'appuyant sur des modèles de langage et des gabarits (templates) stricts et bornés.

## Lancer localement

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## Sécurité

Ne commitez **jamais** de secrets, clés d'API (comme `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) ou tokens d'administration (`ADMIN_TOKEN`) dans le dépôt de code public. Utilisez exclusivement des variables d'environnement (`.env` local, Vercel ou Render).

## Licence / sources

Les données et observations présentées s'appuient sur l'encyclopédie libre Wikipédia et l'écosystème Wikimedia. Toutes les règles d'attribution, de citation et de licence (Creative Commons BY-SA) devront être respectées pour tout extrait ou paragraphe rendu public.
