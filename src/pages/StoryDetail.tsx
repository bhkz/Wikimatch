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

import { demoDivergenceStory } from "../mockStoryData";

export default function StoryDetail() {
  const { slug } = useParams();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // For this prototype, we only have one complete story
  if (slug !== "demo-divergence") {
    return <Navigate to="/" replace />;
  }

  const story = demoDivergenceStory;

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <ReadingProgressBar category={story.categoryLabel} />
      
      <main className="relative pt-[72px]">
        {/* Mobile structural order matches the desktop layout conceptually but CSS flex/grid handles the layout */}
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
