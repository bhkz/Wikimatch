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

export const dataProvider: PublicDataProvider =
  readMode() === "live"
    ? new LivePublicDataProvider()
    : new DemoPublicDataProvider();

export type {
  HomePageData,
  PublicDataMode,
  PublicDataProvider,
} from "./PublicDataProvider";
export { NotImplementedError } from "./PublicDataProvider";
export { useAsyncData } from "./usePublicData";
