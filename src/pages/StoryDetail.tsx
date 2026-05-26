import { useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ReadingProgressBar from "../components/story/ReadingProgressBar";
import StoryHero from "../components/story/StoryHero";
import StoryExecutiveSummary from "../components/story/StoryExecutiveSummary";
import LanguageComparison from "../components/story/LanguageComparison";
import ComparisonMatrix from "../components/story/ComparisonMatrix";
import StoryTimeline from "../components/story/StoryTimeline";
import EpistemicLimitsSection from "../components/story/EpistemicLimitsSection";
import StorySourcesSection from "../components/story/StorySourcesSection";
import RelatedMatchPoster from "../components/story/RelatedMatchPoster";
import RelatedStoriesSection from "../components/story/RelatedStoriesSection";
import StoryFinalCTA from "../components/story/StoryFinalCTA";
import { dataProvider, useAsyncData } from "../data";

export default function StoryDetail() {
  const { slug } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const state = useAsyncData(
    () => dataProvider.getStoryBySlug(slug ?? ""),
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
    // Slug inconnu en mode demo → on renvoie vers la home, comportement
    // historique préservé.
    return <Navigate to="/" replace />;
  }

  const { story } = state.data;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <ReadingProgressBar category={story.categoryLabel} />

      <main className="relative pt-[72px]">
        <StoryHero story={story} />
        <StoryExecutiveSummary story={story} />
        <LanguageComparison story={story} />
        <ComparisonMatrix />
        <StoryTimeline story={story} />
        <EpistemicLimitsSection />
        <StorySourcesSection story={story} />
        <RelatedMatchPoster />
        <RelatedStoriesSection />
        <StoryFinalCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
