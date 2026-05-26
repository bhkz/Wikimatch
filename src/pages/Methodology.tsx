import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
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
import { dataProvider, useAsyncData } from "../data";

export default function Methodology() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(() => dataProvider.getMethodologyPageData(), []);

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
    definitions,
    pipeline,
    comparisonRules,
    publicationCriteria,
    aiRules,
    privacyPrinciples,
    limitations,
    faq,
    versions,
  } = state.data;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <ReadingProgressBar />

      <main className="flex flex-col w-full bg-cream min-h-screen">
        <MethodologyHero />
        <MethodologyInternalNav />

        <div id="methodology-definitions">
          <CoreDefinitionsSection methodologyDefinitions={definitions} />
        </div>

        <div id="methodology-pipeline">
          <MethodologyPipeline methodologyPipeline={pipeline} />
        </div>

        <div id="methodology-publication">
          <PublicationCriteriaSection publicationCriteria={publicationCriteria} />
          <StoryTypesMethodologySection />
        </div>

        <div id="methodology-comparison">
          <LanguageIsNotCountrySection comparisonRules={comparisonRules} />
          <ArticleInstabilityMethodSection />
          <GeographyMethodSection />
        </div>

        <div id="methodology-ai">
          <AiGovernanceSection aiRules={aiRules} />
        </div>

        <div id="methodology-privacy">
          <PrivacyPrinciplesSection privacyPrinciples={privacyPrinciples} />
        </div>

        <div id="methodology-limitations">
          <MethodologyLimitationsSection methodologyLimitations={limitations} />
          <MethodologyCaseStudy />
          <CorrectionsAndVersioningSection methodologyVersions={versions} />
        </div>

        <div id="methodology-faq">
          <MethodologyFAQ methodologyFaq={faq} />
        </div>

        <MethodologyFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
