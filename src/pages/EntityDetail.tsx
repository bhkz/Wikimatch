import { useEffect } from "react";
import { useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import EntityHero from "../components/entity/EntityHero";
import EntityEditorialSummary from "../components/entity/EntityEditorialSummary";
import EntityLanguageComparison from "../components/entity/EntityLanguageComparison";
import EntityPresenceMatrix from "../components/entity/EntityPresenceMatrix";
import EntityTournamentTimeline from "../components/entity/EntityTournamentTimeline";
import UnderRadarStoryFeature from "../components/entity/UnderRadarStoryFeature";
import EntityRelatedMatches from "../components/entity/EntityRelatedMatches";
import EntityEpistemicLimitsSection from "../components/entity/EntityEpistemicLimitsSection";
import EntitySourcesSection from "../components/entity/EntitySourcesSection";
import EntityTypesExplorer from "../components/entity/EntityTypesExplorer";
import EntityFinalCTA from "../components/entity/EntityFinalCTA";

import {
  demoEntity,
  featuredEntityStory,
  languageArticleStates,
  entityComparison,
  entityTimeline,
  relatedMatches
} from "../mockEntityData";

export default function EntityDetail() {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // For this frontend demo, we only display demo-japan-goalkeeper
  if (slug !== "demo-japan-goalkeeper") {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-8 text-center text-navy font-mono uppercase tracking-widest gap-4">
         <div>Cette entité n'est pas construite dans la démo frontend.</div>
         <a href="/stories" className="border-b border-navy/20 hover:border-navy transition-colors">Retour aux histoires</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white pb-0">
      <SiteHeader />
      
      <main className="relative pt-[72px]">
        <EntityHero entity={demoEntity} />
        <EntityEditorialSummary />
        <EntityLanguageComparison states={languageArticleStates} />
        <EntityPresenceMatrix comparison={entityComparison} />
        <EntityTournamentTimeline timeline={entityTimeline} />
        <UnderRadarStoryFeature story={featuredEntityStory} />
        <EntityRelatedMatches matches={relatedMatches} />
        <EntityEpistemicLimitsSection />
        <EntitySourcesSection states={languageArticleStates} />
        <EntityTypesExplorer />
        <EntityFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
