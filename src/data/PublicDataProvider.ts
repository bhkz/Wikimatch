import type {
  ArticleInstabilityCase,
  EntityComparisonCase,
  EntityLanguageArticleState,
  EntityProfile,
  EntityPublishedStory,
  EntityRelatedMatch,
  EntityTimelineItem,
  ExplorerLegendItem,
  ExplorerMatrixRow,
  ExplorerStats,
  ExplorerTimelineEvent,
  FeaturedCollection,
  MatchContext,
  MatchDayGroup,
  MatchesArchiveStats,
  MatchLanguageComparison,
  MatchPublishedStory,
  MatchRecap,
  MatchTimelineItem,
  MatchTrackedSubject,
  MethodologyAiRule,
  MethodologyCaseStudy,
  MethodologyComparisonRule,
  MethodologyDefinition,
  MethodologyFAQItem,
  MethodologyLimitation,
  MethodologyPipelineStep,
  MethodologyPrivacyPrinciple,
  MethodologyVersionEntry,
  ObservatoryPipelineStep,
  ObservatoryPublicStats,
  ObservatoryStorySourceChain,
  ObservatoryTrace,
  ObservatoryTrackedArticle,
  ObservatoryTeaserType,
  PublicationCriterion,
  PublishedStory,
  PublishedStoryDetail,
  StoriesArchiveStats,
  StoryArchiveFilter,
  StoryArchiveItem,
  StoryGeoAnchor,
  TrackedMatch,
  TrackedMatchCard,
  SearchDemoStats,
  SearchSuggestion,
  PublicSearchResult,
} from "../types";

export type PublicDataMode = "demo" | "live";

// --- Home --------------------------------------------------------------------

export type HomePageData = {
  featuredStory: PublishedStory | null;
  latestStories: PublishedStory[];
  nextMatch: TrackedMatch | null;
  observatoryData: ObservatoryTeaserType;
};

// --- Story detail ------------------------------------------------------------

export type StoryDetailPageData = {
  story: PublishedStoryDetail;
};

// --- Match detail ------------------------------------------------------------

export type MatchDetailPageData = {
  match: MatchContext;
  recap: MatchRecap;
  stories: MatchPublishedStory[];
  timeline: MatchTimelineItem[];
  comparison: MatchLanguageComparison;
  instability: ArticleInstabilityCase;
  trackedSubjects: MatchTrackedSubject[];
};

// --- Entity detail -----------------------------------------------------------

export type EntityDetailPageData = {
  entity: EntityProfile;
  featuredStory: EntityPublishedStory;
  languageStates: EntityLanguageArticleState[];
  comparison: EntityComparisonCase;
  timeline: EntityTimelineItem[];
  relatedMatches: EntityRelatedMatch[];
};

// --- Matches calendar --------------------------------------------------------

export type MatchesCalendarPageData = {
  stats: MatchesArchiveStats;
  featured: TrackedMatchCard | null;
  allGroups: MatchDayGroup[];
};

// --- Stories archive ---------------------------------------------------------

export type StoriesArchivePageData = {
  stats: StoriesArchiveStats;
  featured: StoryArchiveItem | null;
  filters: StoryArchiveFilter[];
  stories: StoryArchiveItem[];
  collection: FeaturedCollection | null;
};

// --- Explorer ----------------------------------------------------------------

export type ExplorerUnmappedStory = {
  id: string;
  label: string;
  title: string;
  reason: string;
  route?: string;
  isDemo: boolean;
};

export type ExplorerPageData = {
  stats: ExplorerStats;
  legend: ExplorerLegendItem[];
  anchors: StoryGeoAnchor[];
  unmapped: ExplorerUnmappedStory[];
  matrixRows: ExplorerMatrixRow[];
  timelineEvents: ExplorerTimelineEvent[];
};

// --- Observatory -------------------------------------------------------------

export type ObservatoryPageData = {
  stats: ObservatoryPublicStats;
  pipelineSteps: ObservatoryPipelineStep[];
  trackedArticles: ObservatoryTrackedArticle[];
  traces: ObservatoryTrace[];
  sourceChain: ObservatoryStorySourceChain | null;
};

// --- Methodology -------------------------------------------------------------

export type MethodologyPageData = {
  definitions: MethodologyDefinition[];
  pipeline: MethodologyPipelineStep[];
  cases: MethodologyCaseStudy[];
  comparisonRules: MethodologyComparisonRule[];
  publicationCriteria: PublicationCriterion[];
  aiRules: MethodologyAiRule[];
  privacyPrinciples: MethodologyPrivacyPrinciple[];
  limitations: MethodologyLimitation[];
  faq: MethodologyFAQItem[];
  versions: MethodologyVersionEntry[];
};

// --- Search ------------------------------------------------------------------

export type SearchPageData = {
  demoStats: SearchDemoStats;
  suggestions: SearchSuggestion[];
  allResults: PublicSearchResult[];
};

// --- Contract ----------------------------------------------------------------

/**
 * Contrat unique de la couche de données publique du frontend.
 *
 * Implémentations :
 *  - DemoPublicDataProvider  : alimentée par src/mock*Data.ts (Phase 1).
 *  - LivePublicDataProvider  : appelle /api/public/v1/* (Phase 2+).
 *
 * Toute page V2 doit consommer ce contrat via le hook useAsyncData()
 * et NE JAMAIS importer directement src/mock*Data.ts.
 */
export interface PublicDataProvider {
  readonly mode: PublicDataMode;

  // Home
  getHomePageData(): Promise<HomePageData>;

  // Story detail
  getStoryBySlug(slug: string): Promise<StoryDetailPageData | null>;

  // Match detail
  getMatchBySlug(slug: string): Promise<MatchDetailPageData | null>;

  // Entity detail
  getEntityBySlug(slug: string): Promise<EntityDetailPageData | null>;

  // Index pages
  getMatchesCalendarPageData(): Promise<MatchesCalendarPageData>;
  getStoriesArchivePageData(): Promise<StoriesArchivePageData>;
  getExplorerPageData(): Promise<ExplorerPageData>;
  getObservatoryPageData(): Promise<ObservatoryPageData>;
  getMethodologyPageData(): Promise<MethodologyPageData>;
  getSearchPageData(): Promise<SearchPageData>;
}

export class NotImplementedError extends Error {
  constructor(method: string, mode: PublicDataMode) {
    super(
      `PublicDataProvider.${method}() n'est pas encore implémenté en mode "${mode}". ` +
        `Cette page n'a pas encore été migrée vers la data layer.`,
    );
    this.name = "NotImplementedError";
  }
}
