import { PublishedStory, TrackedMatch, ObservatoryTeaserType } from "./types";

export const featuredStory: PublishedStory = {
  id: "story-1",
  slug: "demo-divergence",
  type: "language_divergence",
  label: "DIVERGENCE ENTRE ÉDITIONS",
  title: "UN MÊME CARTON ROUGE. TROIS TRAITEMENTS WIKIPÉDIA.",
  excerpt: "Après un incident de fin de match, trois éditions linguistiques ne retiennent pas encore les mêmes éléments : l’une mentionne l’altercation, une autre uniquement la sanction, la troisième ne comporte aucune mention équivalente détectée.",
  languages: ["EN", "ES", "FR"],
  publishedAt: new Date().toISOString(),
  sourceCount: 14,
  isDemo: true,
  comparison: [
    {
      language: "EN",
      shortLabel: "Édition anglaise",
      observation: "Mentionne l’altercation\nSource présente",
      status: "present"
    },
    {
      language: "ES",
      shortLabel: "Édition espagnole",
      observation: "Mentionne la sanction\nSource présente",
      status: "present"
    },
    {
      language: "FR",
      shortLabel: "Édition française",
      observation: "Aucune mention équivalente détectée",
      status: "absent"
    }
  ]
};

export const latestStories: PublishedStory[] = [
  {
    id: "story-2",
    slug: "demo-convergence",
    type: "language_convergence",
    label: "UN FAIT ENTRE DANS WIKIPÉDIA",
    title: "La qualification du Maroc apparaît dans quatre éditions en quinze minutes.",
    excerpt: "",
    languages: ["EN", "FR", "AR", "ES"],
    publishedAt: new Date().toISOString(),
    sourceCount: 4,
    isDemo: true,
    heroImage: "https://images.unsplash.com/photo-1518105779147-380d19e07f7f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "story-3",
    slug: "demo-instability",
    type: "article_instability",
    label: "ARTICLE INSTABLE",
    title: "Une mention retirée puis réintroduite trois fois sur l’article anglais.",
    excerpt: "",
    languages: ["EN"],
    publishedAt: new Date().toISOString(),
    sourceCount: 5,
    isDemo: true
  },
  {
    id: "story-4",
    slug: "demo-under-radar",
    type: "under_radar",
    label: "SOUS LE RADAR",
    title: "Le gardien suivi au Japon avant d’apparaître ailleurs.",
    excerpt: "",
    languages: ["JA", "EN", "FR"],
    publishedAt: new Date().toISOString(),
    sourceCount: 3,
    isDemo: true
  }
];

export const nextMatch: TrackedMatch = {
  id: "match-1",
  teams: ["MEXIQUE", "AFRIQUE DU SUD"],
  stage: "PHASE DE GROUPES",
  dateLabel: "11 JUIN 2026",
  timeLabel: "HORAIRE OFFICIEL À CONNECTER",
  status: "upcoming",
  trackedPagesLabel: "Match · Sélections · Joueurs · Tournoi",
  isDemo: true
};

export const observatoryData: ObservatoryTeaserType = {
  capturedEdits: 2543,
  monitoredLanguages: 64,
  publishedStories: 12,
  noiseFilteredPercent: 98
};
