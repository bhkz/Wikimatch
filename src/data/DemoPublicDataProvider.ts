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
      featuredStory: homeFeaturedStory,
      latestStories,
      nextMatch,
      observatoryData,
    };
  }

  async getStoryBySlug(slug: string): Promise<StoryDetailPageData | null> {
    if (slug === demoDivergenceStory.slug) {
      return { story: demoDivergenceStory };
    }
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
      stats: archiveStats,
      featured: archiveFeaturedStory,
      filters: archiveFilters,
      stories: archiveStories,
      collection: featuredCollection,
    };
  }

  async getExplorerPageData(): Promise<ExplorerPageData> {
    return {
      stats: explorerStats,
      legend: explorerLegend,
      anchors: storyGeoAnchors,
      unmapped: unmappedStories,
      matrixRows: explorerMatrixRows,
      timelineEvents: explorerTimelineEvents,
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

  async getSearchPageData(): Promise<SearchPageData> {
    return {
      demoStats: searchDemoStats,
      suggestions: searchSuggestions,
      allResults: publicSearchResults,
    };
  }
}
