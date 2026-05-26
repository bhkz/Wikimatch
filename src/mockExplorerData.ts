import {
  ExplorerStats,
  ExplorerLegendItem,
  StoryGeoAnchor,
  ExplorerMatrixRow,
  ExplorerTimelineEvent
} from "./types";

export const explorerStats: ExplorerStats = {
  publishedStories: 12,
  mappedSubjects: 5,
  comparedEditions: 8,
  documentedMatches: 5,
  isDemo: true
};

export const explorerLegend: ExplorerLegendItem[] = [
  {
    type: "fact_entry",
    label: "Un fait entre",
    description: "Un résultat, un record ou un événement majeur apparaît dans Wikipédia.",
    colorToken: "yellow"
  },
  {
    type: "language_convergence",
    label: "Mise à jour convergente",
    description: "Plusieurs éditions intègrent le même fait.",
    colorToken: "blue"
  },
  {
    type: "language_divergence",
    label: "Divergence entre éditions",
    description: "Les articles comparés ne retiennent pas les mêmes éléments.",
    colorToken: "red"
  },
  {
    type: "article_instability",
    label: "Article instable",
    description: "Un passage est ajouté, retiré ou restauré sur un même article.",
    colorToken: "deep-red"
  },
  {
    type: "under_radar",
    label: "Sous le radar",
    description: "Un sujet est documenté dans une édition avant d’apparaître ailleurs.",
    colorToken: "green"
  },
  {
    type: "match_recap",
    label: "Récap match",
    description: "Un dossier rassemble les histoires validées d’une rencontre.",
    colorToken: "navy"
  }
];

export const storyGeoAnchors: StoryGeoAnchor[] = [
  {
    id: "anchor-japan-goalkeeper",
    storyId: "story-japan-goalkeeper",
    subjectLabel: "Ren Ito",
    subjectType: "player",
    geographyLabel: "Japon · joueur associé à la sélection fictive",
    latitude: 36.2,
    longitude: 138.2,
    type: "under_radar",
    title: "Le gardien suivi au Japon avant d’apparaître ailleurs.",
    excerpt: "L’édition japonaise documente une performance fictive absente des éditions anglaise et française observées.",
    languages: ["JA", "EN", "FR"],
    route: "/entity/demo-japan-goalkeeper",
    isDemo: true
  },
  {
    id: "anchor-morocco-qualification",
    storyId: "story-morocco-qualification",
    subjectLabel: "Sélection marocaine",
    subjectType: "team",
    geographyLabel: "Maroc · sélection concernée",
    latitude: 31.8,
    longitude: -7.1,
    type: "language_convergence",
    title: "La qualification du Maroc apparaît dans quatre éditions en quinze minutes.",
    excerpt: "Un même fait fictif est intégré successivement en anglais, français, arabe et espagnol.",
    languages: ["EN", "FR", "AR", "ES"],
    isDemo: true
  },
  {
    id: "anchor-portugal-record",
    storyId: "story-striker-record",
    subjectLabel: "Attaquant portugais fictif",
    subjectType: "player",
    geographyLabel: "Portugal · sélection associée au sujet",
    latitude: 39.5,
    longitude: -8.0,
    type: "fact_entry",
    title: "Un record de buts entre d’abord dans l’édition portugaise.",
    excerpt: "La mention fictive du record apparaît sur l’article portugais avant deux autres éditions.",
    languages: ["PT", "EN", "ES"],
    isDemo: true
  },
  {
    id: "anchor-ghana-team",
    storyId: "story-local-edition-team",
    subjectLabel: "Sélection ghanéenne fictive",
    subjectType: "team",
    geographyLabel: "Ghana · sélection concernée",
    latitude: 7.9,
    longitude: -1.0,
    type: "under_radar",
    title: "Une sélection progresse dans son édition locale avant d’être documentée ailleurs.",
    excerpt: "La page fictive d’une sélection est enrichie localement avant les éditions comparées.",
    languages: ["EN", "FR"],
    isDemo: true
  },
  {
    id: "anchor-champion-team",
    storyId: "story-title-entry",
    subjectLabel: "Sélection championne fictive",
    subjectType: "team",
    geographyLabel: "Ancrage de démonstration · sélection finaliste fictive",
    latitude: -34.0,
    longitude: -64.0,
    type: "fact_entry",
    title: "La mention de champion du monde apparaît après la finale.",
    excerpt: "Un titre fictif entre dans plusieurs articles après le coup de sifflet final.",
    languages: ["EN", "FR", "ES", "PT"],
    isDemo: true
  }
];

export const unmappedStories = [
  {
    id: "demo-divergence-001",
    label: "STORY MULTI-SUJETS",
    title: "Un même carton rouge. Trois traitements Wikipédia.",
    reason: "Cette histoire compare plusieurs articles liés à un même match ; elle n’est pas représentée par un unique point géographique.",
    route: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "story-recap-fr-bel",
    label: "DOSSIER MATCH",
    title: "France — Belgique : un résultat converge, un incident diverge.",
    reason: "Un dossier de match ne correspond pas à un seul sujet géographique.",
    route: "/match/demo-france-belgique",
    isDemo: true
  }
];

export const explorerMatrixRows: ExplorerMatrixRow[] = [
  {
    id: "matrix-red-card",
    storyId: "demo-divergence-001",
    topicLabel: "Incident de fin de match · carton rouge",
    matchLabel: "France — Belgique · scénario fictif",
    type: "language_divergence",
    languages: {
      EN: {
        status: "present",
        shortText: "Altercation + sanction"
      },
      ES: {
        status: "present",
        shortText: "Sanction uniquement"
      },
      FR: {
        status: "not_detected",
        shortText: "Aucune mention équivalente"
      }
    } as ExplorerMatrixRow["languages"],
    conclusion: "Les éditions comparées ne retiennent pas les mêmes éléments du même épisode fictif.",
    route: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "matrix-morocco-qualification",
    storyId: "story-morocco-qualification",
    topicLabel: "Qualification de la sélection marocaine",
    matchLabel: "Maroc — Croatie · scénario fictif",
    type: "language_convergence",
    languages: {
      EN: {
        status: "convergent",
        shortText: "Mention ajoutée"
      },
      FR: {
        status: "convergent",
        shortText: "Mention ajoutée"
      },
      AR: {
        status: "convergent",
        shortText: "Mention ajoutée"
      },
      ES: {
        status: "convergent",
        shortText: "Mention ajoutée"
      }
    } as ExplorerMatrixRow["languages"],
    conclusion: "Le même fait fictif apparaît dans quatre éditions linguistiques.",
    isDemo: true
  },
  {
    id: "matrix-japan-goalkeeper",
    storyId: "story-japan-goalkeeper",
    topicLabel: "Performance de Ren Ito",
    matchLabel: "Japon — Sénégal · scénario fictif",
    type: "under_radar",
    languages: {
      JA: {
        status: "present",
        shortText: "Performance documentée"
      },
      EN: {
        status: "not_detected",
        shortText: "Ajout non détecté"
      },
      FR: {
        status: "not_detected",
        shortText: "Ajout non détecté"
      }
    } as ExplorerMatrixRow["languages"],
    conclusion: "L’édition japonaise documente la performance avant les éditions anglaise et française observées.",
    route: "/entity/demo-japan-goalkeeper",
    isDemo: true
  },
  {
    id: "matrix-portugal-record",
    storyId: "story-striker-record",
    topicLabel: "Record individuel fictif",
    matchLabel: "Portugal — Uruguay · scénario fictif",
    type: "language_convergence",
    languages: {
      PT: {
        status: "convergent",
        shortText: "Mention initiale"
      },
      EN: {
        status: "convergent",
        shortText: "Ajout ultérieur"
      },
      ES: {
        status: "convergent",
        shortText: "Ajout ultérieur"
      }
    } as ExplorerMatrixRow["languages"],
    conclusion: "La mention fictive du record apparaît d’abord en portugais, puis converge dans deux autres éditions.",
    isDemo: true
  },
  {
    id: "matrix-article-instability",
    storyId: "story-article-instability",
    topicLabel: "Mention d’un incident sur un article",
    matchLabel: "France — Belgique · scénario fictif",
    type: "article_instability",
    languages: {
      EN: {
        status: "unstable",
        shortText: "Ajouté, retiré, restauré"
      },
      ES: {
        status: "not_compared",
        shortText: "Non concerné"
      },
      FR: {
        status: "not_compared",
        shortText: "Non concerné"
      }
    } as ExplorerMatrixRow["languages"],
    conclusion: "L’instabilité est observée sur un article anglais précis, pas entre les langues.",
    isDemo: true
  }
];

export const explorerTimelineEvents: ExplorerTimelineEvent[] = [
  {
    id: "timeline-fr-bel-divergence",
    dateLabel: "18 JUIN",
    order: 1,
    type: "language_divergence",
    categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
    title: "Un même carton rouge. Trois traitements Wikipédia.",
    matchLabel: "France — Belgique",
    languages: ["EN", "ES", "FR"],
    route: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "timeline-fr-bel-instability",
    dateLabel: "18 JUIN",
    order: 2,
    type: "article_instability",
    categoryLabel: "ARTICLE INSTABLE",
    title: "Une mention retirée puis réintroduite sur un article anglais.",
    matchLabel: "France — Belgique",
    languages: ["EN"],
    route: "/match/demo-france-belgique",
    isDemo: true
  },
  {
    id: "timeline-morocco",
    dateLabel: "20 JUIN",
    order: 3,
    type: "language_convergence",
    categoryLabel: "MISE À JOUR CONVERGENTE",
    title: "La qualification du Maroc apparaît dans quatre éditions.",
    matchLabel: "Maroc — Croatie",
    languages: ["EN", "FR", "AR", "ES"],
    isDemo: true
  },
  {
    id: "timeline-japan",
    dateLabel: "22 JUIN",
    order: 4,
    type: "under_radar",
    categoryLabel: "SOUS LE RADAR",
    title: "Le gardien suivi au Japon avant d’apparaître ailleurs.",
    matchLabel: "Japon — Sénégal",
    languages: ["JA", "EN", "FR"],
    route: "/entity/demo-japan-goalkeeper",
    isDemo: true
  },
  {
    id: "timeline-portugal",
    dateLabel: "24 JUIN",
    order: 5,
    type: "fact_entry",
    categoryLabel: "UN FAIT ENTRE",
    title: "Un record fictif apparaît d’abord dans l’édition portugaise.",
    matchLabel: "Portugal — Uruguay",
    languages: ["PT", "EN", "ES"],
    isDemo: true
  },
  {
    id: "timeline-final",
    dateLabel: "19 JUILLET",
    order: 6,
    type: "match_recap",
    categoryLabel: "FINALE · RÉCAP",
    title: "La mention de champion du monde apparaît après la finale.",
    matchLabel: "Finale · scénario fictif",
    languages: ["EN", "FR", "ES", "PT"],
    isDemo: true
  }
];