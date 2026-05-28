import { motion } from "motion/react";
import ArchiveStoryCard from "./ArchiveStoryCard";
import { StoryArchiveItem, StoryArchiveFilter } from "../../types";

export default function StoriesEditorialGrid({ stories, activeFilter, isFiltering }: { stories: StoryArchiveItem[], activeFilter: StoryArchiveFilter, isFiltering: boolean }) {
  
  if (stories.length === 0) {
    return (
      <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 min-h-[50vh] flex items-center justify-center text-center">
        <div className="flex flex-col gap-6 items-center max-w-xl">
          <div className="font-mono text-xs uppercase font-bold tracking-widest text-navy/40 px-4 py-2 border border-navy/10 inline-block">
            Aucune histoire documentée publiée pour le moment
          </div>
          <p className="font-sans text-base md:text-lg text-navy/70 leading-relaxed font-light">
            WikiMatch observe comment les grands matchs sont documentés dans plusieurs éditions de Wikipédia. Les premiers récits seront affichés uniquement lorsqu'ils pourront être reliés à un match réel et vérifiés dans les modifications sources.
          </p>
          <a
            href="/matches"
            className="font-mono text-xs uppercase tracking-widest px-6 py-3 border border-navy/20 text-navy hover:bg-navy hover:text-cream transition-all duration-300 inline-block"
          >
            Voir les matchs
          </a>
        </div>
      </section>
    );
  }

  // To create a magazine layout, we will randomly or deterministically make some cards large
  // Layout rule: emphasize selected cards on larger breakpoints.
  
  return (
    <section className="py-16 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-2 border-b border-navy/10 pb-4">
          <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy/50">
            {isFiltering ? "RÉSULTATS FILTRÉS" : "TOUTES LES HISTOIRES"}
          </div>
          <div className="font-display text-4xl text-navy uppercase tracking-wide">
            {activeFilter.label === "Toutes" ? "ARCHIVE COMPLÈTE" : activeFilter.label}
            <span className="ml-4 text-blue-electric/50 text-2xl">{stories.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, i) => {
            // Determine size: every 4th item or the first of certain types could be large on desktop
            const isLargeDesktop = i === 0 || i === 4 || story.type === 'match_recap';
            
            return (
              <div key={story.id} className={isLargeDesktop ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'}>
                 <ArchiveStoryCard story={story} isLarge={isLargeDesktop} />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
