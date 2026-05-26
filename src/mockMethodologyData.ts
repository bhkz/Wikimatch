import {
  MethodologyDefinition,
  MethodologyPipelineStep,
  MethodologyCaseStudy,
  MethodologyComparisonRule,
  MethodologyPrivacyPrinciple,
  MethodologyAiRule,
  MethodologyLimitation,
  MethodologyFAQItem,
  MethodologyVersionEntry,
  PublicationCriterion
} from "./types";

export const methodologyDefinitions: MethodologyDefinition[] = [
  {
    id: "entity",
    term: "SUJET",
    shortDefinition: "Le joueur, l’équipe, le match ou la compétition dont on parle.",
    fullDefinition: "Un sujet regroupe ce qui désigne la même réalité footballistique à travers plusieurs éditions linguistiques.",
    example: "Ren Ito, personnage fictif, est un sujet."
  },
  {
    id: "article",
    term: "ARTICLE",
    shortDefinition: "Une page Wikipédia précise dans une édition linguistique précise.",
    fullDefinition: "L’article français, anglais ou japonais d’un même joueur sont des pages distinctes, susceptibles d’évoluer différemment.",
    example: "L’article japonais fictif de Ren Ito est différent de son article anglais fictif."
  },
  {
    id: "trace",
    term: "TRACE",
    shortDefinition: "Une modification observée sur un article suivi.",
    fullDefinition: "Une trace peut être mineure, substantielle ou reliée à une histoire publiée. Elle ne constitue jamais automatiquement une story.",
    example: "L’ajout fictif d’une performance dans l’article japonais est une trace."
  },
  {
    id: "story",
    term: "HISTOIRE",
    shortDefinition: "Un récit public construit à partir de traces comprises et vérifiables.",
    fullDefinition: "Une histoire explique ce qui change, ce que l’on peut lire et ce que l’on ne peut pas conclure.",
    example: "Le gardien suivi au Japon avant d’apparaître ailleurs."
  }
];

export const methodologyPipeline: MethodologyPipelineStep[] = [
  {
    id: "scope",
    number: "01",
    label: "PÉRIMÈTRE",
    title: "Définir ce qui est suivi",
    description: "Pour un match, WikiMatch sélectionne les articles pertinents : page de la rencontre, équipes, joueurs concernés et page du tournoi.",
    visibleIn: "observatory",
    statusLabel: "VISIBLE DANS L’OBSERVATOIRE"
  },
  {
    id: "observe",
    number: "02",
    label: "TRACE",
    title: "Observer une modification",
    description: "Une modification apparaît sur un article suivi. Elle est une trace, pas encore une histoire.",
    visibleIn: "observatory",
    statusLabel: "VISIBLE DANS L’OBSERVATOIRE"
  },
  {
    id: "read",
    number: "03",
    label: "CONTENU",
    title: "Lire ce qui change réellement",
    description: "Le passage ajouté ou retiré est inspecté afin de distinguer une correction mineure d’un changement de contenu.",
    visibleIn: "observatory",
    statusLabel: "VISIBLE DANS L’OBSERVATOIRE"
  },
  {
    id: "compare",
    number: "04",
    label: "COMPARAISON",
    title: "Comparer seulement ce qui est comparable",
    description: "Lorsque plusieurs articles portent sur le même fait, leurs formulations et présences peuvent être comparées.",
    visibleIn: "magazine",
    statusLabel: "VISIBLE DANS LES STORIES PUBLIÉES"
  },
  {
    id: "review",
    number: "05",
    label: "VALIDATION",
    title: "Vérifier avant publication",
    description: "Une histoire publique exige une revue éditoriale : preuve, formulation prudente, limites et sources.",
    visibleIn: "desk_private",
    statusLabel: "DESK PRIVÉ FUTUR"
  },
  {
    id: "publish",
    number: "06",
    label: "PUBLICATION",
    title: "Publier une histoire documentée",
    description: "La story rejoint le Magazine, les dossiers Match, Explorer et ses sources publiques dans l’Observatoire.",
    visibleIn: "magazine",
    statusLabel: "VISIBLE PUBLIQUEMENT"
  }
];

export const methodologyCases: MethodologyCaseStudy[] = [
  {
    id: "case-divergence",
    type: "language_divergence",
    categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
    title: "Un même carton rouge. Trois traitements Wikipédia.",
    observation: "Dans le scénario fictif, l’édition anglaise mentionne une altercation et une sanction, l’édition espagnole la sanction uniquement, et aucune mention équivalente n’est détectée dans l’édition française observée.",
    interpretation: "Les articles comparés ne retiennent pas encore les mêmes éléments du même épisode.",
    limitation: "Cette différence ne permet pas de déduire l’opinion des publics, des pays ou des contributeurs.",
    route: "/story/demo-divergence",
    isDemo: true
  },
  {
    id: "case-instability",
    type: "article_instability",
    categoryLabel: "ARTICLE INSTABLE",
    title: "Une mention ajoutée, retirée puis restaurée.",
    observation: "Sur un seul article anglais fictif, le même passage est ajouté, retiré puis réintroduit avec une source.",
    interpretation: "L’article ne se stabilise pas immédiatement sur ce passage.",
    limitation: "Cette séquence ne permet pas d’expliquer les motivations des contributeurs.",
    route: "/match/demo-france-belgique",
    isDemo: true
  },
  {
    id: "case-under-radar",
    type: "under_radar",
    categoryLabel: "SOUS LE RADAR",
    title: "Le gardien suivi au Japon avant d’apparaître ailleurs.",
    observation: "L’article japonais fictif de Ren Ito contient plusieurs ajouts substantiels absents des versions anglaise et française observées.",
    interpretation: "Un décalage de documentation est visible entre les articles comparés.",
    limitation: "Ce décalage n’indique ni un désintérêt volontaire ailleurs, ni une différence d’opinion nationale.",
    route: "/entity/demo-japan-goalkeeper",
    isDemo: true
  }
];

export const comparisonRules: MethodologyComparisonRule[] = [
  {
    id: "language-country",
    incorrectAssumption: "L’édition française représente la France.",
    correctReading: "Elle est une édition linguistique consultable et modifiable depuis de nombreux endroits ; elle ne représente aucune population."
  },
  {
    id: "multilingual-tension",
    incorrectAssumption: "Si plusieurs langues modifient un sujet, il y a tension.",
    correctReading: "Plusieurs articles peuvent simplement intégrer la même information. Il faut comparer leur contenu avant toute conclusion."
  },
  {
    id: "absence-intent",
    incorrectAssumption: "Si une information manque dans une édition, elle est volontairement ignorée.",
    correctReading: "On peut seulement dire qu’aucune mention équivalente n’est détectée dans la version observée à cet instant."
  },
  {
    id: "timing-causality",
    incorrectAssumption: "Une modification après un but a été causée par ce but.",
    correctReading: "On peut rapprocher les événements dans le temps, mais pas affirmer automatiquement une causalité."
  },
  {
    id: "activity-story",
    incorrectAssumption: "Une page très modifiée est forcément intéressante.",
    correctReading: "Le volume seul ne dit pas si les changements concernent un fait substantiel, une correction ou du bruit."
  }
];

export const publicationCriteria: PublicationCriterion[] = [
  {
    id: "content",
    question: "Peut-on expliquer précisément ce qui a changé ?",
    acceptedAnswer: "Oui : un passage, un fait ou une différence identifiable est montrable.",
    rejectedExample: "Non : la page a seulement reçu plusieurs modifications."
  },
  {
    id: "proof",
    question: "Peut-on montrer les traces qui fondent l’histoire ?",
    acceptedAnswer: "Oui : les articles et passages observés sont reliés à la story.",
    rejectedExample: "Non : le récit repose uniquement sur un score automatique."
  },
  {
    id: "comparison",
    question: "La comparaison concerne-t-elle réellement le même fait ?",
    acceptedAnswer: "Oui : les articles comparés portent sur un épisode ou une information rapprochable.",
    rejectedExample: "Non : plusieurs langues ont simplement modifié le même joueur."
  },
  {
    id: "wording",
    question: "La formulation évite-t-elle la surinterprétation ?",
    acceptedAnswer: "Oui : elle distingue observation, lecture et limite.",
    rejectedExample: "Non : elle prête une opinion à un pays ou une intention aux contributeurs."
  },
  {
    id: "privacy",
    question: "La publication respecte-t-elle la protection des contributeurs ?",
    acceptedAnswer: "Oui : aucun auteur, IP ou lieu d’édition n’est exposé.",
    rejectedExample: "Non : l’histoire cherche à localiser ou profiler une personne."
  }
];

export const aiRules: MethodologyAiRule[] = [
  {
    id: "translation",
    task: "Proposer une traduction d’un extrait observé.",
    allowed: true,
    explanation: "Autorisé comme assistance de travail, avec vérification avant publication."
  },
  {
    id: "grouping",
    task: "Suggérer que plusieurs passages pourraient concerner le même fait.",
    allowed: true,
    explanation: "Autorisé comme piste d’analyse, jamais comme conclusion publique automatique."
  },
  {
    id: "summary",
    task: "Proposer un résumé interne d’une modification.",
    allowed: true,
    explanation: "Autorisé dans le futur Desk privé, puis vérifié humainement."
  },
  {
    id: "automatic-story",
    task: "Publier automatiquement une histoire au public.",
    allowed: false,
    explanation: "Interdit : une story publique doit passer par une validation éditoriale."
  },
  {
    id: "intent",
    task: "Déduire l’intention d’un contributeur ou l’opinion d’un public.",
    allowed: false,
    explanation: "Interdit : les traces observées ne permettent pas ce type de conclusion."
  },
  {
    id: "causality",
    task: "Affirmer qu’un événement sportif a causé une modification.",
    allowed: false,
    explanation: "Interdit sans preuve additionnelle ; seule la proximité temporelle peut être décrite."
  }
];

export const privacyPrinciples: MethodologyPrivacyPrinciple[] = [
  {
    id: "no-identification",
    title: "Aucune identification publique",
    description: "WikiMatch s’intéresse aux articles et à leurs versions, pas aux profils individuels.",
    prohibitedPublicOutput: [
      "Nom de contributeur",
      "Adresse IP",
      "Compte temporaire",
      "Classement d’auteurs"
    ]
  },
  {
    id: "no-location",
    title: "Aucune géolocalisation des contributeurs",
    description: "La carte d’Explorer situe uniquement le sujet footballistique lié à une histoire.",
    prohibitedPublicOutput: [
      "Pays supposé d’un auteur",
      "Origine géographique d’une modification",
      "Carte des éditeurs"
    ]
  },
  {
    id: "no-profiling",
    title: "Aucun profilage éditorial individuel",
    description: "Le produit ne doit pas construire de récit public autour du comportement d’une personne.",
    prohibitedPublicOutput: [
      "Contributeur le plus actif",
      "Profil d’opinion",
      "Historique personnel"
    ]
  }
];

export const methodologyLimitations: MethodologyLimitation[] = [
  {
    id: "coverage",
    title: "Couverture limitée au périmètre suivi",
    description: "WikiMatch ne prétend pas analyser tout Wikipédia ni tout le football mondial. Chaque match ou sujet repose sur une sélection d’articles suivis.",
    consequence: "Une histoire absente du site peut simplement être hors périmètre ou non publiée."
  },
  {
    id: "timing",
    title: "La chronologie n’est pas une causalité",
    description: "Une modification observée après un événement sportif peut être rapprochée dans le temps, sans prouver qu’elle en découle directement.",
    consequence: "Les formulations publiques doivent rester prudentes."
  },
  {
    id: "languages",
    title: "Les éditions linguistiques ne représentent pas des pays",
    description: "Une édition en français ou en japonais rassemble des contributeurs multiples et ne constitue pas une voix nationale.",
    consequence: "WikiMatch compare des articles, jamais des peuples."
  },
  {
    id: "absence",
    title: "Une absence est temporaire et située",
    description: "Ne pas détecter une mention dans une version observée ne signifie pas qu’elle ne sera jamais ajoutée ou qu’elle a été volontairement écartée.",
    consequence: "Le site utilise la formulation “non détecté dans la version observée”."
  },
  {
    id: "automation",
    title: "L’automatisation peut produire des faux positifs",
    description: "Détection, traduction ou rapprochement automatique peuvent aider à trouver des pistes, mais nécessitent une revue.",
    consequence: "Les candidats automatiques appartiennent au Desk privé, pas au Magazine."
  },
  {
    id: "prototype",
    title: "La V2 actuelle est une démonstration frontend",
    description: "Les pages construites ici utilisent des données fictives afin de valider l’expérience avant branchement des sources réelles.",
    consequence: "Aucun exemple visible dans la maquette ne constitue une observation réelle."
  }
];

export const methodologyFaq: MethodologyFAQItem[] = [
  {
    id: "what-is-a-story",
    question: "Qu’est-ce qu’une histoire WikiMatch ?",
    answer: "Une histoire est un contenu public construit à partir d’un changement substantiel ou d’une comparaison réellement compréhensible entre articles, accompagné de ses sources et de ses limites."
  },
  {
    id: "why-not-all-edits",
    question: "Pourquoi ne pas montrer toutes les modifications comme des événements ?",
    answer: "Parce qu’une correction de virgule, un lien interne ou une mise en page ne racontent rien sur le tournoi. Les traces brutes peuvent être consultables dans l’Observatoire, mais elles ne deviennent pas automatiquement des stories."
  },
  {
    id: "language-country",
    question: "Une édition linguistique représente-t-elle un pays ?",
    answer: "Non. Une édition linguistique de Wikipédia ne représente ni une nation, ni une opinion publique. WikiMatch compare seulement les contenus observés dans des articles distincts."
  },
  {
    id: "conflict",
    question: "Quand parlez-vous d’un article instable ?",
    answer: "Uniquement lorsqu’un même article montre des ajouts, retraits ou restaurations répétées autour d’un passage comparable. Plusieurs langues qui modifient un sujet ne constituent pas, à elles seules, une tension."
  },
  {
    id: "ai",
    question: "L’IA écrit-elle les histoires ?",
    answer: "La méthode cible permet à l’IA d’assister la traduction ou le rapprochement de traces. Elle ne doit pas publier seule une histoire ni inventer une causalité ou une intention."
  },
  {
    id: "privacy",
    question: "Montrez-vous qui modifie Wikipédia ?",
    answer: "Non. L’interface publique porte sur les articles et leurs versions. Elle n’expose ni identité, ni adresse IP, ni localisation de contributeur."
  },
  {
    id: "map",
    question: "Que représente la carte d’Explorer ?",
    answer: "Elle situe le sujet footballistique lié à une histoire publiée : un joueur associé à une sélection, une équipe ou un sujet clair. Elle ne représente jamais l’origine des modifications."
  },
  {
    id: "correction",
    question: "Que se passe-t-il si une histoire est incomplète ou incorrecte ?",
    answer: "La version publique devra offrir un mécanisme de correction et un historique méthodologique. Dans cette démonstration frontend, ce parcours n’est pas encore connecté."
  }
];

export const methodologyVersions: MethodologyVersionEntry[] = [
  {
    version: "V0.2",
    dateLabel: "DÉMONSTRATION FRONTEND",
    status: "MÉTHODE CIBLE",
    changes: [
      "Séparation entre Magazine public, Explorer, Observatoire et Desk privé futur.",
      "Publication publique limitée aux histoires validées.",
      "Carte fondée sur les sujets documentés, jamais sur la localisation des contributeurs.",
      "Comparaison entre éditions distinguée de l’instabilité sur un article."
    ]
  },
  {
    version: "V0.1",
    dateLabel: "PROTOTYPE INITIAL",
    status: "ABANDONNÉ COMME MODÈLE PRODUIT",
    changes: [
      "Approche centrée sur l’activité et les volumes de modifications.",
      "Remplacée par une approche centrée sur les histoires vérifiables."
    ]
  }
];
