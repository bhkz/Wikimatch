import { motion } from "motion/react";
import DemoBadge from "../DemoBadge";

export default function ObservatoryHero() {
  
  const scrollToTraces = () => {
    document.getElementById('trace-browser')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const scrollToStorySource = () => {
    document.getElementById('story-source-chain')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[82svh] md:min-h-screen w-full flex flex-col justify-end overflow-hidden pt-32 pb-16 px-4 md:px-8 bg-cream text-navy border-b border-navy/10 scroll-m-20">
      
      {/* Background Graphic */}
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 1.5 }}
         className="absolute inset-0 z-0 bg-cream flex items-center justify-center opacity-30 select-none pointer-events-none"
      >
         <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-transparent z-10" />
         
         <div className="w-full max-w-7xl font-mono text-[8px] md:text-[10px] text-navy/20 leading-relaxed translate-x-4 md:translate-x-12 translate-y-12">
            <div>+ He was sent off after an altercation</div>
            <div>+ with an opponent in the final minutes.</div>
            <div className="my-2">- 23:06:21 · EN</div>
            <div>+ Il est expulsé après une altercation</div>
            <div>+ EN · ARTICLE DU JOUEUR</div>
            <div className="my-2">- 22:51:34 · FR</div>
            <div>+ 試合終盤に決定的なセーブを記録し</div>
         </div>
      </motion.div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-8 md:gap-16">
        
        <div className="flex flex-col items-start gap-4">
          <DemoBadge text="DÉMONSTRATION D’INTERFACE · TRACES FICTIVES · AUCUNE DONNÉE RÉELLE" />
          <div className="font-mono text-[10px] sm:text-xs text-navy/60 uppercase tracking-widest font-bold">
            OBSERVATOIRE · SOURCES ET TRACES · WIKIMATCH
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mt-8 md:mt-24">
          <div className="flex flex-col gap-6 md:w-2/3">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-wide leading-[0.85] text-navy">
               <span className="block overflow-hidden pb-1">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                   VOIR
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block text-navy/70">
                   CE QUI CHANGE.
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1 mt-4">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                   COMPRENDRE
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block text-navy/70">
                   CE QUI MÉRITE
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block text-navy/70">
                   D'ÊTRE RACONTÉ.
                 </motion.span>
               </span>
            </h1>

            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.8 }}
               className="bg-white border border-navy/10 p-6 md:p-8 mt-6 max-w-xl shadow-sm"
            >
               <h2 className="font-mono text-sm uppercase font-bold tracking-widest text-navy mb-4">REJEU FICTIF</h2>
               <p className="font-sans text-sm md:text-base text-navy/70 leading-relaxed font-light">
                 Cette interface ne reçoit aucune donnée réelle. Elle démontre comment les traces publiques pourraient être consultées et reliées à une histoire. L’Observatoire expose les articles surveillés, les modifications observées et les passages comparés derrière les histoires publiées par WikiMatch.
               </p>
            </motion.div>

          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col gap-4 w-full md:w-auto"
          >
             <button onClick={scrollToTraces} className="bg-navy text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric hover:text-white transition-colors w-full md:w-auto text-center shadow-lg">
               Explorer les traces
             </button>
             <button onClick={scrollToStorySource} className="border border-navy/20 text-navy px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors w-full md:w-auto text-center bg-white">
               Voir une histoire reliée à ses sources
             </button>
             
             <div className="mt-8 font-mono text-[10px] uppercase font-bold tracking-widest text-navy/40 border-t border-navy/10 pt-4">
                UNE MODIFICATION N'EST PAS UNE HISTOIRE.<br/>C'EST UNE TRACE À LIRE.
             </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
