import { motion } from "motion/react";
import ArchiveStoryCard from "./ArchiveStoryCard";
import { StoryArchiveItem, StoryArchiveFilter } from "../../types";

export default function StoriesEditorialGrid({ stories, activeFilter, isFiltering }: { stories: StoryArchiveItem[], activeFilter: StoryArchiveFilter, isFiltering: boolean }) {
  
  if (stories.length === 0) {
    return (
      <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 min-h-[50vh] flex items-center justify-center text-center">
        <div className="flex flex-col gap-4 items-center">
          <div className="font-mono text-xs uppercase font-bold tracking-widest text-navy/40 mb-4 px-4 py-2 border border-navy/10 inline-block">
            AUCUNE HISTOIRE DANS CETTE SÉLECTION
          </div>
          <p className="font-sans text-lg text-navy/60 font-light max-w-md leading-relaxed">
            Dans la version réelle, WikiMatch n'affichera ici que les histoires effectivement vérifiées et publiées.
          </p>
        </div>
      </section>
    );
  }

  // To create a magazine layout, we will randomly or deterministically make some cards large
  // For demo logic, we'll make the first one large if it's the "all" view.
  
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
