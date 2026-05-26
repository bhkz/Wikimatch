import {
  MatchesArchiveStats,
  TrackedMatchCard,
  MatchDayGroup,
} from "./types";

export const matchesStats: MatchesArchiveStats = {
  trackedMatches: 12,
  dossiersPublished: 3,
  upcomingMatches: 7,
  comparedEditions: 8,
  isDemo: true
};

export const featuredMatch: TrackedMatchCard = {
  id: "demo-france-belgique",
  slug: "demo-france-belgique",
  dateLabel: "18 JUIN 2026",
  timeLabel: "TERMINÉ · SCÉNARIO FICTIF",
  stage: "group_stage",
  stageLabel: "PHASE DE GROUPES",
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
  status: "completed_with_stories",
  statusLabel: "DOSSIER PUBLIÉ · DÉMONSTRATION",
  score: [2, 1],
  isDemo: true,
  monitoredSubjects: [
    "Page du match",
    "Sélection française",
    "Sélection belge",
    "Joueur concerné par l’expulsion",
    "Page du tournoi"
  ],
  storyCount: 3,
  languagesCompared: ["EN", "ES", "FR"],
  storyTypes: [
    "fact_entry",
    "language_divergence",
    "article_instability"
  ],
  editorialSummary: "Un résultat converge dans plusieurs éditions. Un incident de fin de match reçoit trois traitements différents. Un article anglais reste momentanément instable.",
  availableRoute: "/match/demo-france-belgique"
};

export const matchDayUpcoming: MatchDayGroup = {
  id: "day-june-11",
  dateLabel: "11 JUIN 2026",
  phaseLabel: "PHASE DE GROUPES · JOUR 1",
  matches: [
    {
      id: "demo-mexico-south-africa",
      slug: "demo-mexico-south-africa",
      dateLabel: "11 JUIN 2026",
      timeLabel: "21:00 · HORAIRE FICTIF",
      stage: "group_stage",
      stageLabel: "PHASE DE GROUPES",
      homeTeam: {
        name: "MEXIQUE",
        shortName: "MEX",
        color: "green"
      },
      awayTeam: {
        name: "AFRIQUE DU SUD",
        shortName: "RSA",
        color: "yellow"
      },
      status: "upcoming",
      statusLabel: "À SUIVRE · DÉMONSTRATION",
      isDemo: true,
      monitoredSubjects: [
        "Page du match",
        "Sélections",
        "Joueurs décisifs",
        "Page du tournoi"
      ],
      editorialSummary: "Au coup d’envoi, WikiMatch surveillera les articles liés à cette rencontre afin d’identifier les changements substantiels."
    },
    {
      id: "demo-japan-senegal",
      slug: "demo-japan-senegal",
      dateLabel: "11 JUIN 2026",
      timeLabel: "18:00 · HORAIRE FICTIF",
      stage: "group_stage",
      stageLabel: "PHASE DE GROUPES",
      homeTeam: {
        name: "JAPON",
        shortName: "JPN",
        color: "red"
      },
      awayTeam: {
        name: "SÉNÉGAL",
        shortName: "SEN",
        color: "green"
      },
      status: "upcoming",
      statusLabel: "À SUIVRE · DÉMONSTRATION",
      isDemo: true,
      monitoredSubjects: [
        "Page du match",
        "Éditions japonaise, française et anglaise",
        "Joueurs sélectionnés"
      ],
      editorialSummary: "Un match potentiellement intéressant pour observer l’émergence d’un sujet dans une édition linguistique avant les autres."
    }
  ]
};

export const matchDayObserving: MatchDayGroup = {
  id: "day-june-20",
  dateLabel: "20 JUIN 2026",
  phaseLabel: "PHASE DE GROUPES · JOUR 2",
  matches: [
    {
      id: "demo-morocco-croatia",
      slug: "demo-morocco-croatia",
      dateLabel: "20 JUIN 2026",
      timeLabel: "74' · SCÉNARIO FICTIF",
      stage: "group_stage",
      stageLabel: "PHASE DE GROUPES",
      homeTeam: {
        name: "MAROC",
        shortName: "MAR",
        color: "red"
      },
      awayTeam: {
        name: "CROATIE",
        shortName: "CRO",
        color: "blue"
      },
      status: "observing",
      statusLabel: "EN OBSERVATION · DÉMONSTRATION",
      score: [1, 0],
      isDemo: true,
      monitoredSubjects: [
        "Page du match",
        "Deux sélections",
        "Buteur",
        "Page du groupe"
      ],
      languagesCompared: ["AR", "FR", "EN", "ES"],
      editorialSummary: "Des pages suivies ont changé. Aucune histoire n’est publiée tant qu’un changement substantiel n’est pas vérifié."
    }
  ]
};

export const matchDayPublished: MatchDayGroup = {
  id: "day-june-18",
  dateLabel: "18 JUIN 2026",
  phaseLabel: "PHASE DE GROUPES · DOSSIERS PUBLIÉS",
  matches: [
    featuredMatch,
    {
      id: "demo-portugal-uruguay",
      slug: "demo-portugal-uruguay",
      dateLabel: "24 JUIN 2026",
      timeLabel: "TERMINÉ · SCÉNARIO FICTIF",
      stage: "group_stage",
      stageLabel: "PHASE DE GROUPES",
      homeTeam: {
        name: "PORTUGAL",
        shortName: "POR",
        color: "red"
      },
      awayTeam: {
        name: "URUGUAY",
        shortName: "URU",
        color: "blue"
      },
      status: "completed_with_stories",
      statusLabel: "DOSSIER PUBLIÉ · DÉMONSTRATION",
      score: [3, 1],
      isDemo: true,
      monitoredSubjects: [
        "Page du match",
        "Sélections",
        "Buteur",
        "Record individuel"
      ],
      storyCount: 1,
      languagesCompared: ["PT", "EN", "ES"],
      storyTypes: ["language_convergence"],
      editorialSummary: "Un record fictif apparaît d’abord dans l’édition portugaise avant d’être ajouté dans deux autres éditions."
    },
    {
      id: "demo-canada-ghana",
      slug: "demo-canada-ghana",
      dateLabel: "29 JUIN 2026",
      timeLabel: "TERMINÉ · SCÉNARIO FICTIF",
      stage: "group_stage",
      stageLabel: "PHASE DE GROUPES",
      homeTeam: {
        name: "CANADA",
        shortName: "CAN",
        color: "red"
      },
      awayTeam: {
        name: "GHANA",
        shortName: "GHA",
        color: "yellow"
      },
      status: "completed_without_story",
      statusLabel: "AUCUNE HISTOIRE PUBLIÉE · DÉMONSTRATION",
      score: [0, 0],
      isDemo: true,
      monitoredSubjects: [
        "Page du match",
        "Sélections",
        "Page du groupe"
      ],
      storyCount: 0,
      editorialSummary: "Des modifications ont pu être observées, mais aucun changement suffisamment significatif n’a été retenu pour publication."
    }
  ]
};

export const knockoutMatches: MatchDayGroup = {
  id: "knockout-demo",
  dateLabel: "JUILLET 2026",
  phaseLabel: "PHASE FINALE · SCÉNARIOS FICTIFS",
  matches: [
    {
      id: "demo-semi-final",
      slug: "demo-semi-final",
      dateLabel: "14 JUILLET 2026",
      timeLabel: "21:00 · HORAIRE FICTIF",
      stage: "semi_final",
      stageLabel: "DEMI-FINALE",
      homeTeam: {
        name: "ARGENTINE",
        shortName: "ARG",
        color: "blue"
      },
      awayTeam: {
        name: "ALLEMAGNE",
        shortName: "GER",
        color: "black"
      },
      status: "upcoming",
      statusLabel: "À SUIVRE · DÉMONSTRATION",
      isDemo: true,
      monitoredSubjects: [
        "Page du match",
        "Sélections",
        "Joueurs clés",
        "Page du tournoi"
      ],
      editorialSummary: "Une rencontre fictive préparée pour comparer les traitements d’un éventuel événement décisif."
    },
    {
      id: "demo-final",
      slug: "demo-final",
      dateLabel: "19 JUILLET 2026",
      timeLabel: "21:00 · HORAIRE FICTIF",
      stage: "final",
      stageLabel: "FINALE",
      homeTeam: {
        name: "FINALISTE A",
        shortName: "A",
        color: "blue"
      },
      awayTeam: {
        name: "FINALISTE B",
        shortName: "B",
        color: "red"
      },
      status: "upcoming",
      statusLabel: "À SUIVRE · DÉMONSTRATION",
      isDemo: true,
      monitoredSubjects: [
        "Page de la finale",
        "Deux sélections",
        "Joueurs décisifs",
        "Palmarès",
        "Page du tournoi"
      ],
      editorialSummary: "Le match où un titre pourrait entrer dans plusieurs éditions de Wikipédia."
    }
  ]
};

export const allMatchesGroups = [
  matchDayPublished,
  matchDayObserving,
  matchDayUpcoming,
  knockoutMatches
];
