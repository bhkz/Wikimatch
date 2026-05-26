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

import {
  observatoryStats,
  publicPipelineSteps,
  trackedArticles,
  publicTraces,
  featuredSourceChain
} from "../mockObservatoryData";

export default function Observatory() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-0">
      <SiteHeader />
      
      <main className="relative pt-[72px]">
         <ObservatoryHero />
         <ObservatoryScopeStatement />
         <ObservatoryStatsStrip stats={observatoryStats} />
         <PublicPipelineSection steps={publicPipelineSteps} />
         <TrackedArticlesSection articles={trackedArticles} />
         <ObservatoryTraceBrowser traces={publicTraces} />
         <StorySourceChainSection chain={featuredSourceChain} />
         <MinorTraceExplanationSection />
         <ObservatoryPrivacySection />
         <PublicVsPrivateSection />
         <ObservatoryFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
