# L'Atlas du Mondial

Site spectacle, sans aucun compte utilisateur, qui suit la Coupe du Monde 2026 (11 juin → 19 juillet) sous la forme d'une carte hexagonale mondiale vivante : les vrais résultats des matchs redessinent les frontières. Autour de la carte : moteur de scénarios de qualification (Monte-Carlo), recap de nuit automatique, drama-mètre par match, replay du tournoi et images partageables.

**Source de vérité produit : [`SPEC_ATLAS_MONDIAL_v2.md`](./SPEC_ATLAS_MONDIAL_v2.md). Direction artistique : [`DESIGN.md`](./DESIGN.md) + [`src/design/tokens.ts`](./src/design/tokens.ts).**

## État du projet

Phases P0, P1 et P2 livrées (spec §20) : carte vivante, moteur de conquête déterministe, simulation Monte-Carlo + conditions de qualification, drama-mètre, recap de nuit (6 sections §8), replay/`?t=`, mode live, Grande Fracture (`finalize_group_stage` depuis /admin), memorial, embed, OG dynamiques, `/feed.xml`, `/sitemap.xml`, `/fin`. Reste hors v1 courante : probabilités de parcours KO (`p_champion`) — activables quand l'API révèle les appariements réels du tableau (§21.5 « jamais deviner »). Le concept précédent du repo (observatoire Wikipédia) est abandonné à 100 % ; seules la DA, la toolchain et l'infra (Vercel, Supabase) sont conservées.

## Architecture

- **Frontend :** SPA React + Vite + TypeScript + Tailwind v4 (pas de migration Next.js ; SEO/OG via `api/meta.ts`, spec §14).
- **API publique :** Serverless Functions Vercel (`/api/v1/*`), lecture seule, cache CDN (spec §17).
- **Moteur & jobs :** worker Node (Railway) — polling football-data.org, résolution déterministe des matchs, simulation Monte-Carlo, recap quotidien (spec §16).
- **Stockage :** Supabase (PostgreSQL), schéma `atlas`, lecture publique RLS, écriture service-role uniquement (spec §15).
- **Données :** football-data.org v4 (calendrier + scores) + seeds versionnés dans `data/` (spec §3).

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

Ne commitez **jamais** de secrets : `SUPABASE_SERVICE_KEY`, `FOOTBALL_DATA_TOKEN`, `ADMIN_TOKEN`, `ALERT_WEBHOOK_URL`. Variables d'environnement uniquement (`.env` local, Vercel, Railway).

## Légal

Site indépendant de visualisation, non affilié à la FIFA ni à aucune fédération. Données : football-data.org. Aucun pari, aucun argent réel. Aucune marque FIFA ni écusson d'équipe n'est utilisé (drapeaux emoji Unicode uniquement — spec §22).
