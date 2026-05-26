import SiteHeader from "../components/SiteHeader";
import HeroSection from "../components/HeroSection";
import FeaturedStoryCard from "../components/FeaturedStoryCard";
import StoriesGrid from "../components/StoriesGrid";
import TrackedMatchPoster from "../components/TrackedMatchPoster";
import HowItWorksSection from "../components/HowItWorksSection";
import ObservatoryTeaser from "../components/ObservatoryTeaser";
import TrustSection from "../components/TrustSection";
import SiteFooter from "../components/SiteFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <main>
        <HeroSection />
        <FeaturedStoryCard />
        <StoriesGrid />
        <TrackedMatchPoster />
        <HowItWorksSection />
        <ObservatoryTeaser />
        <TrustSection />
      </main>
      <SiteFooter />
    </div>
  );
}
