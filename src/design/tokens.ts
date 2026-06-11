/**
 * Design tokens — extraits du code Wikimatch existant (audit DA, spec Atlas §0.2).
 *
 * Source de vérité visuelle de l'Atlas du Mondial. Tout nouveau composant DOIT
 * consommer ces tokens (directement ou via les classes Tailwind correspondantes
 * déclarées dans `src/index.css` @theme). Aucune couleur/police/durée en dur.
 *
 * Provenance exacte :
 * - Couleurs & polices : `src/index.css` (@theme, bloc Tailwind v4).
 * - Échelle typo, espacements, rayons, ombres, animations : usages relevés dans
 *   `src/components/*` (HeroSection, SiteHeader, SiteFooter, FeaturedStoryCard,
 *   TrustSection, DemoBadge, SectionLabel) — voir DESIGN.md pour l'inventaire.
 */

/* ----------------------------------------------------------------------------
 * 1. Couleurs (hex exacts de src/index.css)
 * -------------------------------------------------------------------------- */

export const colors = {
  /** Fond clair principal du site. */
  cream: "#F9F8F6",
  /** Variante de fond clair (zones légèrement contrastées). */
  creamDark: "#EEECE6",
  /** Encre principale + fonds sombres (header inversé, footer, hero). */
  navy: "#0B1021",
  /** Couleur d'accent primaire : liens hover, CTA, labels de section. */
  blueElectric: "#0055FF",
  /** Signal d'alerte / badge (ex-badge DÉMONSTRATION). */
  redSignal: "#FF3333",
  /** Accent acide, usage parcimonieux (highlights). */
  greenAcid: "#CCFF00",
  /** Carte : hexes neutres — sable grisé qui recule derrière les nations. */
  mapNeutral: "#B8B2A2",
  /** Carte : ruines des nations éliminées — gris sombre dramatique. */
  mapRuins: "#3A3F4D",
  /** Carte : capitales-mémoriaux — or, sanctuaire (aussi /memorial). */
  mapMemorial: "#C9A227",
} as const;

/**
 * Opacités canoniques observées dans le code (appliquées à navy sur fond clair
 * et à cream sur fond sombre). Ex : `text-navy/70`, `border-navy/10`.
 */
export const inkOpacities = {
  faint: 0.05, //  fonds de chips, séparateurs très légers
  border: 0.1, //  bordures par défaut
  muted: 0.2, //   bordures appuyées, texte décoratif géant
  dim: 0.4, //     texte tertiaire
  secondary: 0.5, // labels mono secondaires
  body: 0.7, //    texte courant secondaire
  strong: 0.8, //  texte courant sur fond sombre
} as const;

/* ----------------------------------------------------------------------------
 * 2. Typographie
 * -------------------------------------------------------------------------- */

/** Import Google Fonts exact (première ligne de src/index.css). */
export const fontImportUrl =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

export const fonts = {
  /** Titres, gros chiffres, nav mobile. Toujours uppercase. */
  display: '"Bebas Neue", ui-sans-serif, system-ui, sans-serif',
  /** Texte courant. Poids utilisés : 300 (light, dominant), 400, 500, 600. */
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  /** Labels techniques, métadonnées, badges. Poids : 400, 500 (+ bold via CSS). */
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

/**
 * Échelle typographique observée (classes Tailwind relevées dans les composants).
 * Trois registres distincts — ne pas les mélanger :
 */
export const typeScale = {
  /** Labels mono : TOUJOURS uppercase + tracking-widest. */
  monoLabel: {
    xs: "10px", //   text-[10px] — métadonnées, badges, footer légal
    sm: "0.75rem", // text-xs — labels de section, kickers
    md: "0.875rem", // text-sm — liens méthodo, titres de colonnes
  },
  /** Corps de texte sans-serif (font-light dominant). */
  body: {
    sm: "0.875rem", // text-sm
    md: "1.125rem", // text-lg
    lg: "1.25rem", //  text-xl
    xl: "1.875rem", // text-3xl — gros paragraphes éditoriaux
  },
  /** Display Bebas (uppercase, leading-none / leading-[0.9]). */
  display: {
    sm: "1.5rem", //   text-2xl — titres de cards
    md: "2.25rem", //  text-4xl — titres de blocs
    lg: "3.75rem", //  text-6xl — titres de sections
    xl: "7rem", //     ~lg:text-[7rem] — hero
    hero: "10rem", //  2xl:text-[10rem] — hero très grand écran
    decorative: "20vw", // texte décoratif géant du footer (opacité 5 %)
  },
} as const;

export const tracking = {
  /** tracking-wide — display Bebas. */
  display: "0.025em",
  /** tracking-widest — tous les labels mono uppercase. */
  monoLabel: "0.1em",
} as const;

export const leading = {
  /** leading-none / leading-[0.9] — display. */
  display: "0.9",
  tight: "1.25",
  /** leading-relaxed — corps de texte. */
  relaxed: "1.625",
} as const;

/* ----------------------------------------------------------------------------
 * 3. Espacements & layout
 * -------------------------------------------------------------------------- */

export const layout = {
  /** Conteneur principal : `w-full max-w-screen-2xl mx-auto`. */
  maxWidth: "1536px",
  /** Gouttières horizontales : `px-4 md:px-8`. */
  pagePaddingX: { base: "1rem", md: "2rem" },
  /** Sections verticales : `py-24` (6rem) standard, `py-32` (8rem) emphase. */
  sectionPaddingY: { base: "6rem", emphasis: "8rem" },
  /** Gaps internes récurrents : gap-4 / gap-6 / gap-8 / gap-12. */
  gaps: ["1rem", "1.5rem", "2rem", "3rem"],
  /** Hauteur header fixe compensée par `pt-24` sur les heros. */
  headerOffset: "6rem",
} as const;

/* ----------------------------------------------------------------------------
 * 4. Rayons de bordure
 * -------------------------------------------------------------------------- */

export const radii = {
  /**
   * SIGNATURE DA : les surfaces et boutons sont à angles vifs (`rounded-none`).
   * Ne PAS arrondir les cards/CTA — c'est l'identité éditoriale/brutale du site.
   */
  surface: "0px",
  /** Seule exception : chips, badges et petites pastilles (`rounded`). */
  chip: "0.25rem",
  /** Points/pastilles décoratives (`rounded-full`). */
  dot: "9999px",
} as const;

/* ----------------------------------------------------------------------------
 * 5. Bordures & ombres
 * -------------------------------------------------------------------------- */

export const borders = {
  /** Bordure par défaut : 1px, encre à 10 % (`border-navy/10`, `border-cream/10`). */
  default: `1px solid rgba(11, 16, 33, ${inkOpacities.border})`,
  /** Header : hairline (`border-b-[0.5px] border-navy/10`). */
  hairline: "0.5px",
  /** Accent éditorial : barre supérieure épaisse (`border-t-4 border-blue-electric`). */
  accentTop: `4px solid ${colors.blueElectric}`,
  /** Accent latéral discret (`border-l-2 border-navy/20`). */
  accentLeft: `2px solid rgba(11, 16, 33, ${inkOpacities.muted})`,
} as const;

export const shadows = {
  /**
   * La hiérarchie se fait par bordures + aplats, pas par ombres.
   * Seul usage relevé : `shadow-2xl` sur les cards flottantes (hero teaser).
   */
  floating: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
} as const;

/* ----------------------------------------------------------------------------
 * 6. Animation (motion/react + transitions Tailwind)
 * -------------------------------------------------------------------------- */

export const motionTokens = {
  /** Courbe signature des reveals (HeroSection, menu mobile) : easeOutQuint-like. */
  easeReveal: [0.22, 1, 0.36, 1] as const,
  durations: {
    /** Hover/transitions CSS : durées Tailwind par défaut (150ms) + 300ms. */
    hover: 0.15,
    medium: 0.3,
    /** Slides/menus : 0.5 s. */
    slide: 0.5,
    /** Reveals d'entrée : 0.8 s. */
    reveal: 0.8,
  },
  /** Décalage de stagger entre éléments d'une liste (delay: i * 0.1). */
  staggerStep: 0.1,
  /** Micro-interactions hover : translate-y -4px / translate-x 4px. */
  hoverLift: "-4px",
} as const;

/* ----------------------------------------------------------------------------
 * 7. Motifs décoratifs
 * -------------------------------------------------------------------------- */

export const patterns = {
  /** Grille 40px, traits encre à 5 % (`.bg-grid-pattern` / `-light`). */
  gridSize: "40px",
  gridLineDark: "rgba(11, 16, 33, 0.05)",
  gridLineLight: "rgba(249, 248, 246, 0.05)",
} as const;

/* ----------------------------------------------------------------------------
 * 8. Palette carte (Atlas) — dérivation
 * -------------------------------------------------------------------------- */

/**
 * Règle de dérivation de la palette des 48 nations (spec §3.4) :
 * couleurs générées dans la gamme de saturation/luminosité de `blueElectric`
 * (#0055FF ≈ HSL 220, 100 %, 50 %) et `redSignal` (#FF3333 ≈ HSL 0, 100 %, 60 %),
 * c'est-à-dire S 80–100 %, L 45–60 %, contrastées sur fond `cream` et `navy`.
 * La palette générée vit dans `data/nations-seed.json` (champ `color`) et doit
 * être validée visuellement sur /admin/map-preview.
 */
export const nationPaletteConstraints = {
  saturationRange: [0.8, 1.0],
  lightnessRange: [0.45, 0.6],
  contrastBackgrounds: [colors.cream, colors.navy],
} as const;

const tokens = {
  colors,
  inkOpacities,
  fonts,
  fontImportUrl,
  typeScale,
  tracking,
  leading,
  layout,
  radii,
  borders,
  shadows,
  motionTokens,
  patterns,
  nationPaletteConstraints,
} as const;

export default tokens;
