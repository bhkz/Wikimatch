import {
  ObservatoryPublicStats,
  ObservatoryPipelineStep,
  ObservatoryTrackedArticle,
  ObservatoryTrace,
  ObservatoryStorySourceChain
} from "./types";

export const observatoryStats: ObservatoryPublicStats = {
  observedTraces: 18,
  substantialChanges: 7,
  publishedStoryLinks: 3,
  monitoredArticles: 11,
  isDemo: true
};

export const publicPipelineSteps: ObservatoryPipelineStep[] = [
  {
    id: "observe",
    label: "Observer",
    publicDescription: "Une modification apparaît sur un article suivi.",
    publicStatus: "shown_here"
  },
  {
    id: "read",
    label: "Lire le changement",
    publicDescription: "Le passage ajouté ou retiré devient consultable.",
    publicStatus: "shown_here"
  },
  {
    id: "qualify",
    label: "Qualifier",
    publicDescription: "Le changement est décrit comme mineur, substantiel ou relié à une histoire publiée.",
    publicStatus: "shown_here"
  },
  {
    id: "compare",
    label: "Comparer",
    publicDescription: "Lorsque plusieurs articles sont concernés, leurs contenus peuvent être comparés.",
    publicStatus: "published_elsewhere"
  },
  {
    id: "publish",
    label: "Publier",
    publicDescription: "Seules les histoires validées rejoignent le Magazine public.",
    publicStatus: "published_elsewhere"
  },
  {
    id: "review",
    label: "Revue interne",
    publicDescription: "La validation éditoriale détaillée appartient au futur Desk privé.",
    publicStatus: "private_later"
  }
];

export const trackedArticles: ObservatoryTrackedArticle[] = [
  {
    id: "article-fr-bel-match-en",
    languageCode: "EN",
    articleLabel: "Page du match · édition anglaise",
    entityLabel: "France — Belgique",
    articleType: "match",
    monitoringReason: "Résultat final et déroulé de la rencontre fictive.",
    latestStatusLabel: "Résultat ajouté · relié à une story",
    relatedMatchLabel: "France — Belgique",
    isDemo: true
  },
  {
    id: "article-fr-bel-player-en",
    languageCode: "EN",
    articleLabel: "Article du joueur · édition anglaise",
    entityLabel: "Joueur expulsé fictif",
    articleType: "player",
    monitoringReason: "Traitement éventuel de l’incident de fin de match.",
    latestStatusLabel: "Passage instable · relié à une story",
    relatedMatchLabel: "France — Belgique",
    isDemo: true
  },
  {
    id: "article-fr-bel-player-es",
    languageCode: "ES",
    articleLabel: "Article du joueur · édition espagnole",
    entityLabel: "Joueur expulsé fictif",
    articleType: "player",
    monitoringReason: "Comparaison du traitement de la sanction.",
    latestStatusLabel: "Sanction ajoutée · reliée à une story",
    relatedMatchLabel: "France — Belgique",
    isDemo: true
  },
  {
    id: "article-fr-bel-player-fr",
    languageCode: "FR",
    articleLabel: "Article du joueur · édition française",
    entityLabel: "Joueur expulsé fictif",
    articleType: "player",
    monitoringReason: "Comparaison avec les autres éditions observées.",
    latestStatusLabel: "Aucune mention équivalente détectée",
    relatedMatchLabel: "France — Belgique",
    isDemo: true
  },
  {
    id: "article-ren-ito-ja",
    languageCode: "JA",
    articleLabel: "Article de Ren Ito · édition japonaise",
    entityLabel: "Ren Ito · personnage fictif",
    articleType: "player",
    monitoringReason: "Documentation d’une performance fictive sous le radar.",
    latestStatusLabel: "Performance ajoutée · reliée à une story",
    relatedMatchLabel: "Japon — Sénégal",
    isDemo: true
  },
  {
    id: "article-ren-ito-en",
    languageCode: "EN",
    articleLabel: "Article de Ren Ito · édition anglaise",
    entityLabel: "Ren Ito · personnage fictif",
    articleType: "player",
    monitoringReason: "Comparaison avec l’article japonais.",
    latestStatusLabel: "Aucun ajout équivalent détecté",
    relatedMatchLabel: "Japon — Sénégal",
    isDemo: true
  },
  {
    id: "article-morocco-ar",
    languageCode: "AR",
    articleLabel: "Article de la sélection · édition arabe",
    entityLabel: "Sélection marocaine fictive",
    articleType: "team",
    monitoringReason: "Apparition d’une qualification fictive.",
    latestStatusLabel: "Qualification ajoutée · substantiel",
    relatedMatchLabel: "Maroc — Croatie",
    isDemo: true
  }
];

export const publicTraces: ObservatoryTrace[] = [
  {
    id: "trace-incident-en-added",
    observedAtLabel: "22:48:09",
    languageCode: "EN",
    languageLabel: "Édition anglaise",
    articleType: "player",
    articleLabel: "Article du joueur · édition anglaise",
    entityLabel: "Joueur expulsé fictif",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "International career",
    changeKind: "incident_mention_added",
    changeStatus: "linked_to_published_story",
    statusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    summary: "Ajout d’une mention de l’altercation et du carton rouge.",
    addedText: "He was sent off after an altercation with an opponent in the final minutes.",
    translatedText: "Il est expulsé après une altercation avec un adversaire dans les dernières minutes.",
    anonymizedContributorLabel: "Contributeur anonymisé",
    relatedStoryId: "demo-divergence-001",
    relatedStoryTitle: "Un même carton rouge. Trois traitements Wikipédia.",
    relatedStoryRoute: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "trace-sanction-es",
    observedAtLabel: "22:52:17",
    languageCode: "ES",
    languageLabel: "Édition espagnole",
    articleType: "player",
    articleLabel: "Article del jugador · edición española",
    entityLabel: "Joueur expulsé fictif",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "Selección nacional",
    changeKind: "sanction_added",
    changeStatus: "linked_to_published_story",
    statusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    summary: "Ajout du carton rouge sans mention équivalente de l’altercation.",
    addedText: "Fue expulsado en los últimos minutos del encuentro.",
    translatedText: "Il est expulsé dans les dernières minutes de la rencontre.",
    anonymizedContributorLabel: "Contributeur anonymisé",
    relatedStoryId: "demo-divergence-001",
    relatedStoryTitle: "Un même carton rouge. Trois traitements Wikipédia.",
    relatedStoryRoute: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "trace-no-equivalent-fr",
    observedAtLabel: "23:03:42",
    languageCode: "FR",
    languageLabel: "Édition française",
    articleType: "player",
    articleLabel: "Article du joueur · édition française",
    entityLabel: "Joueur expulsé fictif",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "Carrière internationale",
    changeKind: "no_equivalent_detected",
    changeStatus: "linked_to_published_story",
    statusLabel: "ÉTAT COMPARÉ · RELIÉ À UNE HISTOIRE",
    summary: "Aucune mention équivalente de l’incident n’est détectée dans la version observée.",
    anonymizedContributorLabel: "Non applicable · état comparé",
    relatedStoryId: "demo-divergence-001",
    relatedStoryTitle: "Un même carton rouge. Trois traitements Wikipédia.",
    relatedStoryRoute: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "trace-incident-en-removed",
    observedAtLabel: "22:51:34",
    languageCode: "EN",
    languageLabel: "Édition anglaise",
    articleType: "player",
    articleLabel: "Article du joueur · édition anglaise",
    entityLabel: "Joueur expulsé fictif",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "International career",
    changeKind: "wording_removed",
    changeStatus: "linked_to_published_story",
    statusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    summary: "Suppression du passage précédemment ajouté.",
    removedText: "He was sent off after an altercation with an opponent in the final minutes.",
    translatedText: "Passage supprimé : il est expulsé après une altercation avec un adversaire dans les dernières minutes.",
    anonymizedContributorLabel: "Contributeur anonymisé",
    relatedStoryId: "story-article-instability",
    relatedStoryTitle: "Une mention retirée puis réintroduite sur l’article anglais.",
    relatedStoryRoute: "/match/demo-france-belgique",
    isDemo: true
  },
  {
    id: "trace-minor-formatting",
    observedAtLabel: "22:36:04",
    languageCode: "FR",
    languageLabel: "Édition française",
    articleType: "tournament",
    articleLabel: "Page du tournoi · édition française",
    entityLabel: "Coupe du monde 2026 · scénario fictif",
    sectionLabel: "Présentation",
    changeKind: "formatting",
    changeStatus: "minor",
    statusLabel: "MINEUR · NON PUBLIÉ",
    summary: "Correction de ponctuation dans une phrase descriptive.",
    addedText: "… organisée en 2026.",
    removedText: "… organisée en 2026",
    anonymizedContributorLabel: "Contributeur anonymisé",
    isDemo: true
  },
  {
    id: "trace-ren-ito-ja",
    observedAtLabel: "22:21:07",
    languageCode: "JA",
    languageLabel: "Édition japonaise",
    articleType: "player",
    articleLabel: "Article de Ren Ito · édition japonaise",
    entityLabel: "Ren Ito · personnage fictif",
    matchLabel: "Japon — Sénégal · scénario fictif",
    sectionLabel: "International career",
    changeKind: "performance_added",
    changeStatus: "linked_to_published_story",
    statusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    summary: "Ajout d’une performance fictive et d’un arrêt décisif.",
    addedText: "試合終盤に決定的なセーブを記録し、代表の結果に貢献した。",
    translatedText: "Il réalise un arrêt décisif en fin de match et contribue au résultat de sa sélection.",
    anonymizedContributorLabel: "Contributeur anonymisé",
    relatedStoryId: "story-japan-goalkeeper",
    relatedStoryTitle: "Le gardien suivi au Japon avant d’apparaître ailleurs.",
    relatedStoryRoute: "/entity/demo-japan-goalkeeper",
    isDemo: true
  },
  {
    id: "trace-morocco-ar",
    observedAtLabel: "22:58:55",
    languageCode: "AR",
    languageLabel: "Édition arabe",
    articleType: "team",
    articleLabel: "Article de la sélection · édition arabe",
    entityLabel: "Sélection marocaine fictive",
    matchLabel: "Maroc — Croatie · scénario fictif",
    sectionLabel: "Coupe du monde 2026",
    changeKind: "result_added",
    changeStatus: "substantive",
    statusLabel: "SUBSTANTIEL · HISTOIRE NON OUVERTE DANS LA DÉMO",
    summary: "Ajout fictif de la qualification de la sélection.",
    addedText: "تأهل المنتخب إلى الدور التالي من البطولة.",
    translatedText: "La sélection se qualifie pour le tour suivant du tournoi.",
    anonymizedContributorLabel: "Contributeur anonymisé",
    isDemo: true
  },
  {
    id: "trace-minor-link",
    observedAtLabel: "23:06:21",
    languageCode: "EN",
    languageLabel: "Édition anglaise",
    articleType: "team",
    articleLabel: "Article de la sélection · édition anglaise",
    entityLabel: "Belgique · scénario fictif",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "Squad",
    changeKind: "formatting",
    changeStatus: "minor",
    statusLabel: "MINEUR · NON PUBLIÉ",
    summary: "Correction d’un lien interne sans modification narrative détectée.",
    addedText: "[[Player name]]",
    removedText: "Player name",
    anonymizedContributorLabel: "Contributeur anonymisé",
    isDemo: true
  },
  {
    id: "trace-result-en",
    observedAtLabel: "22:41:12",
    languageCode: "EN",
    languageLabel: "Édition anglaise",
    articleType: "match",
    articleLabel: "Page du match · édition anglaise",
    entityLabel: "France — Belgique",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "Match summary",
    changeKind: "result_added",
    changeStatus: "linked_to_published_story",
    statusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    summary: "Ajout du résultat final dans la page fictive du match.",
    addedText: "France won the match 2–1 against Belgium.",
    translatedText: "La France remporte le match 2–1 face à la Belgique.",
    anonymizedContributorLabel: "Contributeur anonymisé",
    relatedStoryId: "story-result-final",
    relatedStoryTitle: "Le résultat final apparaît dans trois éditions après le coup de sifflet.",
    isDemo: true
  },
  {
    id: "trace-incident-en-restored",
    observedAtLabel: "23:03:10",
    languageCode: "EN",
    languageLabel: "Édition anglaise",
    articleType: "player",
    articleLabel: "Article du joueur · édition anglaise",
    entityLabel: "Joueur expulsé fictif",
    matchLabel: "France — Belgique · scénario fictif",
    sectionLabel: "International career",
    changeKind: "source_added",
    changeStatus: "linked_to_published_story",
    statusLabel: "RELIÉ À UNE HISTOIRE PUBLIÉE",
    summary: "Réintroduction de la mention sous une formulation sourcée.",
    addedText: "He received a red card following an incident late in the match.[source]",
    translatedText: "Il reçoit un carton rouge à la suite d’un incident en fin de match. [source]",
    anonymizedContributorLabel: "Contributeur anonymisé",
    relatedStoryId: "story-article-instability",
    relatedStoryTitle: "Une mention retirée puis réintroduite sur l’article anglais.",
    relatedStoryRoute: "/match/demo-france-belgique",
    isDemo: true
  }
];

export const featuredSourceChain: ObservatoryStorySourceChain = {
  storyId: "demo-divergence-001",
  storyTitle: "Un même carton rouge. Trois traitements Wikipédia.",
  storyRoute: "/story/demo-divergence",
  categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
  traceIds: [
    "trace-incident-en-added",
    "trace-sanction-es",
    "trace-no-equivalent-fr"
  ],
  observation: "L’édition anglaise mentionne une altercation et une sanction. L’édition espagnole mentionne la sanction uniquement. Aucune mention équivalente n’est observée dans l’édition française fictive au moment de la comparaison.",
  limitation: "Cette comparaison décrit trois articles fictifs observés. Elle ne permet pas d’inférer l’opinion d’un pays ou les motivations de contributeurs.",
  isDemo: true
};
