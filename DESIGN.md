# DESIGN.md — Direction artistique de l'Atlas du Mondial

> Produit par l'audit DA (spec Atlas §0.2, étape 0), AVANT purge du legacy Wikimatch.
> **Règle normative : tout nouveau composant doit utiliser les tokens de `src/design/tokens.ts`.**
> La nouvelle app (Atlas) est visuellement la fille du Wikimatch actuel.

## 1. Identité visuelle en une phrase

Éditorial brutal type « journal sportif data » : fond crème, encre navy, accent bleu
électrique, titres Bebas Neue géants en capitales, métadonnées JetBrains Mono en
10px `tracking-widest`, **angles vifs partout** (pas de coins arrondis sur les
surfaces), hiérarchie par bordures fines plutôt que par ombres.

## 2. Tokens

Voir `src/design/tokens.ts` (source de vérité). Résumé :

| Token | Valeur |
|---|---|
| `cream` / `cream-dark` | `#F9F8F6` / `#EEECE6` |
| `navy` | `#0B1021` |
| `blue-electric` | `#0055FF` |
| `red-signal` | `#FF3333` |
| `green-acid` | `#CCFF00` |
| Display | Bebas Neue, uppercase, `leading-[0.9]`, `tracking-wide` |
| Corps | Inter 300–600 (light dominant) |
| Mono | JetBrains Mono 400/500, uppercase, `tracking-widest`, souvent `text-[10px]` |
| Rayons | `rounded-none` (surfaces/CTA) ; `rounded` (chips) ; `rounded-full` (dots) |
| Bordures | 1px encre à 10 % ; header hairline 0.5px ; accent `border-t-4 blue-electric` |
| Ombres | quasi aucune ; `shadow-2xl` uniquement sur card flottante |
| Animations | motion/react, ease `[0.22,1,0.36,1]`, reveal 0.8s, stagger 0.1s, hover lift −4px |
| Motif | grille 40px à 5 % d'opacité (`.bg-grid-pattern[-light]`) |
| Layout | `max-w-screen-2xl mx-auto px-4 md:px-8`, sections `py-24`/`py-32` |

Les couleurs et polices sont déclarées dans `src/index.css` (`@theme`, Tailwind v4)
et exposées comme classes (`bg-cream`, `text-navy`, `font-display`…). **Conserver
`src/index.css` tel quel** ; `tokens.ts` est le miroir TypeScript pour le code
(SVG de carte, OG images Satori, palette des nations).

## 3. Inventaire des composants réutilisables

### À conserver tels quels (shell du site)

| Composant | Fichier | Usage observé | Réutilisation Atlas |
|---|---|---|---|
| **SiteHeader** | `src/components/SiteHeader.tsx` | Header fixe `bg-cream/80 backdrop-blur`, hairline bas, logo Bebas, nav mono 10px bold uppercase, menu mobile plein écran navy avec slide `[0.22,1,0.36,1]` | Garder la structure ; remplacer logo et items de nav (Carte · La Nuit · Groupes · Tableau · Calendrier · Memorial) |
| **SiteFooter** | `src/components/SiteFooter.tsx` | Footer navy, 3 colonnes (pitch / nav display 2xl / liens mono), texte décoratif géant `text-[20vw] text-cream/5`, mention légale mono 10px | Garder ; remplacer textes + disclaimer FIFA (spec §22.2) |
| **SectionLabel** | `src/components/SectionLabel.tsx` | Kicker mono 10px bold `text-blue-electric` + `border-b blue-electric/20` | Réutiliser partout (titres de sections) |

### Patterns à répliquer (le composant legacy meurt, le motif survit)

| Motif | Vu dans | Recette |
|---|---|---|
| **Badge à pastille pulsante** | `DemoBadge.tsx` | `inline-flex gap-2 px-2 py-1 rounded bg-<color> text-white font-mono text-[10px] uppercase` + dot `w-1.5 h-1.5 rounded-full animate-pulse`. Base des badges LIVE / drama / statut match |
| **CTA primaire** | `HeroSection.tsx` | `bg-blue-electric text-white px-6 py-3 rounded-none font-medium hover:bg-white hover:text-blue-electric transition-colors` + flèche `→` qui translate au hover |
| **CTA secondaire** | `HeroSection.tsx` | `border border-cream/30 px-6 py-3 rounded-none hover:bg-cream/10` (var. fond clair : `border-navy/20 hover:bg-navy/5`) |
| **Card éditoriale** | `FeaturedStoryCard.tsx` | `bg-white border border-navy/10 p-6 flex flex-col gap-4 md:hover:-translate-y-1 transition-transform group` ; pied en mono 10px `border-t navy/5` clé→valeur. Base de `MatchCard` / `NarrativeCard` |
| **Card flottante accentuée** | `HeroSection.tsx` | `bg-cream text-navy p-6 shadow-2xl border-t-4 border-blue-electric` |
| **Encadré méthodo/limite** | `FeaturedStoryCard.tsx` | `bg-navy/5 p-4 rounded border-l-2 border-navy/20 font-mono text-xs text-navy/70` — pour les disclaimers `/methodo` |
| **Chips langue/méta** | `HeroSection.tsx` | `px-2 py-1 bg-navy/5 font-mono text-[10px] rounded` — pour drapeaux/groupes |
| **Hero plein écran sombre** | `HeroSection.tsx` | `min-h-[100svh] bg-navy text-cream justify-end` + image bg `opacity-30` + dégradé + `bg-grid-pattern-light` + métadonnées mono flottantes décoratives. Base du CountdownHero |
| **Titre display escalier** | `HeroSection.tsx` | Spans en `overflow-hidden` + reveal `y:100%→0` séquencé (delay +0.1s), Bebas `text-[3.5rem]`→`2xl:text-[10rem]` |
| **Liste éditoriale clé/valeur** | `TrustSection.tsx` | Rangées `border-b navy/10` : titre mono bold 1/3 + texte light 3xl 2/3 — pour `/methodo` |
| **Reveal au scroll** | partout | `initial={{opacity:0,y:20}} whileInView viewport={{once:true}}` + stagger `i*0.1` |
| **Hover encre→accent** | partout | `hover:text-blue-electric transition-colors` sur tout lien |

### Legacy à supprimer (concept Wikipédia mort)

Tous les composants de `src/components/{story,stories,match,matches,observatoire,explorer,entity,search,methodology}/`,
`HeroSection`, `FeaturedStoryCard`, `TrustSection`, `HowItWorksSection`, `ObservatoryTeaser`,
`TrackedMatchPoster`, `StoriesGrid`, `DemoBadge`, `AnimatedTextReveal` — après extraction
des motifs ci-dessus. Les pages `src/pages/*` legacy également.

## 4. Règles pour les nouveaux composants Atlas

1. **Aucune constante visuelle en dur** : couleurs/polices via les classes `@theme`
   de `src/index.css` ou `src/design/tokens.ts` (SVG, canvas, OG Satori).
2. **`rounded-none` sur toute surface et tout bouton.** `rounded` réservé aux chips.
3. Labels techniques = mono 10–12px uppercase `tracking-widest` ; titres = Bebas
   uppercase ; corps = Inter light. Ne jamais mélanger les registres.
4. Hiérarchie par bordures (`border-navy/10`) et aplats (`bg-navy/5`), pas d'ombres
   (exception : card flottante unique par écran, `shadow-2xl`).
5. Animations : motion/react, ease `[0.22,1,0.36,1]`, reveals 0.8s, stagger 0.1s.
   Hover : `transition-colors` ou lift −4px. Rien de plus exotique.
6. Drapeaux : **emoji Unicode uniquement** (spec §22.1 — jamais les `crest` API).
7. Palette des 48 nations : dérivée des contraintes `nationPaletteConstraints`
   de `tokens.ts`, validée sur `/admin/map-preview`.
8. Mobile-first : tout composant doit être conçu à 390px d'abord.
9. Pas de mode sombre global (hors scope §23) — mais les sections `bg-navy` 
   inversées (hero, footer) font partie de la grammaire.
