# FRONTEND_AUDIT — Frontend V2 (AI Studio export)

Audit réel du dossier courant `c:\Users\thoma\Desktop\Revision90`, daté de la Phase 0 (2026-05-26).

## 1. Stack détectée

| Élément | Valeur observée |
| ------- | --------------- |
| Framework | React 19.0.1 |
| Bundler | Vite 6.4.2 |
| Langage | TypeScript ~5.8.2 (`tsconfig.json` `moduleResolution: bundler`, `jsx: react-jsx`) |
| Routing | `react-router-dom` 7.15.1 (`BrowserRouter` SPA dans [src/App.tsx](../../src/App.tsx)) |
| Styling | Tailwind CSS 4.1.14 via `@tailwindcss/vite` (config inline, pas de `tailwind.config.*`) |
| Animations | `motion` 12.23.24 (Framer Motion successeur) |
| Icônes | `lucide-react` 0.546.0 |
| IA SDK présent (non utilisé prod V2) | `@google/genai` 2.4.0 (issu de l'export AI Studio) |
| Serveur dev/preview | Vite + `express` (probablement pour AI Studio Cloud Run) |
| Gestion état | Local React (`useState`, `useEffect`) + un Context dédié `SearchContext` |
| Tests | NON VÉRIFIÉ — aucun script `test` dans `package.json`, aucun framework installé |
| Lint | Script `lint` = `tsc --noEmit` uniquement |
| Path alias | `@/*` → racine du projet (`vite.config.ts` + `tsconfig.json`) |
| Versionnement Git | NON — le dossier n'est pas un dépôt Git (`NOT_A_GIT_REPO`). Recommandation : `git init` + branche `v2/audit-and-architecture`. |
| Variables d'env attendues | `GEMINI_API_KEY`, `APP_URL` (cf. `.env.example`). `DISABLE_HMR` reconnu par `vite.config.ts`. Secrets non lus dans ce rapport. |

## 2. Scripts disponibles

| Script | Commande |
| ------ | -------- |
| `dev` | `vite --port=3000 --host=0.0.0.0` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `lint` | `tsc --noEmit` |
| `clean` | `rm -rf dist server.js` (commande POSIX — ne fonctionne pas en PowerShell pur) |

## 3. État du build / lint / tests

| Étape | Résultat | Détail |
| ----- | -------- | ------ |
| `npm install` | OK | 219 paquets installés. |
| `npm run build` (Vite) | **OK** | 2235 modules transformés en 5.87s. Bundle JS = 869.30 kB / gzip 218.96 kB. CSS = 98.68 kB. Warning Vite : *Some chunks are larger than 500 kB* (à code-splitter en Phase 1+). |
| `npm run lint` (tsc --noEmit) | **ÉCHEC** | 3 erreurs TypeScript (cf. §6). |
| Tests | NON APPLICABLE | Aucun framework de tests installé, aucun script `test`. |

**Conclusion** : la build production passe. Le typecheck strict échoue mais sur des problèmes mineurs et correctifs.

## 4. Arborescence pertinente

```
src/
├── App.tsx                  ← BrowserRouter, 14 routes
├── main.tsx                 ← createRoot + StrictMode + ErrorBoundary
├── ErrorBoundary.tsx
├── index.css
├── types.ts                 ← types domaine partagés (~700 lignes)
├── mockHomeData.ts          ┐
├── mockStoryData.ts         │
├── mockMatchData.ts         │
├── mockMatchesData.ts       │
├── mockEntityData.ts        ├ 10 fichiers de fixtures (un par page)
├── mockExplorerData.ts      │
├── mockObservatoryData.ts   │
├── mockMethodologyData.ts   │
├── mockSearchData.ts        │
├── mockStoriesData.ts       ┘
├── pages/                   ← 14 pages (10 produit + 4 institutionnelles)
└── components/
    ├── (chrome partagé : SiteHeader, SiteFooter, AnimatedTextReveal, DemoBadge…)
    ├── entity/        (11 composants)
    ├── explorer/      (11 composants)
    ├── match/         (13 composants)
    ├── matches/       (9 composants + 4 cards)
    ├── methodology/   (16 composants)
    ├── observatoire/  (11 composants)
    ├── search/        (10 composants)
    ├── stories/       (10 composants)
    └── story/         (12 composants)
```

## 5. Routes réellement présentes

Toutes les 10 routes attendues sont câblées dans [src/App.tsx](../../src/App.tsx). 4 routes institutionnelles supplémentaires existent.

| # | Route attendue | Présente ? | Fonctionne ? | Fichier principal | Données utilisées | Remarques |
|---|----------------|------------|--------------|-------------------|-------------------|-----------|
| 1 | `/` | OUI | OUI (build) | [src/pages/Home.tsx](../../src/pages/Home.tsx) | `mockHomeData` (via composants) | Imports propres, pas de couplage worker |
| 2 | `/story/demo-divergence` | OUI | OUI | [src/pages/StoryDetail.tsx](../../src/pages/StoryDetail.tsx) | `mockStoryData.demoDivergenceStory` | `slug !== 'demo-divergence'` → `<Navigate to="/" />`. Une seule story complète en démo. |
| 3 | `/match/demo-france-belgique` | OUI (route paramétrée) | OUI | [src/pages/MatchDetail.tsx](../../src/pages/MatchDetail.tsx) | `mockMatchData` (`demoMatch`, `demoRecap`, `matchStories`, `matchTimeline`, `matchComparison`, `demoInstability`, `trackedSubjects`) | `DemoStateSwitcher` permet de basculer `pre_match / live / post_match`. Slug pas validé. |
| 4 | `/stories` | OUI | OUI | [src/pages/StoriesArchive.tsx](../../src/pages/StoriesArchive.tsx) | `mockStoriesData` | À CONFIRMER — non ouvert ligne à ligne. |
| 5 | `/matches` | OUI | OUI | [src/pages/MatchesCalendar.tsx](../../src/pages/MatchesCalendar.tsx) | `mockMatchesData` + `types.MatchesFilterState` | Calendrier éditorial. |
| 6 | `/entity/demo-japan-goalkeeper` | OUI (route paramétrée) | OUI | [src/pages/EntityDetail.tsx](../../src/pages/EntityDetail.tsx) | `mockEntityData` (6 exports) | Slug différent → écran "Cette entité n'est pas construite dans la démo frontend". |
| 7 | `/explorer` | OUI | OUI | [src/pages/Explorer.tsx](../../src/pages/Explorer.tsx) | `mockExplorerData` | Atlas / matrix / timeline en vue. |
| 8 | `/observatoire` | OUI | OUI | [src/pages/Observatory.tsx](../../src/pages/Observatory.tsx) | `mockObservatoryData` | Orthographe FR conservée. |
| 9 | `/methodology` | OUI | OUI | [src/pages/Methodology.tsx](../../src/pages/Methodology.tsx) | `mockMethodologyData` | Page longue avec navigation interne. |
| 10 | `/search` | OUI | OUI | [src/pages/Search.tsx](../../src/pages/Search.tsx) | `mockSearchData` + `SearchContext` | Recherche client-side. |

**Bonus (institutionnelles)** : `/about`, `/privacy`, `/source`, `/contact` — toutes câblées.

## 6. Problèmes détectés par le typecheck

| Fichier | Erreur | Diagnostic |
| ------- | ------ | ---------- |
| [src/components/search/SearchRecommendedEntries.tsx:29](../../src/components/search/SearchRecommendedEntries.tsx#L29) | `Type '{ key: string; item: PublicSearchResult; }' is not assignable to type '{ item: PublicSearchResult; }'` | `key` passé comme prop au lieu d'être appliqué au JSX directement. Correctif trivial. |
| [src/components/search/SearchResultCard.tsx:9](../../src/components/search/SearchResultCard.tsx#L9) | `Cannot find namespace 'React'` | Usage de `React.X` sans `import React from 'react'`. `@types/react` non installé. |
| [src/pages/Contact.tsx:15](../../src/pages/Contact.tsx#L15) | `Cannot find namespace 'React'` | Idem. |

**Cause racine** : `@types/react` et `@types/react-dom` ne sont **pas** dans `devDependencies` du `package.json` V2. À ajouter en Phase 1 (cf. [[IMPLEMENTATION_PLAN]] Phase 1).

Aucune correction n'a été appliquée — la build Vite passe, ces erreurs ne sont pas bloquantes pour l'audit.

## 7. Composants partagés (chrome global)

| Composant | Emplacement | Rôle | Couplage fixtures |
| --------- | ----------- | ---- | ----------------- |
| `SiteHeader` | [src/components/SiteHeader.tsx](../../src/components/SiteHeader.tsx) | Header global présent sur toutes les pages | À VÉRIFIER |
| `SiteFooter` | [src/components/SiteFooter.tsx](../../src/components/SiteFooter.tsx) | Footer global | À VÉRIFIER |
| `DemoBadge` | [src/components/DemoBadge.tsx](../../src/components/DemoBadge.tsx) | Badge "DÉMONSTRATION" présent | Indépendant |
| `AnimatedTextReveal` | [src/components/AnimatedTextReveal.tsx](../../src/components/AnimatedTextReveal.tsx) | Animations text reveal (motion) | Indépendant |
| `SectionLabel` | [src/components/SectionLabel.tsx](../../src/components/SectionLabel.tsx) | Labels typographiques | Indépendant |
| `TrackedMatchPoster` | [src/components/TrackedMatchPoster.tsx](../../src/components/TrackedMatchPoster.tsx) | Carte match suivi | Importe `nextMatch` depuis `mockHomeData` **directement** |
| `FeaturedStoryCard` | [src/components/FeaturedStoryCard.tsx](../../src/components/FeaturedStoryCard.tsx) | Carte story mise en avant | Importe `featuredStory` depuis `mockHomeData` **directement** |
| `StoriesGrid` | [src/components/StoriesGrid.tsx](../../src/components/StoriesGrid.tsx) | Grille d'aperçu | Importe `latestStories` depuis `mockHomeData` **directement** |
| `HeroSection` | [src/components/HeroSection.tsx](../../src/components/HeroSection.tsx) | Hero d'accueil | Importe `featuredStory` |
| `HowItWorksSection`, `TrustSection` | Idem | Sections éditoriales | À VÉRIFIER |
| `ObservatoryTeaser` | [src/components/ObservatoryTeaser.tsx](../../src/components/ObservatoryTeaser.tsx) | Compteurs publics | Importe `observatoryData` |
| Par feature (`entity/`, `explorer/`, `match/`, `matches/`, `methodology/`, `observatoire/`, `search/`, `stories/`, `story/`) | Voir §4 | Composants spécifiques par page | Reçoivent généralement les fixtures **en props** depuis leur page parente (pattern propre) |

**Pattern observé** : la **page** importe la fixture du module `mock*Data.ts` correspondant, puis passe les données aux composants par props. **Exception** : 6 composants partagés (`FeaturedStoryCard`, `HeroSection`, `StoriesGrid`, `TrackedMatchPoster`, `ObservatoryTeaser`) importent **directement** `mockHomeData`. C'est le couplage le plus critique à découpler en Phase 1.

## 8. Fixtures (mock data)

| Fichier | Page principale | Centralisé | Observations |
| ------- | --------------- | ---------- | ------------ |
| [src/mockHomeData.ts](../../src/mockHomeData.ts) | Home | Oui | Importé par 6 composants partagés en plus de Home — fort couplage. |
| [src/mockStoryData.ts](../../src/mockStoryData.ts) | StoryDetail | Oui | Une seule story complète (`demoDivergenceStory`). |
| [src/mockMatchData.ts](../../src/mockMatchData.ts) | MatchDetail | Oui | 7 exports nommés. |
| [src/mockMatchesData.ts](../../src/mockMatchesData.ts) | MatchesCalendar | Oui | À CONFIRMER (non ouvert). |
| [src/mockEntityData.ts](../../src/mockEntityData.ts) | EntityDetail | Oui | 6 exports nommés. |
| [src/mockExplorerData.ts](../../src/mockExplorerData.ts) | Explorer | Oui | À CONFIRMER. |
| [src/mockObservatoryData.ts](../../src/mockObservatoryData.ts) | Observatory | Oui | À CONFIRMER. |
| [src/mockMethodologyData.ts](../../src/mockMethodologyData.ts) | Methodology | Oui | À CONFIRMER. |
| [src/mockSearchData.ts](../../src/mockSearchData.ts) | Search | Oui | Couplé à `SearchContext`. |
| [src/mockStoriesData.ts](../../src/mockStoriesData.ts) | StoriesArchive | Oui | À CONFIRMER. |

**Cohérence inter-pages** : NON VÉRIFIÉ exhaustivement (cross-checks ID/slug entre fixtures). À auditer formellement en Phase 1 quand on consolidera la `demoDataset`.

## 9. Types domaine

[src/types.ts](../../src/types.ts) contient ~700 lignes de types soigneusement organisés par page : `PublishedStory`, `MatchContext`, `EntityProfile`, `ExplorerMatrixRow`, `ObservatoryTrace`, `MethodologyDefinition`, etc. C'est une **excellente base** pour devenir le contrat de la future couche `PublicDataProvider` (cf. [[TARGET_ARCHITECTURE]] §3 et [[IMPLEMENTATION_PLAN]] Phase 1).

## 10. Liens internes, placeholders, accessibilité

| Point | État |
| ----- | ---- |
| Liens internes vers les 10 routes | OUI — `react-router-dom` est utilisé (`Link`, `useParams`, `Navigate`). |
| Placeholders persistants vers fonctionnalités absentes | NON VÉRIFIÉ exhaustivement — à valider en Phase 1. |
| Badges `DÉMONSTRATION` | OUI — composant `DemoBadge` + `StoryDemoBadge` + `MatchDemoBadge`. |
| Mode mobile prioritaire | OUI au niveau code — classes Tailwind responsive abondantes, `DemoStateSwitcher` adapte `pt-` mobile/desktop. À VÉRIFIER visuellement. |
| Animations excessives | NON VÉRIFIÉ — `motion` utilisé largement. |
| Images / assets locaux | NON VÉRIFIÉ — pas de dossier `public/` ni `assets/` visible. Probablement URLs externes ou data-URIs. |
| ErrorBoundary | OUI — [src/ErrorBoundary.tsx](../../src/ErrorBoundary.tsx) enveloppant `<App />` dans `main.tsx`. |

## 11. Compatibilité avec une future data layer

**Très favorable :**

1. Les **pages** centralisent l'import des fixtures et passent par props — il suffit de remplacer l'import par un hook `usePublicData()`.
2. Les **types** sont déjà extraits dans `src/types.ts` et alignés conceptuellement avec le modèle V2.
3. La **séparation par feature** des composants évite les dépendances circulaires.

**Points d'attention :**

1. Le couplage de 6 composants partagés à `mockHomeData` doit être inversé en Phase 1 (les composants doivent recevoir leurs données par props ou via le provider).
2. Le typecheck doit être réparé (ajouter `@types/react`, `@types/react-dom`).
3. Le bundle JS dépasse 500 kB minifié — code-splitting par route (`React.lazy`) recommandé avant production.
4. Aucune intégration de tests à ce jour — un socle minimal (`vitest` + `@testing-library/react`) est à prévoir avant la connexion live (cf. [[IMPLEMENTATION_PLAN]] Phase 1).

## 12. Dette technique identifiée

| Niveau | Sujet | Détail |
| ------ | ----- | ------ |
| Faible | Erreurs typecheck | 3 erreurs, correctifs triviaux. |
| Faible | Pas de Git | `git init` + branche dédiée recommandés immédiatement. |
| Moyen | Bundle 869 kB | Code-splitting requis avant prod. |
| Moyen | Couplage composants partagés ↔ `mockHomeData` | À inverser en Phase 1. |
| Moyen | Aucun test | Socle de tests à introduire en Phase 1 / 2. |
| Faible | Scripts npm POSIX (`rm -rf`) | Casse sur Windows pur. À remplacer par `rimraf` ou `del-cli`. |
| Faible | Métadonnées génériques | `index.html` titre = *My Google AI Studio App*, `metadata.json` `name` et `description` vides, `README` issu du template AI Studio. |
| Information | Présence `express` + `@google/genai` | Hérités de l'AI Studio runtime. Pas utilisés par le code de production V2 audité. À nettoyer si non requis. |

## 13. Conclusion FRONTEND_AUDIT

Le frontend V2 est **utilisable et de bonne facture** : routing complet, séparation pages/composants/fixtures propre, types domaine déjà très alignés avec la cible. La Phase 1 (data layer demo/live) peut démarrer sans réécrire l'UI. Les correctifs nécessaires (typecheck, Git, couplage `mockHomeData`) sont mineurs et documentés. Pas de réécriture massive nécessaire — conforme à la consigne de préservation de la direction UX.
