import {
  featuredStory as homeFeaturedStory,
  latestStories,
  nextMatch,
  observatoryData,
} from "../mockHomeData";
import { demoDivergenceStory } from "../mockStoryData";
import {
  demoMatch,
  demoRecap,
  matchStories,
  matchTimeline,
  matchComparison,
  demoInstability,
  trackedSubjects,
} from "../mockMatchData";
import {
  demoEntity,
  featuredEntityStory,
  languageArticleStates,
  entityComparison,
  entityTimeline,
  relatedMatches,
} from "../mockEntityData";
import {
  matchesStats,
  featuredMatch,
  allMatchesGroups,
} from "../mockMatchesData";
import {
  archiveStats,
  featuredStory as archiveFeaturedStory,
  archiveFilters,
  archiveStories,
  featuredCollection,
} from "../mockStoriesData";
import {
  explorerStats,
  explorerLegend,
  storyGeoAnchors,
  unmappedStories,
  explorerMatrixRows,
  explorerTimelineEvents,
} from "../mockExplorerData";
import {
  observatoryStats,
  publicPipelineSteps,
  trackedArticles,
  publicTraces,
  featuredSourceChain,
} from "../mockObservatoryData";
import {
  methodologyDefinitions,
  methodologyPipeline,
  methodologyCases,
  comparisonRules,
  publicationCriteria,
  aiRules,
  privacyPrinciples,
  methodologyLimitations,
  methodologyFaq,
  methodologyVersions,
} from "../mockMethodologyData";
import {
  searchDemoStats,
  searchSuggestions,
  publicSearchResults,
} from "../mockSearchData";

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

/**
 * Implémentation "demo" du contrat PublicDataProvider.
 *
 * Réutilise les fixtures de src/mock*Data.ts en les exposant via une
 * interface uniforme asynchrone (parité avec Live). Toute incohérence
 * de slug retourne `null` plutôt que de lever — comme l'API publique
 * réelle.
 */
export class DemoPublicDataProvider implements PublicDataProvider {
  public readonly mode: PublicDataMode = "demo";

  async getHomePageData(): Promise<HomePageData> {
    return {
      featuredStory: null,
      latestStories: [],
      nextMatch,
      observatoryData,
    };
  }

  async getStoryBySlug(slug: string): Promise<StoryDetailPageData | null> {
    return null;
  }

  async getMatchBySlug(slug: string): Promise<MatchDetailPageData | null> {
    // En mode demo, on ne dispose que d'un dossier match complet.
    // Tout autre slug est traité comme inexistant côté page.
    if (slug === demoMatch.slug) {
      return {
        match: demoMatch,
        recap: demoRecap,
        stories: matchStories,
        timeline: matchTimeline,
        comparison: matchComparison,
        instability: demoInstability,
        trackedSubjects,
      };
    }
    return null;
  }

  async getEntityBySlug(slug: string): Promise<EntityDetailPageData | null> {
    if (slug === demoEntity.slug) {
      return {
        entity: demoEntity,
        featuredStory: featuredEntityStory,
        languageStates: languageArticleStates,
        comparison: entityComparison,
        timeline: entityTimeline,
        relatedMatches,
      };
    }
    return null;
  }

  async getMatchesCalendarPageData(): Promise<MatchesCalendarPageData> {
    return {
      stats: matchesStats,
      featured: featuredMatch,
      allGroups: allMatchesGroups,
    };
  }

  async getStoriesArchivePageData(): Promise<StoriesArchivePageData> {
    return {
      stats: {
        storyCount: 0,
        matchCount: archiveStats.matchCount,
        languageCount: archiveStats.languageCount,
        sourceCount: 0,
        isDemo: true,
      },
      featured: null,
      filters: archiveFilters,
      stories: [],
      collection: null,
    };
  }

  async getExplorerPageData(): Promise<ExplorerPageData> {
    return {
      stats: {
        publishedStories: 0,
        mappedSubjects: explorerStats.mappedSubjects,
        comparedEditions: explorerStats.comparedEditions,
        documentedMatches: explorerStats.documentedMatches,
        isDemo: true,
      },
      legend: explorerLegend,
      anchors: [],
      unmapped: [],
      matrixRows: [],
      timelineEvents: [],
    };
  }

  async getObservatoryPageData(): Promise<ObservatoryPageData> {
    return {
      stats: observatoryStats,
      pipelineSteps: publicPipelineSteps,
      trackedArticles,
      traces: publicTraces,
      sourceChain: featuredSourceChain,
    };
  }

  async getMethodologyPageData(): Promise<MethodologyPageData> {
    return {
      definitions: methodologyDefinitions,
      pipeline: methodologyPipeline,
      cases: methodologyCases,
      comparisonRules,
      publicationCriteria,
      aiRules,
      privacyPrinciples,
      limitations: methodologyLimitations,
      faq: methodologyFaq,
      versions: methodologyVersions,
    };
  }


  async searchPublicContent(
    query: string,
    filters?: { type?: string; language?: string | null },
  ): Promise<PublicSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const base = publicSearchResults.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.excerpt.toLowerCase().includes(q) ||
      r.keywords.some((k) => k.toLowerCase().includes(q)),
    );
    return base.filter((r) => {
      if (filters?.type && filters.type !== "all" && r.type !== filters.type) return false;
      if (filters?.language && (!r.languages || !r.languages.includes(filters.language as any))) return false;
      return true;
    });
  }

  async getSearchPageData(): Promise<SearchPageData> {
    return {
      demoStats: searchDemoStats,
      suggestions: searchSuggestions,
      allResults: publicSearchResults,
    };
  }
}
