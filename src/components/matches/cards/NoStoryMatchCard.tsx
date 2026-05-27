import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { TrackedMatchCard } from "../../../types";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function NoStoryMatchCard({ match, index }: { match: TrackedMatchCard, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.5 }}
      className="flex flex-col bg-cream-dark border border-navy/10 hover:border-navy/20 transition-colors shadow-sm h-full group"
    >
      <div className="bg-navy/5 px-6 py-3 border-b border-navy/10 flex justify-between items-center">
         <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/60">
           {match.statusLabel}
         </span>
         <span className="w-2 h-2 rounded-full border border-navy/30" />
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-6 flex-grow">
         
         <div className="flex justify-between items-start">
           <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-navy/5 px-2 py-1 border border-navy/10">
             {match.stageLabel}
           </div>
         </div>

         <div className="flex flex-col gap-2 my-2">
            <h4 className="font-display text-4xl uppercase text-navy/70 leading-none">
              {match.homeTeam.name} <span className="text-navy">{match.score?.[0]}</span><br/>
              <span className="text-navy/30">—</span><br/>
              {match.awayTeam.name} <span className="text-navy">{match.score?.[1]}</span>
            </h4>
         </div>

         <div className="flex flex-col gap-2 mt-auto text-navy/60">
            <p className="font-sans text-sm leading-relaxed font-light">
              {match.isDemo
                ? "Ce match fictif a été surveillé, mais aucun changement suffisamment significatif n'a été retenu pour publication."
                : "Ce match a été surveillé, mais aucun changement suffisamment significatif n'a été retenu pour publication."}
            </p>
         </div>

      </div>

      <div className="border-t border-navy/10">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 bg-transparent hover:bg-navy/5 text-navy font-mono text-[10px] uppercase font-bold tracking-widest flex justify-between items-center transition-colors"
        >
          <span>[Comprendre ce choix]</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-navy/5"
            >
              <div className="p-6 font-sans text-sm text-navy/70 font-light leading-relaxed border-t border-navy/10">
                 WikiMatch distingue les modifications brutes des changements qui méritent une histoire publique. Un match surveillé peut donc rester sans dossier narratif s'il n'y a pas de divergence majeure ou de phénomène éditorial remarquable.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
