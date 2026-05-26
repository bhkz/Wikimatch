import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SearchHero from "../components/search/SearchHero";
import SearchContentTypesSection from "../components/search/SearchContentTypesSection";
import SearchResultToolbar from "../components/search/SearchResultToolbar";
import SearchResultsList from "../components/search/SearchResultsList";
import SearchEmptyState from "../components/search/SearchEmptyState";
import SearchPublicIndexScopeSection from "../components/search/SearchPublicIndexScopeSection";
import SearchFinalNavigation from "../components/search/SearchFinalNavigation";
import SearchRenItoDemoJourney from "../components/search/SearchRenItoDemoJourney";
import SearchRedCardDemoJourney from "../components/search/SearchRedCardDemoJourney";
import SearchRecommendedEntries from "../components/search/SearchRecommendedEntries";
import {
  CustomSearchProvider,
  useCustomSearch,
} from "../components/search/SearchContext";

function SearchContent() {
  const { query, results, searchState } = useCustomSearch();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-navy text-white selection:bg-blue-electric selection:text-white flex flex-col pt-20">
      {/* Mobile/Desktop Hero changes depending on search state */}
      <SearchHero />

      {searchState === "idle" ? (
        <div className="flex flex-col">
          <SearchContentTypesSection />
          <SearchRecommendedEntries />
          <SearchPublicIndexScopeSection />
          <SearchFinalNavigation />
        </div>
      ) : (
        <div className="flex flex-col flex-1 w-full max-w-screen-xl mx-auto px-4 md:px-8 pb-24">
          <div className="sticky top-20 z-30 pt-6 pb-4 bg-navy">
            <SearchResultToolbar />
          </div>

          {results.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mt-8">
              <div className="flex-1 w-full lg:max-w-2xl">
                <SearchResultsList />
              </div>

              <div className="hidden lg:block w-full lg:w-[400px] xl:w-[480px] shrink-0 sticky top-48 self-start">
                {query.toLowerCase().includes("ren ito") && (
                  <SearchRenItoDemoJourney />
                )}
                {query.toLowerCase().includes("carton rouge") && (
                  <SearchRedCardDemoJourney />
                )}
              </div>
            </div>
          ) : (
            <SearchEmptyState />
          )}

          <div className="lg:hidden mt-16 border-t border-white/10 pt-12">
            {query.toLowerCase().includes("ren ito") && (
              <SearchRenItoDemoJourney />
            )}
            {query.toLowerCase().includes("carton rouge") && (
              <SearchRedCardDemoJourney />
            )}
          </div>

          <div className="mt-32">
            <SearchPublicIndexScopeSection />
            <SearchFinalNavigation />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Search() {
  return (
    <>
      <SiteHeader />
      <CustomSearchProvider>
        <SearchContent />
      </CustomSearchProvider>
      <SiteFooter />
    </>
  );
}
