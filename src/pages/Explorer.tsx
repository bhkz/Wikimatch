import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ExplorerHero from "../components/explorer/ExplorerHero";
import ExplorerIntro from "../components/explorer/ExplorerIntro";
import ExplorerStatsStrip from "../components/explorer/ExplorerStatsStrip";
import ExplorerInternalNav from "../components/explorer/ExplorerInternalNav";
import EditorialWorldMap from "../components/explorer/EditorialWorldMap";
import LanguageEditionsMatrix from "../components/explorer/LanguageEditionsMatrix";
import TournamentEditorialTimeline from "../components/explorer/TournamentEditorialTimeline";
import StoryTypeLegend from "../components/explorer/StoryTypeLegend";
import UnderRadarExplorerFeature from "../components/explorer/UnderRadarExplorerFeature";
import MapTrustSection from "../components/explorer/MapTrustSection";
import ExplorerFinalCTA from "../components/explorer/ExplorerFinalCTA";
import { dataProvider, useAsyncData } from "../data";

export default function Explorer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(() => dataProvider.getExplorerPageData(), []);

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
    stats,
    legend,
    anchors,
    unmapped,
    matrixRows,
    timelineEvents,
  } = state.data;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-0">
      <SiteHeader />

      <main className="relative pt-[72px]">
        <ExplorerHero />
        <ExplorerIntro />
        <ExplorerStatsStrip stats={stats} />
        <ExplorerInternalNav />
        <EditorialWorldMap anchors={anchors} unmapped={unmapped} />
        <LanguageEditionsMatrix rows={matrixRows} />
        <TournamentEditorialTimeline events={timelineEvents} />
        <StoryTypeLegend legend={legend} />
        <UnderRadarExplorerFeature />
        <MapTrustSection />
        <ExplorerFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
