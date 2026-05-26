import { createContext, useState, useContext, useMemo, ReactNode, useEffect } from "react";
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
  allResults: PublicSearchResult[];
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>("all");
  const [activeLang, setActiveLang] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const searchState =
    debouncedQuery.trim() !== "" || activeFilter !== "all" || activeLang !== null
      ? "results"
      : "idle";

  const results = useMemo(() => {
    if (searchState === "idle") return [];

    const lowerQuery = debouncedQuery.toLowerCase();

    return allResults.filter((res) => {
      const textMatch =
        res.title.toLowerCase().includes(lowerQuery) ||
        res.excerpt.toLowerCase().includes(lowerQuery) ||
        res.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery)) ||
        (res.matchLabel && res.matchLabel.toLowerCase().includes(lowerQuery)) ||
        (res.entityLabel && res.entityLabel.toLowerCase().includes(lowerQuery));

      if (!textMatch && debouncedQuery.trim() !== "") return false;
      if (activeFilter !== "all" && res.type !== activeFilter) return false;
      if (activeLang && (!res.languages || !res.languages.includes(activeLang as any))) return false;

      return true;
    });
  }, [debouncedQuery, activeFilter, activeLang, searchState, allResults]);

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
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
