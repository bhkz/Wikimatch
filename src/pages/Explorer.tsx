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
        
        {anchors.length === 0 ? (
          <section className="py-24 px-4 md:px-8 bg-navy text-cream border-b border-cream/10 relative overflow-hidden">
            <div className="w-full max-w-screen-xl mx-auto text-center py-16 flex flex-col items-center gap-6">
              <div className="w-12 h-[1px] bg-blue-electric/50" />
              <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-white">
                Aucune observation vérifiée publiée pour le moment
              </h2>
              <p className="font-sans text-base md:text-lg text-cream/70 leading-relaxed font-light max-w-2xl">
                L'explorateur affichera les comparaisons et chronologies seulement lorsqu'elles seront reliées à des modifications sources consultables. Le match test PSG — Arsenal est configuré et sa collecte dédiée commencera au coup d'envoi.
              </p>
              <div className="w-12 h-[1px] bg-blue-electric/50 mt-2" />
            </div>
          </section>
        ) : (
          <>
            <ExplorerStatsStrip stats={stats} />
            <ExplorerInternalNav />
            <EditorialWorldMap anchors={anchors} unmapped={unmapped} />
            <LanguageEditionsMatrix rows={matrixRows} />
            <TournamentEditorialTimeline events={timelineEvents} />
            <StoryTypeLegend legend={legend} />
            <UnderRadarExplorerFeature />
            <MapTrustSection />
            <ExplorerFinalCTA />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
