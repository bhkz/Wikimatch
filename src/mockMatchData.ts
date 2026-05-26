import {
  MatchContext,
  MatchTrackedSubject,
  MatchPublishedStory,
  MatchTimelineItem,
  MatchLanguageComparison,
  ArticleInstabilityCase,
  MatchRecap
} from "./types";

export const demoMatch: MatchContext = {
  id: "demo-france-belgique",
  slug: "demo-france-belgique",
  state: "post_match",
  isDemo: true,
  demoLabel: "DÉMONSTRATION D’INTERFACE · SCÉNARIO FICTIF · AUCUNE DONNÉE RÉELLE",
  competitionLabel: "COUPE DU MONDE 2026",
  stageLabel: "PHASE DE GROUPES · SCÉNARIO FICTIF",
  dateLabel: "18 JUIN 2026",
  timeLabel: "21:00",
  venueLabel: "STADE HÔTE · DÉMONSTRATION",
  homeTeam: {
    name: "FRANCE",
    shortName: "FRA",
    color: "blue"
  },
  awayTeam: {
    name: "BELGIQUE",
    shortName: "BEL",
    color: "red"
  },
  score: [2, 1],
  minute: "TERMINÉ",
  finalStatus: "MATCH TERMINÉ · RÉCIT EN COURS DE STABILISATION"
};

export const trackedSubjects: MatchTrackedSubject[] = [
  {
    id: "match-page",
    type: "match",
    label: "Page du match",
    reason: "Résultat, événements et résumé de la rencontre."
  },
  {
    id: "team-france",
    type: "team",
    label: "Sélection française",
    reason: "Résultat et progression dans le tournoi."
  },
  {
    id: "team-belgique",
    type: "team",
    label: "Sélection belge",
    reason: "Résultat et progression dans le tournoi."
  },
  {
    id: "player-red-card",
    type: "player",
    label: "Joueur concerné par l’expulsion",
    reason: "Traitement éventuel de l’incident."
  },
  {
    id: "tournament-page",
    type: "tournament",
    label: "Page du tournoi",
    reason: "Classement du groupe et résultat officiel."
  }
];

export const matchStories: MatchPublishedStory[] = [
  {
    id: "story-divergence",
    slug: "demo-divergence",
    type: "language_divergence",
    categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
    title: "Un même carton rouge. Trois traitements Wikipédia.",
    excerpt: "Après un incident fictif de fin de match, les éditions anglaise et espagnole ne retiennent pas exactement les mêmes éléments, tandis qu’aucune mention équivalente n’est observée dans l’édition française.",
    languages: ["EN", "ES", "FR"],
    timeLabel: "Publié après comparaison",
    statusLabel: "HISTOIRE VALIDÉE · DÉMONSTRATION",
    isDemo: true,
    featured: true
  },
  {
    id: "story-result",
    slug: "demo-result-entry",
    type: "fact_entry",
    categoryLabel: "UN FAIT ENTRE DANS WIKIPÉDIA",
    title: "Le résultat final apparaît dans trois éditions après le coup de sifflet.",
    excerpt: "Dans ce scénario fictif, les articles du match sont mis à jour successivement en anglais, en français puis en espagnol.",
    languages: ["EN", "FR", "ES"],
    timeLabel: "Après le match",
    statusLabel: "HISTOIRE VALIDÉE · DÉMONSTRATION",
    isDemo: true
  },
  {
    id: "story-instability",
    slug: "demo-instability",
    type: "article_instability",
    categoryLabel: "ARTICLE INSTABLE",
    title: "Une mention de l’incident retirée puis réintroduite sur l’article anglais.",
    excerpt: "Le même passage fictif est ajouté, supprimé puis restauré avec une source dans une seule édition linguistique.",
    languages: ["EN"],
    timeLabel: "Après le match",
    statusLabel: "HISTOIRE VALIDÉE · DÉMONSTRATION",
    isDemo: true
  }
];

export const matchTimeline: MatchTimelineItem[] = [
  {
    id: "event-goal-1",
    time: "34'",
    type: "match_event",
    title: "Premier but du match",
    description: "Événement sportif fictif servant de contexte à l’interface.",
    sourceStatus: "official_event_demo"
  },
  {
    id: "wiki-result-en",
    time: "22:41",
    type: "wikipedia_observation",
    languageCode: "EN",
    title: "L’édition anglaise ajoute le score final",
    description: "La page fictive du match intègre le résultat.",
    sourceStatus: "wikipedia_demo"
  },
  {
    id: "event-red-card",
    time: "87'",
    type: "match_event",
    title: "Carton rouge en fin de rencontre",
    description: "Incident fictif servant à démontrer une comparaison entre éditions.",
    sourceStatus: "official_event_demo"
  },
  {
    id: "wiki-incident-en",
    time: "22:48",
    type: "wikipedia_observation",
    languageCode: "EN",
    title: "L’édition anglaise mentionne l’altercation",
    description: "L’article fictif ajoute l’incident et la sanction.",
    sourceStatus: "wikipedia_demo"
  },
  {
    id: "wiki-incident-es",
    time: "22:52",
    type: "wikipedia_observation",
    languageCode: "ES",
    title: "L’édition espagnole mentionne la sanction",
    description: "Le carton rouge apparaît, sans mention équivalente de l’altercation.",
    sourceStatus: "wikipedia_demo"
  },
  {
    id: "wiki-incident-fr",
    time: "23:03",
    type: "wikipedia_observation",
    languageCode: "FR",
    title: "Aucune mention équivalente détectée en français",
    description: "La version fictive observée ne contient pas de passage comparable.",
    sourceStatus: "wikipedia_demo"
  },
  {
    id: "published-divergence",
    time: "23:20",
    type: "published_story",
    title: "WikiMatch publie une comparaison",
    description: "Une divergence observable est documentée entre les trois éditions fictives.",
    sourceStatus: "published_demo"
  }
];

export const matchComparison: MatchLanguageComparison = {
  eventLabel: "INCIDENT DE FIN DE MATCH · SCÉNARIO FICTIF",
  rows: [
    {
      observation: "Carton rouge mentionné",
      EN: "Oui",
      ES: "Oui",
      FR: "Non détecté"
    },
    {
      observation: "Altercation mentionnée",
      EN: "Oui",
      ES: "Non détecté",
      FR: "Non détecté"
    },
    {
      observation: "Source observée",
      EN: "Oui",
      ES: "Oui",
      FR: "—"
    },
    {
      observation: "Dernier état",
      EN: "Présent",
      ES: "Présent",
      FR: "Absent"
    }
  ],
  conclusion: "Les éditions comparées ne retiennent pas encore les mêmes éléments du même épisode fictif.",
  limitation: "Cette différence n’indique ni l’opinion d’un pays, ni l’intention des contributeurs."
};

export const demoInstability: ArticleInstabilityCase = {
  id: "instability-en-player",
  languageCode: "EN",
  articleLabel: "Article du joueur · édition anglaise",
  sectionLabel: "Section : carrière internationale",
  statusLabel: "INSTABILITÉ OBSERVÉE · DÉMONSTRATION",
  events: [
    {
      time: "22:48",
      action: "added",
      description: "Mention de l’altercation ajoutée."
    },
    {
      time: "22:51",
      action: "removed",
      description: "Mention supprimée."
    },
    {
      time: "22:56",
      action: "restored",
      description: "Mention réintroduite."
    },
    {
      time: "23:03",
      action: "sourced",
      description: "Formulation révisée avec une source."
    }
  ],
  observation: "Sur un même article fictif, le passage relatif à l’incident apparaît, disparaît puis revient sous une formulation sourcée.",
  limitation: "Cette séquence montre une instabilité éditoriale observable. Elle ne permet pas, seule, d’expliquer les motivations des contributeurs."
};

export const demoRecap: MatchRecap = {
  title: "Ce que ce match a laissé dans Wikipédia",
  summary: "Dans ce scénario fictif, le résultat final apparaît dans plusieurs éditions, tandis qu’un incident de fin de rencontre reçoit des traitements différents selon les articles comparés.",
  storyCount: 3,
  comparedEditions: ["EN", "ES", "FR"],
  stableFactsCount: 1,
  instabilityCount: 1,
  keyTakeaway: "Un fait converge. Un épisode reste raconté différemment."
};
