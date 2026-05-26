import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { FeaturedCollection, StoryArchiveItem } from "../../types";

export default function FeaturedCollectionSection({ collection, archiveStories }: { collection: FeaturedCollection, archiveStories: StoryArchiveItem[] }) {
  // Retrieve the full story objects corresponding to the IDs
  const stories = collection.storyIds
    .map(id => archiveStories.find(s => s.id === id))
    .filter((s): s is StoryArchiveItem => s !== undefined);

  if (stories.length === 0) return null;

  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-cream border-b border-navy/10 overflow-hidden relative bg-grid-pattern">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-6 md:w-2/3 lg:w-1/2">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-blue-electric/20 text-blue-electric border border-blue-electric/30 w-fit rounded-sm shadow-[0_0_10px_rgba(0,85,255,0.2)]">
            {collection.label}
          </div>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase text-white leading-none">
            {collection.title}
          </h2>
          <p className="font-sans text-xl text-cream/70 font-light leading-relaxed max-w-xl">
            {collection.description}
          </p>
        </div>

        <div className="relative w-full mt-8 md:mt-12">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[28px] left-[40px] right-[40px] h-[1px] bg-gradient-to-r from-blue-electric/50 via-cream/20 to-transparent" />
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
            {stories.map((story, i) => (
              <motion.div 
                key={story.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="flex flex-col gap-6 w-full lg:w-1/3 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-navy border border-blue-electric flex items-center justify-center font-display text-2xl text-blue-electric group-hover:bg-blue-electric group-hover:text-white transition-colors z-10 shadow-lg">
                    0{i + 1}
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 bg-white/5 border border-white/10 p-8 flex-grow hover:border-white/30 transition-colors">
                  <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
                     {story.categoryLabel}
                  </div>
                  <h3 className="font-display text-3xl uppercase text-cream leading-tight">
                    {story.title}
                  </h3>
                  <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                    {story.languages.map(l => (
                      <span key={l} className="bg-navy font-mono text-[10px] text-cream/70 font-bold px-2 py-1 rounded-sm border border-white/5 uppercase">
                         {l}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex justify-center lg:justify-start lg:pl-[104px] mt-8">
           {/* Scroll back to top of archive */}
           <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="border border-cream/20 text-cream px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-cream hover:text-navy transition-colors text-center shadow-lg">
             Explorer cette collection
           </button>
        </div>

      </div>
    </section>
  );
}
