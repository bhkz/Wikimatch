import {
  featuredStory,
  latestStories,
  nextMatch,
  observatoryData,
} from "../mockHomeData";
import type {
  ExplorerData,
  ExplorerFilters,
  HomePageData,
  MatchFilters,
  MethodologyData,
  NotImplementedError as _NotImplementedError,
  ObservatoryFilters,
  PublicDataMode,
  PublicDataProvider,
  PublicEntityDetail,
  PublicMatchDetail,
  PublicMatchSummary,
  PublicSearchFilters,
  PublicSearchResult,
  PublicTraceDetail,
  PublicTraceSummary,
  PublishedStoryDetail,
  PublishedStorySummary,
  StoryFilters,
} from "./PublicDataProvider";
import { NotImplementedError } from "./PublicDataProvider";

/**
 * Implémentation "demo" du contrat PublicDataProvider.
 *
 * Réutilise les fixtures existantes dans src/mock*Data.ts sans les modifier,
 * en les exposant via une interface uniforme et asynchrone (parité avec Live).
 *
 * Les méthodes non encore migrées lèvent NotImplementedError : cela signale
 * une page qui n'est pas encore branchée sur la data layer (Phase 1 itérative).
 */
export class DemoPublicDataProvider implements PublicDataProvider {
  public readonly mode: PublicDataMode = "demo";

  async getHomePageData(): Promise<HomePageData> {
    return {
      featuredStory,
      latestStories,
      nextMatch,
      observatoryData,
    };
  }

  async getStories(_filters?: StoryFilters): Promise<PublishedStorySummary[]> {
    throw new NotImplementedError("getStories", this.mode);
  }

  async getStoryBySlug(_slug: string): Promise<PublishedStoryDetail | null> {
    throw new NotImplementedError("getStoryBySlug", this.mode);
  }

  async getMatches(_filters?: MatchFilters): Promise<PublicMatchSummary[]> {
    throw new NotImplementedError("getMatches", this.mode);
  }

  async getMatchBySlug(_slug: string): Promise<PublicMatchDetail | null> {
    throw new NotImplementedError("getMatchBySlug", this.mode);
  }

  async getEntityBySlug(_slug: string): Promise<PublicEntityDetail | null> {
    throw new NotImplementedError("getEntityBySlug", this.mode);
  }

  async getExplorerData(_filters?: ExplorerFilters): Promise<ExplorerData> {
    throw new NotImplementedError("getExplorerData", this.mode);
  }

  async getObservatoryTraces(
    _filters?: ObservatoryFilters,
  ): Promise<PublicTraceSummary[]> {
    throw new NotImplementedError("getObservatoryTraces", this.mode);
  }

  async getObservatoryTraceById(
    _id: string,
  ): Promise<PublicTraceDetail | null> {
    throw new NotImplementedError("getObservatoryTraceById", this.mode);
  }

  async getMethodologyData(): Promise<MethodologyData> {
    throw new NotImplementedError("getMethodologyData", this.mode);
  }

  async searchPublicContent(
    _query: string,
    _filters?: PublicSearchFilters,
  ): Promise<PublicSearchResult[]> {
    throw new NotImplementedError("searchPublicContent", this.mode);
  }
}
