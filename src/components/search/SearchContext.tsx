import { createContext, useState, useContext, useMemo, ReactNode } from "react";
import type {
  PublicSearchResult,
  SearchFilterType,
  SearchSuggestion,
} from "../../types";

interface SearchContextType {
  query: string;
  setQuery: (val: string) => void;
  activeFilter: SearchFilterType;
  setActiveFilter: (val: SearchFilterType) => void;
  activeLang: string | null;
  setActiveLang: (val: string | null) => void;
  results: PublicSearchResult[];
  searchState: "idle" | "results";
  clearSearch: () => void;
  /** All public results available in the current data mode. Read-only. */
  allResults: PublicSearchResult[];
  /** Query suggestions surfaced in the Hero / EmptyState. Read-only. */
  suggestions: SearchSuggestion[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function CustomSearchProvider({
  children,
  allResults,
  suggestions,
}: {
  children: ReactNode;
  allResults: PublicSearchResult[];
  suggestions: SearchSuggestion[];
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>("all");
  const [activeLang, setActiveLang] = useState<string | null>(null);

  const searchState =
    query.trim() !== "" || activeFilter !== "all" || activeLang !== null
      ? "results"
      : "idle";

  const results = useMemo(() => {
    if (searchState === "idle") return [];

    const lowerQuery = query.toLowerCase();

    return allResults.filter((res) => {
      // 1. Text match
      const textMatch =
        res.title.toLowerCase().includes(lowerQuery) ||
        res.excerpt.toLowerCase().includes(lowerQuery) ||
        res.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery)) ||
        (res.matchLabel && res.matchLabel.toLowerCase().includes(lowerQuery)) ||
        (res.entityLabel && res.entityLabel.toLowerCase().includes(lowerQuery));

      if (!textMatch && query.trim() !== "") return false;

      // 2. Type filter
      if (activeFilter !== "all" && res.type !== activeFilter) return false;

      // 3. Lang filter
      if (
        activeLang &&
        (!res.languages || !res.languages.includes(activeLang as any))
      ) {
        return false;
      }

      return true;
    });
  }, [query, activeFilter, activeLang, searchState, allResults]);

  const clearSearch = () => {
    setQuery("");
    setActiveFilter("all");
    setActiveLang(null);
  };

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        activeFilter,
        setActiveFilter,
        activeLang,
        setActiveLang,
        results,
        searchState,
        clearSearch,
        allResults,
        suggestions,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useCustomSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx)
    throw new Error("useCustomSearch must be used within CustomSearchProvider");
  return ctx;
}
