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
    return this.request<HomePageData>("/home");
  }

  async getStoryBySlug(slug: string): Promise<StoryDetailPageData | null> {
    return this.request<StoryDetailPageData>(
      `/stories/${encodeURIComponent(slug)}`,
      { notFoundReturnsNull: true },
    );
  }

  async getMatchBySlug(slug: string): Promise<MatchDetailPageData | null> {
    return this.request<MatchDetailPageData>(
      `/matches/${encodeURIComponent(slug)}`,
      { notFoundReturnsNull: true },
    );
  }

  async getEntityBySlug(slug: string): Promise<EntityDetailPageData | null> {
    return this.request<EntityDetailPageData>(
      `/entities/${encodeURIComponent(slug)}`,
      { notFoundReturnsNull: true },
    );
  }

  async getMatchesCalendarPageData(): Promise<MatchesCalendarPageData> {
    return this.request<MatchesCalendarPageData>("/matches");
  }

  async getStoriesArchivePageData(): Promise<StoriesArchivePageData> {
    return this.request<StoriesArchivePageData>("/stories");
  }

  async getExplorerPageData(): Promise<ExplorerPageData> {
    return this.request<ExplorerPageData>("/explorer");
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
