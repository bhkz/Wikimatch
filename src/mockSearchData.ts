export type PublicSearchResultType =
  | "story"
  | "match"
  | "entity"
  | "public_trace"
  | "methodology";

export type SearchStoryCategory =
  | "fact_entry"
  | "language_convergence"
  | "language_divergence"
  | "article_instability"
  | "under_radar"
  | "match_recap";

export type SearchLanguageCode =
  | "EN"
  | "FR"
  | "ES"
  | "JA"
  | "AR"
  | "PT"
  | "DE"
  | "KO";

export type PublicSearchResult = {
  id: string;
  type: PublicSearchResultType;
  subtype?: SearchStoryCategory;
  title: string;
  excerpt: string;
  metadataLabel: string;
  languages?: SearchLanguageCode[];
  matchLabel?: string;
  entityLabel?: string;
  publicStatusLabel: string;
  keywords: string[];
  route?: string;
  available: boolean;
  isDemo: boolean;
};

export type SearchFilterType =
  | "all"
  | "story"
  | "match"
  | "entity"
  | "public_trace"
  | "methodology";

export type SearchSuggestion = {
  id: string;
  label: string;
  query: string;
  filter?: SearchFilterType;
  description: string;
};

export type SearchDemoStats = {
  indexedStories: number;
  indexedMatches: number;
  indexedSubjects: number;
  indexedPublicTraces: number;
  isDemo: boolean;
};

export type SearchPrivacyRule = {
  label: string;
  description: string;
};

export const searchDemoStats: SearchDemoStats = {
  indexedStories: 12,
  indexedMatches: 5,
  indexedSubjects: 5,
  indexedPublicTraces: 10,
  isDemo: true
};

export const searchSuggestions: SearchSuggestion[] = [
  {
    id: "suggest-ren-ito",
    label: "Ren Ito",
    query: "Ren Ito",
    filter: "all",
    description: "Retrouver le dossier fictif Sous le radar."
  },
  {
    id: "suggest-carton-rouge",
    label: "Carton rouge",
    query: "carton rouge",
    filter: "all",
    description: "Retrouver une divergence entre éditions."
  },
  {
    id: "suggest-france-belgique",
    label: "France — Belgique",
    query: "France Belgique",
    filter: "all",
    description: "Retrouver le dossier match et ses histoires."
  },
  {
    id: "suggest-article-instable",
    label: "Article instable",
    query: "article instable",
    filter: "all",
    description: "Comprendre les passages ajoutés puis retirés."
  },
  {
    id: "suggest-langue-pays",
    label: "Une langue n’est pas un pays",
    query: "langue pays",
    filter: "methodology",
    description: "Retrouver la règle méthodologique centrale."
  }
];

export const publicSearchResults: PublicSearchResult[] = [
  {
    id: "result-story-divergence",
    type: "story",
    subtype: "language_divergence",
    title: "Un même carton rouge. Trois traitements Wikipédia.",
    excerpt: "Dans ce scénario fictif, trois éditions linguistiques ne retiennent pas exactement les mêmes éléments d’un incident de fin de match.",
    metadataLabel: "HISTOIRE PUBLIÉE · CAS FICTIF",
    languages: ["EN", "ES", "FR"],
    matchLabel: "France — Belgique",
    publicStatusLabel: "DIVERGENCE ENTRE ÉDITIONS",
    keywords: [
      "carton rouge",
      "divergence",
      "france",
      "belgique",
      "anglais",
      "espagnol",
      "français",
      "incident",
      "story"
    ],
    route: "/story/demo-divergence",
    available: true,
    isDemo: true
  },
  {
    id: "result-match-fr-bel",
    type: "match",
    title: "France — Belgique",
    excerpt: "Un dossier fictif rassemblant une mise à jour convergente, une divergence entre éditions et un article momentanément instable.",
    metadataLabel: "DOSSIER MATCH · SCÉNARIO FICTIF",
    languages: ["EN", "ES", "FR"],
    matchLabel: "France — Belgique",
    publicStatusLabel: "3 HISTOIRES PUBLIÉES",
    keywords: [
      "france",
      "belgique",
      "match",
      "carton rouge",
      "incident",
      "dossier",
      "article instable"
    ],
    route: "/match/demo-france-belgique",
    available: true,
    isDemo: true
  },
  {
    id: "result-entity-ren-ito",
    type: "entity",
    subtype: "under_radar",
    title: "Ren Ito",
    excerpt: "Gardien fictif dont l’article japonais documente une performance absente des éditions anglaise et française observées au même moment.",
    metadataLabel: "DOSSIER JOUEUR · PERSONNAGE FICTIF",
    languages: ["JA", "EN", "FR"],
    entityLabel: "Gardien · sélection japonaise fictive",
    matchLabel: "Japon — Sénégal",
    publicStatusLabel: "SOUS LE RADAR",
    keywords: [
      "ren ito",
      "japon",
      "gardien",
      "sous le radar",
      "japonais",
      "performance",
      "sénégal",
      "joueur"
    ],
    route: "/entity/demo-japan-goalkeeper",
    available: true,
    isDemo: true
  },
  {
    id: "result-story-morocco",
    type: "story",
    subtype: "language_convergence",
    title: "La qualification du Maroc apparaît dans quatre éditions en quinze minutes.",
    excerpt: "Dans ce scénario fictif, un même fait est ajouté successivement aux éditions anglaise, française, arabe et espagnole.",
    metadataLabel: "HISTOIRE PUBLIÉE · CAS FICTIF",
    languages: ["EN", "FR", "AR", "ES"],
    matchLabel: "Maroc — Croatie",
    entityLabel: "Sélection marocaine fictive",
    publicStatusLabel: "MISE À JOUR CONVERGENTE",
    keywords: [
      "maroc",
      "croatie",
      "qualification",
      "arabe",
      "convergence",
      "quatre éditions"
    ],
    available: false,
    isDemo: true
  },
  {
    id: "result-trace-incident-en",
    type: "public_trace",
    title: "Ajout d’une mention de l’altercation et du carton rouge.",
    excerpt: "Trace fictive observée sur l’article anglais du joueur expulsé, reliée à l’histoire de divergence entre éditions.",
    metadataLabel: "TRACE PUBLIQUE · ÉDITION ANGLAISE · 22:48",
    languages: ["EN"],
    matchLabel: "France — Belgique",
    publicStatusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    keywords: [
      "carton rouge",
      "altercation",
      "trace",
      "anglais",
      "article joueur",
      "france belgique"
    ],
    route: "/observatoire",
    available: true,
    isDemo: true
  },
  {
    id: "result-trace-ren-ito-ja",
    type: "public_trace",
    title: "Ajout d’une performance fictive et d’un arrêt décisif.",
    excerpt: "Trace publique de démonstration issue de l’article japonais fictif de Ren Ito.",
    metadataLabel: "TRACE PUBLIQUE · ÉDITION JAPONAISE · 22:21",
    languages: ["JA"],
    matchLabel: "Japon — Sénégal",
    entityLabel: "Ren Ito",
    publicStatusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    keywords: [
      "ren ito",
      "japon",
      "arrêt décisif",
      "performance",
      "trace",
      "gardien"
    ],
    route: "/observatoire",
    available: true,
    isDemo: true
  },
  {
    id: "result-method-language-country",
    type: "methodology",
    title: "Une langue n’est pas un pays.",
    excerpt: "Une édition linguistique de Wikipédia ne représente ni un État, ni une opinion publique, ni un groupe national homogène.",
    metadataLabel: "MÉTHODOLOGIE · RÈGLE CENTRALE",
    publicStatusLabel: "LECTURE ET LIMITES",
    keywords: [
      "langue",
      "pays",
      "france",
      "édition linguistique",
      "opinion",
      "méthodologie"
    ],
    route: "/methodology",
    available: true,
    isDemo: false
  },
  {
    id: "result-method-instability",
    type: "methodology",
    title: "Quand un article devient-il instable ?",
    excerpt: "Une instabilité concerne un même article qui ajoute, retire ou restaure plusieurs fois un passage comparable.",
    metadataLabel: "MÉTHODOLOGIE · DÉFINITION",
    publicStatusLabel: "ARTICLE INSTABLE",
    keywords: [
      "article instable",
      "instabilité",
      "ajouté",
      "retiré",
      "restauré",
      "guerre"
    ],
    route: "/methodology",
    available: true,
    isDemo: false
  },
  {
    id: "result-story-instability",
    type: "story",
    subtype: "article_instability",
    title: "Une mention retirée puis réintroduite sur l’article anglais.",
    excerpt: "Le même passage fictif est ajouté, supprimé puis restauré avec une source sur un article précis.",
    metadataLabel: "HISTOIRE PUBLIÉE · CAS FICTIF",
    languages: ["EN"],
    matchLabel: "France — Belgique",
    publicStatusLabel: "ARTICLE INSTABLE",
    keywords: [
      "article instable",
      "anglais",
      "retirée",
      "réintroduite",
      "source",
      "france belgique"
    ],
    route: "/match/demo-france-belgique",
    available: true,
    isDemo: true
  },
  {
    id: "result-explorer",
    type: "methodology",
    title: "Explorer les sujets documentés sur la carte.",
    excerpt: "La carte situe les sujets footballistiques des histoires publiées, jamais la localisation des contributeurs.",
    metadataLabel: "EXPLORER · VISUALISATION",
    publicStatusLabel: "CARTE DES SUJETS",
    keywords: [
      "carte",
      "explorer",
      "sujets",
      "géographie",
      "localisation",
      "contributeurs"
    ],
    route: "/explorer",
    available: true,
    isDemo: true
  },
  {
    id: "result-story-recap-fr-bel",
    type: "story",
    subtype: "match_recap",
    title: "France — Belgique : un résultat converge, un incident diverge.",
    excerpt: "Le recap fictif rassemble les histoires validées issues de la rencontre.",
    metadataLabel: "RÉCAP MATCH · CAS FICTIF",
    languages: ["EN", "ES", "FR"],
    matchLabel: "France — Belgique",
    publicStatusLabel: "DOSSIER DISPONIBLE",
    keywords: [
      "france",
      "belgique",
      "recap",
      "résultat",
      "incident",
      "dossier match"
    ],
    route: "/match/demo-france-belgique",
    available: true,
    isDemo: true
  },
  {
    id: "result-match-japan-senegal",
    type: "match",
    title: "Japon — Sénégal",
    excerpt: "Match fictif lié à l’histoire Sous le radar de Ren Ito.",
    metadataLabel: "MATCH SUIVI · SCÉNARIO FICTIF",
    languages: ["JA", "EN", "FR"],
    matchLabel: "Japon — Sénégal",
    entityLabel: "Ren Ito",
    publicStatusLabel: "DOSSIER NON CONSTRUIT DANS LA DÉMO",
    keywords: [
      "japon",
      "sénégal",
      "ren ito",
      "gardien",
      "match"
    ],
    available: false,
    isDemo: true
  }
];
