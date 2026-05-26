import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { TrackedMatchCard } from "../../../types";

export default function UpcomingMatchCard({ match, index }: { match: TrackedMatchCard, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
      className="flex flex-col bg-white border border-navy/10 hover:border-navy/30 transition-colors shadow-sm h-full group"
    >
      {/* Target status bar */}
      <div className="bg-navy/5 px-6 py-3 border-b border-navy/10 flex justify-between items-center">
         <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/60">
           {match.statusLabel}
         </span>
         <span className="w-2 h-2 rounded-full bg-navy/20" />
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-6 flex-grow">
         
         <div className="flex justify-between items-start">
           <div className="flex flex-col font-mono text-[10px] uppercase font-bold tracking-widest text-navy/40">
             <span>{match.dateLabel}</span>
             <span>{match.timeLabel}</span>
           </div>
           <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-navy/5 px-2 py-1 border border-navy/10">
             {match.stageLabel}
           </div>
         </div>

         <div className="flex flex-col gap-1 my-2">
            <h4 className="font-display text-4xl uppercase text-navy leading-none">
              {match.homeTeam.name}<br/>
              <span className="text-navy/40">—</span><br/>
              {match.awayTeam.name}
            </h4>
         </div>

         <div className="flex flex-col gap-2 mt-auto">
            <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-navy mb-1">
              Ce que WikiMatch suivra :
            </div>
            <div className="font-sans text-sm text-navy/70 leading-relaxed font-light">
               {match.monitoredSubjects.join(" · ")}
            </div>
            <div className="font-sans text-sm text-navy/50 leading-relaxed font-light mt-2 italic">
              {match.editorialSummary}
            </div>
         </div>

      </div>

      <div className="px-6 py-4 border-t border-navy/10 bg-navy/5 flex flex-col gap-2">
        <div className="text-navy/40 font-mono text-[10px] uppercase font-bold tracking-widest text-center cursor-not-allowed">
          [Voir le suivi prévu]
        </div>
        {match.id === "demo-japan-senegal" && (
           <Link to="/entity/demo-japan-goalkeeper" className="text-blue-electric hover:text-blue-electric/70 transition-colors font-mono text-[10px] uppercase font-bold tracking-widest text-center mt-2 decoration-blue-electric/30 underline">
             Voir le joueur observé
           </Link>
        )}
      </div>

    </motion.div>
  );
}
