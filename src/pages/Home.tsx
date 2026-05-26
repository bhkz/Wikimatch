import SiteHeader from "../components/SiteHeader";
import HeroSection from "../components/HeroSection";
import FeaturedStoryCard from "../components/FeaturedStoryCard";
import StoriesGrid from "../components/StoriesGrid";
import TrackedMatchPoster from "../components/TrackedMatchPoster";
import HowItWorksSection from "../components/HowItWorksSection";
import ObservatoryTeaser from "../components/ObservatoryTeaser";
import TrustSection from "../components/TrustSection";
import SiteFooter from "../components/SiteFooter";
import { dataProvider, useAsyncData } from "../data";

export default function Home() {
  const home = useAsyncData(() => dataProvider.getHomePageData(), []);

  return (
    <div className="min-h-screen bg-cream selection:bg-blue-electric selection:text-white">
      <SiteHeader />
      <main>
        {home.status === "loading" && <HomeLoading />}
        {home.status === "error" && <HomeError message={home.error.message} />}
        {home.status === "ready" && (
          <>
            <HeroSection featuredStory={home.data.featuredStory} />
            <FeaturedStoryCard featuredStory={home.data.featuredStory} />
            <StoriesGrid latestStories={home.data.latestStories} />
            <TrackedMatchPoster nextMatch={home.data.nextMatch} />
            <HowItWorksSection />
            <ObservatoryTeaser observatoryData={home.data.observatoryData} />
            <TrustSection />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function HomeLoading() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-4 md:px-8 pt-32">
      <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
        Chargement…
      </div>
    </section>
  );
}

function HomeError({ message }: { message: string }) {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 md:px-8 pt-32 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-red-signal">
        Données indisponibles
      </div>
      <div className="font-sans text-base text-navy/70 max-w-md">{message}</div>
    </section>
  );
}
