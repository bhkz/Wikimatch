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
import { dataProvider, useAsyncData } from "../data";

export default function EntityDetail() {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(
    () => dataProvider.getEntityBySlug(slug ?? ""),
    [slug],
  );

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-cream">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh] font-mono text-[10px] uppercase tracking-widest text-navy/40 pt-32">
          Chargement…
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (state.status === "error" || state.data === null) {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-8 text-center text-navy font-mono uppercase tracking-widest gap-4">
         <div>Cette entité n'est pas publiée ou n'est plus disponible.</div>
         <a href="/stories" className="border-b border-navy/20 hover:border-navy transition-colors">Retour aux histoires</a>
      </div>
    );
  }

  const {
    entity: demoEntity,
    featuredStory: featuredEntityStory,
    languageStates: languageArticleStates,
    comparison: entityComparison,
    timeline: entityTimeline,
    relatedMatches,
  } = state.data;

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
