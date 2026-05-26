import {
  StoriesArchiveStats,
  StoryArchiveFilter,
  StoryArchiveItem,
  FeaturedCollection
} from "./types";

export const archiveStats: StoriesArchiveStats = {
  storyCount: 12,
  matchCount: 5,
  languageCount: 8,
  sourceCount: 46,
  isDemo: true
};

export const archiveFilters: StoryArchiveFilter[] = [
  {
    id: "all",
    label: "Toutes"
  },
  {
    id: "fact_entry",
    label: "Un fait entre",
    type: "fact_entry"
  },
  {
    id: "language_comparison",
    label: "Plusieurs éditions"
  },
  {
    id: "article_instability",
    label: "Article instable",
    type: "article_instability"
  },
  {
    id: "under_radar",
    label: "Sous le radar",
    type: "under_radar"
  },
  {
    id: "match_recap",
    label: "Récaps match",
    type: "match_recap"
  }
];

export const featuredStory: StoryArchiveItem = {
  id: "demo-divergence-001",
  slug: "demo-divergence",
  type: "language_divergence",
  categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
  title: "UN MÊME CARTON ROUGE. TROIS TRAITEMENTS WIKIPÉDIA.",
  excerpt: "Après un incident fictif de fin de match, les éditions anglaise et espagnole ne retiennent pas exactement les mêmes éléments, tandis qu’aucune mention équivalente n’est observée dans l’édition française.",
  publishedAtLabel: "18 juin 2026 · scénario fictif",
  matchLabel: "France — Belgique",
  entityLabel: "Article d’un joueur",
  languages: ["EN", "ES", "FR"],
  sourceCount: 3,
  readingTimeLabel: "4 min",
  isDemo: true,
  isFeatured: true,
  availableDetailRoute: "/story/demo-divergence"
};

export const archiveStories: StoryArchiveItem[] = [
  featuredStory,
  {
    id: "story-morocco-qualification",
    slug: "demo-morocco-qualification",
    type: "language_convergence",
    categoryLabel: "MISE À JOUR CONVERGENTE",
    title: "La qualification du Maroc apparaît dans quatre éditions en quinze minutes.",
    excerpt: "Dans ce scénario fictif, la qualification est ajoutée successivement aux éditions anglaise, française, arabe et espagnole.",
    publishedAtLabel: "20 juin 2026 · scénario fictif",
    matchLabel: "Maroc — Croatie",
    entityLabel: "Sélection marocaine",
    languages: ["EN", "FR", "AR", "ES"],
    sourceCount: 4,
    readingTimeLabel: "3 min",
    isDemo: true
  },
  {
    id: "story-article-instability",
    slug: "demo-article-instability",
    type: "article_instability",
    categoryLabel: "ARTICLE INSTABLE",
    title: "Une mention retirée puis réintroduite trois fois sur le même article.",
    excerpt: "Un passage lié à un incident fictif apparaît, disparaît puis revient sous une formulation sourcée.",
    publishedAtLabel: "18 juin 2026 · scénario fictif",
    matchLabel: "France — Belgique",
    entityLabel: "Article d’un joueur",
    languages: ["EN"],
    sourceCount: 5,
    readingTimeLabel: "5 min",
    isDemo: true
  },
  {
    id: "story-japan-goalkeeper",
    slug: "demo-japan-goalkeeper",
    type: "under_radar",
    categoryLabel: "SOUS LE RADAR",
    title: "Le gardien suivi au Japon avant d’apparaître ailleurs.",
    excerpt: "Son article japonais reçoit plusieurs ajouts substantiels après un match fictif, tandis que les éditions anglaise et française restent inchangées.",
    publishedAtLabel: "22 juin 2026 · scénario fictif",
    matchLabel: "Japon — Sénégal",
    entityLabel: "Gardien japonais",
    languages: ["JA", "EN", "FR"],
    sourceCount: 4,
    readingTimeLabel: "4 min",
    isDemo: true,
    availableDetailRoute: "/entity/demo-japan-goalkeeper"
  },
  {
    id: "story-result-final",
    slug: "demo-result-final",
    type: "fact_entry",
    categoryLabel: "UN FAIT ENTRE DANS WIKIPÉDIA",
    title: "Le résultat final apparaît dans trois éditions après le coup de sifflet.",
    excerpt: "Les articles fictifs du match intègrent successivement le score final en anglais, en français puis en espagnol.",
    publishedAtLabel: "18 juin 2026 · scénario fictif",
    matchLabel: "France — Belgique",
    entityLabel: "Page du match",
    languages: ["EN", "FR", "ES"],
    sourceCount: 3,
    readingTimeLabel: "2 min",
    isDemo: true
  },
  {
    id: "story-recap-fr-bel",
    slug: "demo-recap-fr-bel",
    type: "match_recap",
    categoryLabel: "RÉCAP MATCH",
    title: "France — Belgique : un résultat converge, un incident diverge.",
    excerpt: "Le dossier fictif de la rencontre rassemble une mise à jour stable, une divergence entre éditions et un article momentanément instable.",
    publishedAtLabel: "19 juin 2026 · scénario fictif",
    matchLabel: "France — Belgique",
    languages: ["EN", "ES", "FR"],
    sourceCount: 12,
    readingTimeLabel: "7 min",
    isDemo: true,
    availableDetailRoute: "/match/demo-france-belgique"
  },
  {
    id: "story-striker-record",
    slug: "demo-striker-record",
    type: "language_convergence",
    categoryLabel: "MISE À JOUR CONVERGENTE",
    title: "Un record de buts entre d’abord dans l’édition portugaise.",
    excerpt: "La mention fictive du record apparaît sur l’article portugais avant d’être intégrée à deux autres éditions.",
    publishedAtLabel: "24 juin 2026 · scénario fictif",
    matchLabel: "Portugal — Uruguay",
    entityLabel: "Attaquant portugais",
    languages: ["PT", "EN", "ES"],
    sourceCount: 3,
    readingTimeLabel: "3 min",
    isDemo: true
  },
  {
    id: "story-penalty-wording",
    slug: "demo-penalty-wording",
    type: "language_divergence",
    categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
    title: "Penalty accordé : une édition qualifie la décision, deux restent factuelles.",
    excerpt: "Dans ce scénario fictif, un article emploie un qualificatif tandis que deux autres mentionnent uniquement la décision arbitrale.",
    publishedAtLabel: "26 juin 2026 · scénario fictif",
    matchLabel: "Argentine — Allemagne",
    entityLabel: "Page du match",
    languages: ["ES", "DE", "EN"],
    sourceCount: 4,
    readingTimeLabel: "5 min",
    isDemo: true
  },
  {
    id: "story-stabilized-summary",
    slug: "demo-stabilized-summary",
    type: "article_instability",
    categoryLabel: "ARTICLE STABILISÉ",
    title: "Après quatre reformulations, le résumé du match reste inchangé.",
    excerpt: "L’article fictif connaît plusieurs corrections successives avant de conserver une formulation sourcée.",
    publishedAtLabel: "28 juin 2026 · scénario fictif",
    matchLabel: "Mexique — Corée du Sud",
    entityLabel: "Page du match",
    languages: ["ES"],
    sourceCount: 6,
    readingTimeLabel: "4 min",
    isDemo: true
  },
  {
    id: "story-local-edition-team",
    slug: "demo-local-edition-team",
    type: "under_radar",
    categoryLabel: "SOUS LE RADAR",
    title: "Une sélection progresse dans son édition locale avant d’être documentée ailleurs.",
    excerpt: "La page fictive d’une sélection est largement mise à jour dans une édition linguistique locale, plusieurs heures avant les éditions internationales.",
    publishedAtLabel: "29 juin 2026 · scénario fictif",
    matchLabel: "Ghana — Canada",
    entityLabel: "Sélection ghanéenne",
    languages: ["EN", "FR"],
    sourceCount: 5,
    readingTimeLabel: "4 min",
    isDemo: true
  },
  {
    id: "story-title-entry",
    slug: "demo-title-entry",
    type: "fact_entry",
    categoryLabel: "UN FAIT ENTRE DANS WIKIPÉDIA",
    title: "La mention de champion du monde apparaît après la finale.",
    excerpt: "Dans ce scénario fictif, un titre entre dans les articles d’une sélection et de plusieurs joueurs après le coup de sifflet final.",
    publishedAtLabel: "19 juillet 2026 · scénario fictif",
    matchLabel: "Finale · scénario fictif",
    entityLabel: "Sélection championne",
    languages: ["EN", "FR", "ES", "PT"],
    sourceCount: 8,
    readingTimeLabel: "6 min",
    isDemo: true
  },
  {
    id: "story-day-recap",
    slug: "demo-day-recap",
    type: "match_recap",
    categoryLabel: "RÉCAP MATCH",
    title: "Trois matchs, cinq histoires : ce que Wikipédia a retenu de la journée.",
    excerpt: "Une sélection fictive des changements validés, des comparaisons entre éditions et des articles instables observés au cours de la journée.",
    publishedAtLabel: "30 juin 2026 · scénario fictif",
    languages: ["EN", "FR", "ES", "AR", "JA"],
    sourceCount: 18,
    readingTimeLabel: "8 min",
    isDemo: true
  }
];

export const featuredCollection: FeaturedCollection = {
  id: "collection-multiple-wikipedias",
  label: "COLLECTION",
  title: "UN MÊME MATCH. PLUSIEURS WIKIPÉDIAS.",
  description: "Des histoires fictives montrant comment un même fait peut apparaître, diverger ou se stabiliser dans différentes éditions linguistiques.",
  storyIds: [
    "demo-divergence-001",
    "story-morocco-qualification",
    "story-penalty-wording"
  ],
  isDemo: true
};
