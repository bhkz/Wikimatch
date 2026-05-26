import {
  EntityProfile,
  EntityPublishedStory,
  EntityLanguageArticleState,
  EntityComparisonCase,
  EntityTimelineItem,
  EntityRelatedMatch
} from "./types";

export const demoEntity: EntityProfile = {
  id: "demo-japan-goalkeeper",
  slug: "demo-japan-goalkeeper",
  type: "player",
  name: "REN ITO",
  displayRole: "GARDIEN · SÉLECTION JAPONAISE FICTIVE",
  associatedTeam: "JAPON · SCÉNARIO FICTIF",
  tournamentLabel: "COUPE DU MONDE 2026 · DÉMONSTRATION",
  shortDescription: "Un gardien fictif dont l’article japonais s’enrichit après un match remarqué, avant que des ajouts équivalents n’apparaissent dans les éditions anglaise et française observées.",
  editorialAngle: "SOUS LE RADAR : DOCUMENTÉ D’ABORD DANS L’ÉDITION JAPONAISE",
  isDemo: true,
  demoLabel: "DÉMONSTRATION D’INTERFACE · JOUEUR FICTIF · AUCUNE DONNÉE RÉELLE"
};

export const featuredEntityStory: EntityPublishedStory = {
  id: "story-japan-goalkeeper",
  slug: "demo-japan-goalkeeper",
  type: "under_radar",
  categoryLabel: "SOUS LE RADAR",
  title: "LE GARDIEN SUIVI AU JAPON AVANT D’APPARAÎTRE AILLEURS.",
  excerpt: "Après un match fictif contre le Sénégal, l’édition japonaise ajoute plusieurs éléments substantiels sur Ren Ito. Les versions anglaise et française observées restent encore beaucoup plus limitées.",
  dateLabel: "22 JUIN 2026 · SCÉNARIO FICTIF",
  languages: ["JA", "EN", "FR"],
  matchLabel: "Japon — Sénégal · scénario fictif",
  sourceCount: 4,
  isDemo: true,
  availableRoute: "/entity/demo-japan-goalkeeper"
};

export const languageArticleStates: EntityLanguageArticleState[] = [
  {
    languageCode: "JA",
    languageLabel: "Édition japonaise",
    articleLabel: "Article de Ren Ito · version japonaise fictive",
    articleDepthLabel: "ARTICLE ENRICHI",
    lastObservedLabel: "Observé à 22:36",
    substantiveChanges: 3,
    presentClaims: [
      "Première titularisation dans le tournoi fictif",
      "Arrêt décisif en fin de match",
      "Rôle dans le résultat face au Sénégal"
    ],
    absentClaims: [],
    translatedExcerpt: "Il réalise un arrêt décisif dans les dernières minutes de la rencontre face au Sénégal, contribuant au résultat de sa sélection.",
    sourceCount: 3,
    state: "expanded"
  },
  {
    languageCode: "EN",
    languageLabel: "Édition anglaise",
    articleLabel: "Article de Ren Ito · version anglaise fictive",
    articleDepthLabel: "ARTICLE LIMITÉ",
    lastObservedLabel: "Observé à 22:41",
    substantiveChanges: 0,
    presentClaims: [
      "Identité et poste du joueur"
    ],
    absentClaims: [
      "Match face au Sénégal non mentionné",
      "Arrêt décisif non mentionné"
    ],
    translatedExcerpt: "",
    sourceCount: 0,
    state: "limited"
  },
  {
    languageCode: "FR",
    languageLabel: "Édition française",
    articleLabel: "Article de Ren Ito · version française fictive",
    articleDepthLabel: "AUCUN AJOUT ÉQUIVALENT DÉTECTÉ",
    lastObservedLabel: "Observé à 22:45",
    substantiveChanges: 0,
    presentClaims: [
      "Fiche biographique courte"
    ],
    absentClaims: [
      "Match face au Sénégal non mentionné",
      "Performance non mentionnée",
      "Aucune section tournoi enrichie"
    ],
    translatedExcerpt: "",
    sourceCount: 0,
    state: "unchanged"
  }
];

export const entityComparison: EntityComparisonCase = {
  categoryLabel: "COMPARAISON ENTRE ÉDITIONS",
  title: "UN JOUEUR. TROIS NIVEAUX DE DOCUMENTATION.",
  description: "Dans ce scénario fictif, l’article japonais intègre plusieurs éléments liés au match. Les articles anglais et français observés ne contiennent pas encore d’ajouts équivalents.",
  rows: [
    {
      claimLabel: "Match Japon — Sénégal mentionné",
      JA: "Oui",
      EN: "Non détecté",
      FR: "Non détecté"
    },
    {
      claimLabel: "Arrêt décisif mentionné",
      JA: "Oui",
      EN: "Non détecté",
      FR: "Non détecté"
    },
    {
      claimLabel: "Rôle dans le résultat mentionné",
      JA: "Oui",
      EN: "Non détecté",
      FR: "Non détecté"
    },
    {
      claimLabel: "Ajout substantiel observé",
      JA: "3 ajouts",
      EN: "Aucun",
      FR: "Aucun"
    }
  ],
  observation: "L’édition japonaise contient dans ce scénario des informations sportives qui ne sont pas présentes dans les éditions anglaise et française observées au même moment.",
  limitation: "Ce décalage ne permet pas de conclure que les autres éditions ignorent volontairement le joueur, ni que cette différence restera durable.",
  isDemo: true
};

export const entityTimeline: EntityTimelineItem[] = [
  {
    id: "match-start",
    dateLabel: "22 JUIN 2026",
    timeLabel: "20:00",
    type: "match_event",
    title: "Japon — Sénégal",
    description: "Rencontre fictive suivie pour la démonstration.",
    isDemo: true
  },
  {
    id: "match-save",
    dateLabel: "22 JUIN 2026",
    timeLabel: "88'",
    type: "match_event",
    title: "Arrêt décisif dans le scénario fictif",
    description: "Événement de match utilisé comme contexte narratif.",
    isDemo: true
  },
  {
    id: "ja-addition-1",
    dateLabel: "22 JUIN 2026",
    timeLabel: "22:14 · JA",
    type: "wikipedia_observation",
    languageCode: "JA",
    title: "L’édition japonaise ajoute le match",
    description: "L’article fictif intègre sa titularisation face au Sénégal.",
    isDemo: true
  },
  {
    id: "ja-addition-2",
    dateLabel: "22 JUIN 2026",
    timeLabel: "22:21 · JA",
    type: "wikipedia_observation",
    languageCode: "JA",
    title: "La performance est documentée",
    description: "Une phrase fictive mentionne son arrêt décisif.",
    isDemo: true
  },
  {
    id: "comparison-snapshot",
    dateLabel: "22 JUIN 2026",
    timeLabel: "22:45",
    type: "comparison_snapshot",
    title: "Comparaison entre éditions",
    description: "Aucun ajout équivalent n’est observé dans les articles anglais et français fictifs.",
    isDemo: true
  },
  {
    id: "story-published",
    dateLabel: "22 JUIN 2026",
    timeLabel: "23:10",
    type: "published_story",
    title: "WikiMatch publie une histoire Sous le radar",
    description: "Le décalage de documentation est présenté avec ses limites méthodologiques.",
    isDemo: true
  }
];

export const relatedMatches: EntityRelatedMatch[] = [
  {
    id: "demo-japan-senegal",
    matchLabel: "JAPON — SÉNÉGAL",
    dateLabel: "22 JUIN 2026",
    stageLabel: "PHASE DE GROUPES · SCÉNARIO FICTIF",
    relationLabel: "Match à l’origine de l’histoire Sous le radar",
    dossierStatus: "not_created",
    isDemo: true
  },
  {
    id: "demo-japan-mexico",
    matchLabel: "JAPON — MEXIQUE",
    dateLabel: "27 JUIN 2026",
    stageLabel: "PHASE DE GROUPES · SCÉNARIO FICTIF",
    relationLabel: "Prochain match potentiellement suivi",
    dossierStatus: "upcoming",
    isDemo: true
  }
];

export const relatedEntityStories: EntityPublishedStory[] = [
  featuredEntityStory,
  {
    id: "story-japan-next-update",
    slug: "demo-japan-next-update",
    type: "fact_entry",
    categoryLabel: "UN FAIT ENTRE DANS WIKIPÉDIA",
    title: "Sa première titularisation apparaît dans l’article japonais.",
    excerpt: "Une mise à jour factuelle fictive documente son entrée dans le tournoi.",
    dateLabel: "22 JUIN 2026 · SCÉNARIO FICTIF",
    languages: ["JA"],
    matchLabel: "Japon — Sénégal · scénario fictif",
    sourceCount: 1,
    isDemo: true
  }
];
