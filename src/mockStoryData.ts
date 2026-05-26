import { PublishedStoryDetail } from "./types";

export const demoDivergenceStory: PublishedStoryDetail = {
  id: "demo-divergence-001",
  slug: "demo-divergence",
  type: "language_divergence",
  categoryLabel: "DIVERGENCE ENTRE ÉDITIONS",
  title: "UN MÊME CARTON ROUGE. TROIS TRAITEMENTS WIKIPÉDIA.",
  subtitle: "Après un incident fictif de fin de match, trois éditions linguistiques ne retiennent pas encore les mêmes éléments du même épisode.",
  publishedAt: "Démonstration UI",
  matchLabel: "FRANCE — BELGIQUE",
  matchStage: "Phase de groupes · scénario fictif",
  eventLabel: "Carton rouge à la 87e minute · scénario fictif",
  languages: ["EN", "ES", "FR"],
  isDemo: true,
  observedSummary: "Dans ce scénario fictif, l’édition anglaise mentionne une altercation suivie d’un carton rouge. L’édition espagnole mentionne uniquement la sanction. Aucune mention équivalente de l’incident n’est détectée dans l’édition française au moment de la comparaison.",
  interpretationSummary: "Les trois articles comparés ne retiennent pas encore les mêmes éléments du même épisode de match.",
  limitationSummary: "Cette différence observable ne permet pas de déduire l’opinion des publics, des pays ou des contributeurs. Une édition linguistique de Wikipédia n’est pas la voix d’une nation.",
  languageStates: [
    {
      languageCode: "EN",
      languageLabel: "Édition anglaise",
      articleLabel: "Article du joueur · version anglaise",
      observedChange: "Ajout d’une mention de l’altercation et du carton rouge.",
      translatedExcerpt: "À la fin du match, il est expulsé après une altercation avec un adversaire.",
      sourceLabel: "Modification source · démonstration",
      revisionTime: "22:48",
      status: "present"
    },
    {
      languageCode: "ES",
      languageLabel: "Édition espagnole",
      articleLabel: "Article du joueur · version espagnole",
      observedChange: "Ajout de la sanction, sans mention équivalente de l’altercation.",
      translatedExcerpt: "Il reçoit un carton rouge dans les dernières minutes de la rencontre.",
      sourceLabel: "Modification source · démonstration",
      revisionTime: "22:52",
      status: "reworded"
    },
    {
      languageCode: "FR",
      languageLabel: "Édition française",
      articleLabel: "Article du joueur · version française",
      observedChange: "Aucune mention équivalente détectée au moment de la comparaison.",
      translatedExcerpt: "",
      sourceLabel: "État observé · démonstration",
      revisionTime: "23:03",
      status: "absent"
    }
  ],
  timeline: [
    {
      time: "87'",
      languageCode: "",
      title: "Événement du match",
      description: "Carton rouge après un incident de fin de rencontre · scénario fictif.",
      kind: "match_event"
    },
    {
      time: "22:48",
      languageCode: "EN",
      title: "L’édition anglaise ajoute l’incident",
      description: "L’article mentionne l’altercation et la sanction.",
      kind: "addition"
    },
    {
      time: "22:52",
      languageCode: "ES",
      title: "L’édition espagnole ajoute la sanction",
      description: "L’article mentionne le carton rouge sans reprendre l’altercation.",
      kind: "rewording"
    },
    {
      time: "23:03",
      languageCode: "FR",
      title: "L’édition française reste sans mention équivalente",
      description: "Aucun passage comparable n’est détecté dans la version observée.",
      kind: "observation"
    }
  ],
  relatedStoryIds: ["story-2", "story-3"] // Linking to mockHomeData.ts IDs
};
