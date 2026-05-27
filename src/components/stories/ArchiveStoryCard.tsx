import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { StoryArchiveItem } from "../../types";

export default function ArchiveStoryCard({ story, isLarge = false }: { story: StoryArchiveItem, isLarge?: boolean }) {
  
  // Decide target route
  // Use available route when present, otherwise keep card non-navigable
  let destination = "#";
  if (story.availableDetailRoute) {
    destination = story.availableDetailRoute;
  }

  // Determine styling based on category
  const isFact = story.type === "fact_entry";
  const isInstability = story.type === "article_instability";
  const isUnderRadar = story.type === "under_radar";
  const isRecap = story.type === "match_recap";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`flex flex-col border border-navy/10 bg-white hover:border-navy/30 transition-colors shadow-sm h-full group
        ${isLarge ? "md:col-span-2" : "col-span-1"}`}
    >
      <Link to={destination} className="flex flex-col h-full">
        {/* Top bar / Category */}
        <div className={`p-4 border-b border-navy/10 flex justify-between items-start ${isRecap ? 'bg-navy text-white' : 'bg-navy/5'}`}>
           <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white text-navy border border-navy/10">
             {story.categoryLabel}
           </span>
       </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 flex flex-col gap-4 flex-grow relative overflow-hidden">
          
          {/* Abstract Deco based on type */}
          {isInstability && <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-signal/5 to-transparent pointer-events-none" />}
          {isFact && <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-green-acid/5 to-transparent pointer-events-none" />}
          {isUnderRadar && <div className="absolute inset-0 bg-blue-electric/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />}

          <h3 className={`font-display uppercase leading-tight group-hover:text-blue-electric transition-colors z-10
            ${isLarge ? "text-4xl md:text-5xl lg:text-5xl" : "text-3xl lg:text-4xl"}
            ${isRecap ? "text-navy" : "text-navy"}`}
          >
            {story.title}
          </h3>
          
          <p className="font-sans text-sm text-navy/70 leading-relaxed font-light z-10 mt-2">
            {story.excerpt}
          </p>

          <div className="mt-auto z-10 pt-8 flex flex-col gap-3">
             {story.matchLabel && (
               <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy/50">
                 {story.matchLabel}
               </div>
             )}
             
             <div className="flex gap-2 items-center">
               {story.languages.map(l => (
                 <span key={l} className="bg-navy/5 px-2 py-1 rounded font-mono text-[10px] uppercase text-navy/80 font-bold">
                   {l}
                 </span>
               ))}
               <span className="ml-auto font-mono text-[10px] uppercase text-navy/40 tracking-widest">
                 {story.sourceCount} src
               </span>
             </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`px-6 md:px-8 py-4 border-t border-navy/10 flex justify-between items-center font-mono text-[10px] uppercase font-bold tracking-widest text-navy transition-colors ${destination === "#" ? "hover:bg-red-signal/5 hover:text-red-signal cursor-not-allowed" : "hover:bg-navy/5"}`}>
          <span>
            {destination === "#" ? "Page détail indisponible" : "Lire l'histoire"}
          </span>
          <span className="text-sm">→</span>
        </div>
      </Link>
    </motion.div>
  );
}
