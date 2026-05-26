import type {
  PublishedStory,
  TrackedMatch,
  ObservatoryTeaserType,
} from "../types";

export type PublicDataMode = "demo" | "live";

export type HomePageData = {
  featuredStory: PublishedStory;
  latestStories: PublishedStory[];
  nextMatch: TrackedMatch;
  observatoryData: ObservatoryTeaserType;
};

export type StoryFilters = {
  type?: string;
  matchSlug?: string;
  entitySlug?: string;
  language?: string;
};

export type MatchFilters = {
  phase?: string;
  status?: string;
  teamSlug?: string;
};

export type ExplorerFilters = {
  viewMode?: "atlas" | "matrix" | "timeline";
  storyType?: string;
  language?: string;
};

export type ObservatoryFilters = {
  language?: string;
  status?: string;
  articleType?: string;
  matchSlug?: string;
  query?: string;
};

export type PublicSearchFilters = {
  type?: string;
  language?: string;
};

// Placeholder return types — refined per page migration.
export type PublishedStorySummary = unknown;
export type PublishedStoryDetail = unknown;
export type PublicMatchSummary = unknown;
export type PublicMatchDetail = unknown;
export type PublicEntityDetail = unknown;
export type ExplorerData = unknown;
export type PublicTraceSummary = unknown;
export type PublicTraceDetail = unknown;
export type MethodologyData = unknown;
export type PublicSearchResult = unknown;

/**
 * Contrat unique de la couche de données publique du frontend.
 *
 * Implémentations :
 *  - DemoPublicDataProvider  : alimentée par src/mock*Data.ts (Phase 1).
 *  - LivePublicDataProvider  : appelle /api/public/v1/* (Phase 2+).
 *
 * Toute page V2 doit consommer ce contrat via le hook usePublicData()
 * et NE JAMAIS importer directement src/mock*Data.ts.
 */
export interface PublicDataProvider {
  readonly mode: PublicDataMode;

  getHomePageData(): Promise<HomePageData>;

  getStories(filters?: StoryFilters): Promise<PublishedStorySummary[]>;
  getStoryBySlug(slug: string): Promise<PublishedStoryDetail | null>;

  getMatches(filters?: MatchFilters): Promise<PublicMatchSummary[]>;
  getMatchBySlug(slug: string): Promise<PublicMatchDetail | null>;

  getEntityBySlug(slug: string): Promise<PublicEntityDetail | null>;

  getExplorerData(filters?: ExplorerFilters): Promise<ExplorerData>;

  getObservatoryTraces(
    filters?: ObservatoryFilters,
  ): Promise<PublicTraceSummary[]>;
  getObservatoryTraceById(id: string): Promise<PublicTraceDetail | null>;

  getMethodologyData(): Promise<MethodologyData>;

  searchPublicContent(
    query: string,
    filters?: PublicSearchFilters,
  ): Promise<PublicSearchResult[]>;
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
