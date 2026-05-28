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
            {home.data.featuredStory ? (
              <>
                <HeroSection featuredStory={home.data.featuredStory} />
                <FeaturedStoryCard featuredStory={home.data.featuredStory} />
              </>
            ) : (
              <HomeNoStoriesHero />
            )}
            {home.data.latestStories.length > 0 && (
              <StoriesGrid latestStories={home.data.latestStories} />
            )}
            {home.data.nextMatch && (
              <TrackedMatchPoster nextMatch={home.data.nextMatch} />
            )}
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

/**
 * Empty state honnête : la DB ne contient aucune story publiée encore.
 * Pas de fixture maquillée en réel — on annonce explicitement que le pipeline
 * automatique n'a pas encore validé d'histoire publiable.
 */
function HomeNoStoriesHero() {
  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-center overflow-hidden pt-24 pb-12 px-4 md:px-8 bg-navy text-cream">
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-8 md:gap-12">
        <p className="font-mono text-xs md:text-sm text-cream/70 uppercase tracking-widest">
          WIKIMATCH · COUPE DU MONDE 2026 · MÉDIA DATA INDÉPENDANT
        </p>
        <h1 className="font-display text-[3.5rem] leading-[0.9] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] xl:text-[8.5rem] uppercase tracking-wide">
          <span className="block">Le match se joue</span>
          <span className="block">sur le terrain.</span>
          <span className="block text-blue-electric">Aucune histoire</span>
          <span className="block text-blue-electric">publiée pour l'instant.</span>
        </h1>
        <p className="font-sans text-sm md:text-lg text-cream/80 leading-relaxed font-light max-w-xl">
          WikiMatch est conçu pour observer les modifications Wikipédia liées aux matchs suivis. Aucune histoire n'est publiée sans vérification dans les modifications sources.
        </p>
      </div>
    </section>
  );
}
