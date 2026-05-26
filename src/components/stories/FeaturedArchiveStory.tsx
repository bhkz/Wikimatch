import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { StoryArchiveItem } from "../../types";

export default function FeaturedArchiveStory({ story }: { story: StoryArchiveItem }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        
        <div className="flex items-center gap-4">
          <h2 className="font-mono text-sm uppercase font-bold tracking-widest text-navy bg-navy/5 px-4 py-2 border border-navy/10 w-fit">
            À LA UNE
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 border border-navy/10 bg-white hover:border-navy/30 transition-colors shadow-sm group">
          
          {/* Left: Image / Graphic */}
          <div className="w-full lg:w-5/12 aspect-[4/3] lg:aspect-auto lg:min-h-full bg-navy relative overflow-hidden">
            <motion.img 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 1 }}
              src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1600&auto=format&fit=crop" 
              alt="Story Cover"
              className="w-full h-full object-cover opacity-60 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-80" />
            
          </div>

          {/* Right: Content */}
          <div className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-blue-electric">
                {story.categoryLabel}
              </div>
              <h3 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide leading-[0.9] text-navy group-hover:text-blue-electric transition-colors">
                {story.title}
              </h3>
              <p className="font-sans text-lg text-navy/70 leading-relaxed font-light mt-2 max-w-xl">
                {story.excerpt}
              </p>
            </div>


            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-auto pt-8 border-t border-navy/10">
               <div className="flex flex-col gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                 <span>{story.matchLabel}</span>
                 <span className="flex items-center gap-2">
                   {story.languages.map(l => (
                     <span key={l} className="bg-navy/5 px-2 py-0.5 rounded-sm">{l}</span>
                   ))}
                 </span>
                 <span className="mt-2 text-navy/40 font-normal">{story.sourceCount} sources comparées · {story.readingTimeLabel} de lecture</span>
               </div>
               
               <Link 
                 to={story.availableDetailRoute || "#"} 
                 className="bg-navy text-white px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest hover:bg-blue-electric transition-colors text-center w-full md:w-auto mt-4 md:mt-0"
               >
                 Lire l'histoire complète
               </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
