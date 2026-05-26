import { motion } from "motion/react";
import { TrackedMatchCard } from "../../../types";

export default function ObservingMatchCard({ match, index }: { match: TrackedMatchCard, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
      className="flex flex-col bg-white border border-blue-electric/30 hover:border-blue-electric transition-colors shadow-md h-full relative group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-electric/10 to-transparent pointer-events-none" />

      {/* Target status bar */}
      <div className="bg-blue-electric/5 px-6 py-3 border-b border-blue-electric/20 flex justify-between items-center relative z-10">
         <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric flex items-center gap-2">
           {match.statusLabel}
         </span>
         <span className="w-2 h-2 rounded-full bg-blue-electric animate-pulse" />
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-6 flex-grow relative z-10">
         
         <div className="flex justify-between items-start">
           <div className="flex flex-col font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
             <span>{match.timeLabel}</span>
           </div>
           <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-navy/5 px-2 py-1 border border-navy/10">
             {match.stageLabel}
           </div>
         </div>

         <div className="flex flex-col gap-2 my-2">
            <h4 className="font-display text-4xl uppercase text-navy leading-tight">
              {match.homeTeam.name} <span className="text-blue-electric">{match.score?.[0]}</span><br/>
              <span className="text-navy/40">—</span><br/>
              {match.awayTeam.name} <span className="text-blue-electric">{match.score?.[1]}</span>
            </h4>
         </div>

         <div className="flex flex-col gap-4 mt-auto border-l-2 border-blue-electric/30 pl-4">
            <div className="font-sans text-sm text-navy/80 leading-relaxed font-light">
              Des articles suivis ont changé.<br/>
              Aucune histoire n'est encore publiée.
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/50">
                Éditions en cours de comparaison :
              </span>
              <div className="flex gap-2 mt-1">
                 {match.languagesCompared?.map(l => (
                   <span key={l} className="bg-blue-electric/10 text-blue-electric px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold">{l}</span>
                 ))}
              </div>
            </div>
         </div>

      </div>

      <div className="px-6 py-4 border-t border-blue-electric/20 bg-blue-electric/5 text-blue-electric font-mono text-[10px] uppercase font-bold tracking-widest text-center cursor-not-allowed hover:bg-blue-electric/10 transition-colors">
        [Voir les observations]
      </div>

    </motion.div>
  );
}
