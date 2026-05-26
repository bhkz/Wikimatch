import { useState, useMemo, useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import MatchesHero from "../components/matches/MatchesHero";
import MatchesStatsStrip from "../components/matches/MatchesStatsStrip";
import FeaturedMatchDossier from "../components/matches/FeaturedMatchDossier";
import MatchTrackingStatesExplainer from "../components/matches/MatchTrackingStatesExplainer";
import MatchesFilterToolbar from "../components/matches/MatchesFilterToolbar";
import TrackedScopeSection from "../components/matches/TrackedScopeSection";
import RecentMatchDossiers from "../components/matches/RecentMatchDossiers";
import NoStoryExplanationSection from "../components/matches/NoStoryExplanationSection";
import MatchesFinalCTA from "../components/matches/MatchesFinalCTA";
import MatchDaySection from "../components/matches/MatchDaySection";
import { MatchesFilterState } from "../types";
import { dataProvider, useAsyncData } from "../data";

export default function MatchesCalendar() {
  const [filters, setFilters] = useState<MatchesFilterState>({
    phase: "all",
    status: "all",
    teamQuery: "",
  });
  const [sortOrder, setSortOrder] = useState<"editorial" | "chronological">(
    "editorial",
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(
    () => dataProvider.getMatchesCalendarPageData(),
    [],
  );

  const allGroups = state.status === "ready" ? state.data.allGroups : [];

  const filteredGroups = useMemo(() => {
    return allGroups
      .map((group) => {
        const filteredMatches = group.matches.filter((match) => {
          let matchPhase = true;
          if (filters.phase !== "all") {
            matchPhase = match.stage === filters.phase;
          }

          let matchStatus = true;
          if (filters.status !== "all") {
            matchStatus = match.status === filters.status;
          }

          let matchTeam = true;
          if (filters.teamQuery.trim() !== "") {
            const query = filters.teamQuery.toLowerCase();
            const hName = match.homeTeam?.name || "";
            const aName = match.awayTeam?.name || "";
            const hShort = match.homeTeam?.shortName || "";
            const aShort = match.awayTeam?.shortName || "";
            matchTeam =
              hName.toLowerCase().includes(query) ||
              aName.toLowerCase().includes(query) ||
              hShort.toLowerCase().includes(query) ||
              aShort.toLowerCase().includes(query);
          }

          return matchPhase && matchStatus && matchTeam;
        });

        return {
          ...group,
          matches: filteredMatches,
        };
      })
      .filter((group) => group.matches.length > 0);
  }, [filters, allGroups]);

  const displayGroups = useMemo(() => {
    if (sortOrder === "editorial") {
      return filteredGroups;
    } else {
      const chronOrder = [
        "day-june-11",
        "day-june-18",
        "day-june-20",
        "knockout-demo",
      ];
      return [...filteredGroups].sort((a, b) => {
        const indexA = chronOrder.indexOf(a.id);
        const indexB = chronOrder.indexOf(b.id);
        if (indexA === -1 || indexB === -1) return 0;
        return indexA - indexB;
      });
    }
  }, [filteredGroups, sortOrder]);

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

  const { stats: matchesStats, featured: featuredMatch } = state.data;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-0">
      <SiteHeader />

      <main className="relative pt-[72px]">
        <MatchesHero />
        <MatchesStatsStrip stats={matchesStats} />
        <FeaturedMatchDossier match={featuredMatch} />
        <MatchTrackingStatesExplainer />

        <MatchesFilterToolbar
          filters={filters}
          setFilters={setFilters}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <div className="bg-cream px-4 md:px-8 py-16">
          <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
            {displayGroups.length === 0 ? (
              <div className="flex flex-col gap-4 items-center justify-center py-24 text-center">
                <div className="font-mono text-xs uppercase font-bold tracking-widest text-navy/40 mb-4 px-4 py-2 border border-navy/10 inline-block">
                  AUCUN MATCH DANS CETTE SÉLECTION
                </div>
                <p className="font-sans text-lg text-navy/60 font-light max-w-md leading-relaxed">
                  Essayez un autre filtre ou revenez à l'ensemble des rencontres fictives suivies.
                </p>
                <button
                  onClick={() =>
                    setFilters({ phase: "all", status: "all", teamQuery: "" })
                  }
                  className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-navy hover:text-blue-electric transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              displayGroups.map((group) => (
                <MatchDaySection key={group.id} group={group} />
              ))
            )}
          </div>
        </div>

        <TrackedScopeSection />
        <RecentMatchDossiers />
        <NoStoryExplanationSection baseMatch={featuredMatch} />
        <MatchesFinalCTA />

      </main>

      <SiteFooter />
    </div>
  );
}
