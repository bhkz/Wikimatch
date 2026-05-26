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

import {
  explorerStats,
  explorerLegend,
  storyGeoAnchors,
  unmappedStories,
  explorerMatrixRows,
  explorerTimelineEvents
} from "../mockExplorerData";

export default function Explorer() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-0">
      <SiteHeader />
      
      <main className="relative pt-[72px]">
        <ExplorerHero />
        <ExplorerIntro />
        <ExplorerStatsStrip stats={explorerStats} />
        <ExplorerInternalNav />
        <EditorialWorldMap anchors={storyGeoAnchors} unmapped={unmappedStories} />
        <LanguageEditionsMatrix rows={explorerMatrixRows} />
        <TournamentEditorialTimeline events={explorerTimelineEvents} />
        <StoryTypeLegend legend={explorerLegend} />
        <UnderRadarExplorerFeature />
        <MapTrustSection />
        <ExplorerFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
