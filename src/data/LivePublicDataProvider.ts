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
import type { PublicSearchResult } from "../types";

type RequestOptions = {
  notFoundReturnsNull?: boolean;
};

/**
 * Live implementation of the public data contract.
 *
 * It calls /api/public/v1/* and never falls back to demo fixtures. The API is
 * not implemented in this repo yet; while Phase 2 is incomplete, live mode will
 * fail honestly with a network/API error instead of silently showing fake data.
 */
export class LivePublicDataProvider implements PublicDataProvider {
  public readonly mode: PublicDataMode = "live";

  private readonly baseUrl =
    (
      (import.meta as { env?: Record<string, string | undefined> }).env
        ?.VITE_PUBLIC_API_BASE?.replace(/\/$/, "") ?? ""
    ) +
    "/api/public/v1";

  async getHomePageData(): Promise<HomePageData> {
    const data = await this.request<HomePageData>("/home");
    return {
      ...data,
      featuredStory: null,
      latestStories: [],
    };
  }

  async getStoryBySlug(slug: string): Promise<StoryDetailPageData | null> {
    return null;
  }

  async getMatchBySlug(slug: string): Promise<MatchDetailPageData | null> {
    const data = await this.request<MatchDetailPageData>(
      `/matches/${encodeURIComponent(slug)}`,
      { notFoundReturnsNull: true },
    );
    if (!data) return null;
    return {
      ...data,
      stories: [],
    };
  }

  async getEntityBySlug(slug: string): Promise<EntityDetailPageData | null> {
    const data = await this.request<EntityDetailPageData>(
      `/entities/${encodeURIComponent(slug)}`,
      { notFoundReturnsNull: true },
    );
    if (!data) return null;
    return {
      ...data,
      featuredStory: null,
    };
  }

  async getMatchesCalendarPageData(): Promise<MatchesCalendarPageData> {
    return this.request<MatchesCalendarPageData>("/matches");
  }

  async getStoriesArchivePageData(): Promise<StoriesArchivePageData> {
    // The API already filters strictly on Level 2 conforming observations
    // (cf. docs/v2/STORY_PUBLICATION_CONTRACT.md §7.1). The wrapper used to
    // zero out the list while the API still returned demo data; now that the
    // endpoint is contract-conformant we pass through what it returns.
    return this.request<StoriesArchivePageData>("/stories");
  }

  async getExplorerPageData(): Promise<ExplorerPageData> {
    const data = await this.request<ExplorerPageData>("/explorer");
    return {
      ...data,
      stats: {
        ...data.stats,
        publishedStories: 0,
      },
      anchors: [],
      unmapped: [],
      matrixRows: [],
      timelineEvents: [],
    };
  }

  async getObservatoryPageData(): Promise<ObservatoryPageData> {
    return this.request<ObservatoryPageData>("/observatory/traces");
  }

  async getMethodologyPageData(): Promise<MethodologyPageData> {
    return this.request<MethodologyPageData>("/methodology");
  }

  async getSearchPageData(): Promise<SearchPageData> {
    return this.request<SearchPageData>("/search");
  }

  async searchPublicContent(
    query: string,
    filters?: { type?: string; language?: string | null },
    signal?: AbortSignal,
  ): Promise<PublicSearchResult[]> {
    const params = new URLSearchParams();
    params.set("q", query);
    if (filters?.type && filters.type !== "all") params.set("type", filters.type);
    if (filters?.language) params.set("language", filters.language);
    const res = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) throw new Error(`API publique indisponible (${res.status}) pour /search`);
    const body = await res.json();
    return Array.isArray(body?.allResults) ? body.allResults : [];
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 404 && options.notFoundReturnsNull) {
      return null as T;
    }

    if (!response.ok) {
      throw new Error(
        `API publique indisponible (${response.status}) pour ${path}`,
      );
    }

    return (await response.json()) as T;
  }
}
