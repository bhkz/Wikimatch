import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AnimatedTextReveal from "../components/AnimatedTextReveal";
import DemoBadge from "../components/DemoBadge";
// Next components will be imported here
import MethodologyHero from "../components/methodology/MethodologyHero";
import MethodologyInternalNav from "../components/methodology/MethodologyInternalNav";
import CoreDefinitionsSection from "../components/methodology/CoreDefinitionsSection";
import MethodologyPipeline from "../components/methodology/MethodologyPipeline";
import PublicationCriteriaSection from "../components/methodology/PublicationCriteriaSection";
import StoryTypesMethodologySection from "../components/methodology/StoryTypesMethodologySection";
import LanguageIsNotCountrySection from "../components/methodology/LanguageIsNotCountrySection";
import ArticleInstabilityMethodSection from "../components/methodology/ArticleInstabilityMethodSection";
import GeographyMethodSection from "../components/methodology/GeographyMethodSection";
import AiGovernanceSection from "../components/methodology/AiGovernanceSection";
import PrivacyPrinciplesSection from "../components/methodology/PrivacyPrinciplesSection";
import MethodologyLimitationsSection from "../components/methodology/MethodologyLimitationsSection";
import MethodologyCaseStudy from "../components/methodology/MethodologyCaseStudy";
import CorrectionsAndVersioningSection from "../components/methodology/CorrectionsAndVersioningSection";
import MethodologyFAQ from "../components/methodology/MethodologyFAQ";
import MethodologyFinalCTA from "../components/methodology/MethodologyFinalCTA";
import ReadingProgressBar from "../components/methodology/ReadingProgressBar";

export default function Methodology() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <ReadingProgressBar />
      
      <main className="flex flex-col w-full bg-cream min-h-screen">
        <MethodologyHero />
        <MethodologyInternalNav />
        
        <div id="methodology-definitions">
          <CoreDefinitionsSection />
        </div>
        
        <div id="methodology-pipeline">
          <MethodologyPipeline />
        </div>
        
        <div id="methodology-publication">
          <PublicationCriteriaSection />
          <StoryTypesMethodologySection />
        </div>
        
        <div id="methodology-comparison">
          <LanguageIsNotCountrySection />
          <ArticleInstabilityMethodSection />
          <GeographyMethodSection />
        </div>
        
        <div id="methodology-ai">
          <AiGovernanceSection />
        </div>
        
        <div id="methodology-privacy">
          <PrivacyPrinciplesSection />
        </div>
        
        <div id="methodology-limitations">
          <MethodologyLimitationsSection />
          <MethodologyCaseStudy />
          <CorrectionsAndVersioningSection />
        </div>
        
        <div id="methodology-faq">
          <MethodologyFAQ />
        </div>
        
        <MethodologyFinalCTA />
      </main>
      
      <SiteFooter />
    </div>
  );
}
