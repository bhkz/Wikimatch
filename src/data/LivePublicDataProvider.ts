import type {
  ExplorerData,
  ExplorerFilters,
  HomePageData,
  MatchFilters,
  MethodologyData,
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
 * Implémentation "live" du contrat PublicDataProvider.
 *
 * Toutes les méthodes lèvent NotImplementedError tant que l'API
 * /api/public/v1/* n'est pas en place (Phase 2). Aucun fallback
 * sur les fixtures n'est jamais autorisé en mode live.
 *
 * Voir docs/v2/PUBLIC_API_PROPOSAL.md.
 */
export class LivePublicDataProvider implements PublicDataProvider {
  public readonly mode: PublicDataMode = "live";

  async getHomePageData(): Promise<HomePageData> {
    throw new NotImplementedError("getHomePageData", this.mode);
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
