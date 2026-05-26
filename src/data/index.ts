import { DemoPublicDataProvider } from "./DemoPublicDataProvider";
import { LivePublicDataProvider } from "./LivePublicDataProvider";
import type {
  PublicDataMode,
  PublicDataProvider,
} from "./PublicDataProvider";

function readMode(): PublicDataMode {
  const raw =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string | undefined> }).env
        ?.VITE_DATA_MODE) ??
    "demo";
  return raw === "live" ? "live" : "demo";
}

export const publicDataMode: PublicDataMode = readMode();
export const isDemoMode = publicDataMode === "demo";
export const isLiveMode = publicDataMode === "live";

export const dataProvider: PublicDataProvider =
  isLiveMode ? new LivePublicDataProvider() : new DemoPublicDataProvider();

export type {
  EntityDetailPageData,
  ExplorerPageData,
  ExplorerUnmappedStory,
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
export { NotImplementedError } from "./PublicDataProvider";
export { useAsyncData } from "./usePublicData";
