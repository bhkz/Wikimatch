import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ObservatoryHero from "../components/observatoire/ObservatoryHero";
import ObservatoryScopeStatement from "../components/observatoire/ObservatoryScopeStatement";
import ObservatoryStatsStrip from "../components/observatoire/ObservatoryStatsStrip";
import PublicPipelineSection from "../components/observatoire/PublicPipelineSection";
import TrackedArticlesSection from "../components/observatoire/TrackedArticlesSection";
import ObservatoryTraceBrowser from "../components/observatoire/ObservatoryTraceBrowser";
import StorySourceChainSection from "../components/observatoire/StorySourceChainSection";
import MinorTraceExplanationSection from "../components/observatoire/MinorTraceExplanationSection";
import ObservatoryPrivacySection from "../components/observatoire/ObservatoryPrivacySection";
import PublicVsPrivateSection from "../components/observatoire/PublicVsPrivateSection";
import ObservatoryFinalCTA from "../components/observatoire/ObservatoryFinalCTA";
import { dataProvider, useAsyncData } from "../data";

export default function Observatory() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(() => dataProvider.getObservatoryPageData(), []);

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
    pipelineSteps,
    trackedArticles,
    traces,
    sourceChain,
  } = state.data;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-0">
      <SiteHeader />

      <main className="relative pt-[72px]">
         <ObservatoryHero />
         <ObservatoryScopeStatement />
         <ObservatoryStatsStrip stats={stats} />
         <PublicPipelineSection steps={pipelineSteps} />
         <TrackedArticlesSection articles={trackedArticles} />
         <ObservatoryTraceBrowser traces={traces} />
         {sourceChain && <StorySourceChainSection chain={sourceChain} />}
         <MinorTraceExplanationSection />
         <ObservatoryPrivacySection />
         <PublicVsPrivateSection />
         <ObservatoryFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
