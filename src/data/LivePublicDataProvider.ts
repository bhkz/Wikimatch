import type {
  EntityDetailPageData,
  ExplorerPageData,
  HomePageData,
  MatchDetailPageData,
  MatchesCalendarPageData,
  MethodologyPageData,
  ObservatoryPageData,
  PublicDataMode,
  PublicDataProvider,
  SearchPageData,
  StoriesArchivePageData,
  StoryDetailPageData,
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

  async getStoryBySlug(_slug: string): Promise<StoryDetailPageData | null> {
    throw new NotImplementedError("getStoryBySlug", this.mode);
  }

  async getMatchBySlug(_slug: string): Promise<MatchDetailPageData | null> {
    throw new NotImplementedError("getMatchBySlug", this.mode);
  }

  async getEntityBySlug(_slug: string): Promise<EntityDetailPageData | null> {
    throw new NotImplementedError("getEntityBySlug", this.mode);
  }

  async getMatchesCalendarPageData(): Promise<MatchesCalendarPageData> {
    throw new NotImplementedError("getMatchesCalendarPageData", this.mode);
  }

  async getStoriesArchivePageData(): Promise<StoriesArchivePageData> {
    throw new NotImplementedError("getStoriesArchivePageData", this.mode);
  }

  async getExplorerPageData(): Promise<ExplorerPageData> {
    throw new NotImplementedError("getExplorerPageData", this.mode);
  }

  async getObservatoryPageData(): Promise<ObservatoryPageData> {
    throw new NotImplementedError("getObservatoryPageData", this.mode);
  }

  async getMethodologyPageData(): Promise<MethodologyPageData> {
    throw new NotImplementedError("getMethodologyPageData", this.mode);
  }

  async getSearchPageData(): Promise<SearchPageData> {
    throw new NotImplementedError("getSearchPageData", this.mode);
  }
}
