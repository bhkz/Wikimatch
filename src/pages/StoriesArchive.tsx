import { useState, useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import StoriesArchiveHero from "../components/stories/StoriesArchiveHero";
import ArchiveStatsStrip from "../components/stories/ArchiveStatsStrip";
import FeaturedArchiveStory from "../components/stories/FeaturedArchiveStory";
import StoriesFilterBar from "../components/stories/StoriesFilterBar";
import StoriesEditorialGrid from "../components/stories/StoriesEditorialGrid";
import FeaturedCollectionSection from "../components/stories/FeaturedCollectionSection";
import MatchRecapsSection from "../components/stories/MatchRecapsSection";
import ArchiveMethodologyBlock from "../components/stories/ArchiveMethodologyBlock";
import StoriesFinalCTA from "../components/stories/StoriesFinalCTA";
import { dataProvider, useAsyncData } from "../data";

export default function StoriesArchive() {
  const [activeFilterId, setActiveFilterId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(() => dataProvider.getStoriesArchivePageData(), []);

  if (state.status !== "ready") {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh] font-mono text-[10px] uppercase tracking-widest text-navy/40 pt-32">
          {state.status === "loading"
            ? "Chargement…"
            : `Données indisponibles : ${state.error.message}`}
        </div>
        <SiteFooter />
      </div>
    );
  }

  const {
    stats: archiveStats,
    featured: featuredStory,
    filters: archiveFilters,
    stories: archiveStories,
    collection: featuredCollection,
  } = state.data;

  const activeFilter =
    archiveFilters.find((f) => f.id === activeFilterId) ?? archiveFilters[0];

  const filteredStories = archiveStories.filter((story) => {
    let matchFilter = true;
    if (
      activeFilter.type &&
      activeFilter.type !== "language_divergence" &&
      activeFilter.type !== "language_convergence"
    ) {
      matchFilter = story.type === activeFilter.type;
    } else if (activeFilter.id === "language_comparison") {
      matchFilter =
        story.type === "language_divergence" ||
        story.type === "language_convergence";
    }

    let matchSearch = true;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      matchSearch =
        story.title.toLowerCase().includes(q) ||
        (story.matchLabel?.toLowerCase().includes(q) ?? false) ||
        (story.entityLabel?.toLowerCase().includes(q) ?? false);
    }

    return matchFilter && matchSearch;
  });

  // Filter out the featured story from the grid if it's the exact same object and we're showing "Toutes"
  const gridStories = filteredStories.filter(
    (s) => activeFilterId !== "all" || s.id !== featuredStory.id,
  );

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />

      <main className="relative pt-[72px]">
        <StoriesArchiveHero />
        <ArchiveStatsStrip stats={archiveStats} />

        {activeFilterId === "all" && !searchQuery && (
          <FeaturedArchiveStory story={featuredStory} />
        )}

        <StoriesFilterBar
          filters={archiveFilters}
          activeFilterId={activeFilterId}
          onSelectFilter={setActiveFilterId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <StoriesEditorialGrid
          stories={gridStories}
          activeFilter={activeFilter}
          isFiltering={activeFilterId !== "all" || searchQuery.length > 0}
        />

        <FeaturedCollectionSection
          collection={featuredCollection}
          archiveStories={archiveStories}
        />

        <MatchRecapsSection />

        <ArchiveMethodologyBlock />

        <StoriesFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
