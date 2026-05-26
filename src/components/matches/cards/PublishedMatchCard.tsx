import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { TrackedMatchCard } from "../../../types";

export default function PublishedMatchCard({ match, index }: { match: TrackedMatchCard, index: number }) {
  
  const destination = match.availableRoute || "#";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
      className="flex flex-col bg-navy text-white border border-navy/10 hover:border-blue-electric transition-colors shadow-md h-full relative group"
    >
      {/* Target status bar */}
      <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex justify-between items-center relative z-10">
         <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream flex items-center gap-2">
           {match.statusLabel}
         </span>
         <span className="w-2 h-2 rounded-full bg-cream/50" />
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-6 flex-grow relative z-10">
         
         <div className="flex justify-between items-start">
           <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-cream bg-white/10 px-2 py-1 border border-white/10">
             {match.stageLabel}
           </div>
         </div>

         <div className="flex flex-col gap-2 my-2">
            <h4 className="font-display text-5xl uppercase text-white leading-none">
              {match.homeTeam.name} <span className="text-blue-electric ml-2">{match.score?.[0]}</span><br/>
              <span className="text-white/40">—</span><br/>
              {match.awayTeam.name} <span className="text-blue-electric ml-2">{match.score?.[1]}</span>
            </h4>
         </div>

         <div className="flex flex-col gap-4 mt-auto border-t border-white/10 pt-6">
            <div className="flex flex-col gap-2 font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-cream/70">
              <span className="text-cream">{match.storyCount} histoires publiées</span>
              <span className="flex items-center gap-2 mt-1">
                {match.languagesCompared?.map(l => (
                   <span key={l} className="bg-white/10 px-2 py-0.5 rounded-sm">{l}</span>
                ))}
              </span>
            </div>
            <div className="font-sans text-sm text-cream/90 leading-relaxed font-light mt-2 border-l-2 border-blue-electric pl-3">
              {match.editorialSummary}
            </div>
         </div>

      </div>

      <Link 
        to={destination}
        className="px-6 py-4 border-t border-white/10 bg-blue-electric text-white font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center hover:bg-white hover:text-navy transition-colors"
      >
        <span>[Ouvrir le dossier]</span>
        <span className="text-sm">→</span>
      </Link>

    </motion.div>
  );
}
