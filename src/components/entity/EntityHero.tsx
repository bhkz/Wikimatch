import { motion } from "motion/react";
import DemoBadge from "../DemoBadge";
import { EntityProfile } from "../../types";
import { isDemoMode } from "../../data";

export default function EntityHero({ entity }: { entity: EntityProfile }) {
  
  const scrollToComparison = () => {
    document.getElementById('entity-comparison')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTimeline = () => {
    document.getElementById('entity-timeline')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[92svh] md:min-h-screen w-full flex flex-col justify-end overflow-hidden pt-32 pb-16 px-4 md:px-8 bg-cream text-navy border-b border-navy/10">
      
      {/* Background Image & Effects */}
      <motion.div 
         initial={{ y: -50 }}
         animate={{ y: 0 }}
         transition={{ duration: 1.5, ease: "easeOut" }}
         className="absolute inset-0 z-0 bg-cream"
      >
        <div className="absolute top-0 right-0 w-full lg:w-2/3 h-full overflow-hidden">
          <motion.img 
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            src="https://images.unsplash.com/photo-1574629810360-1ffb54cc357c?q=80&w=2600&auto=format&fit=crop" 
            alt="Gardien" 
            className="w-full h-full object-cover opacity-10 mix-blend-multiply grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-transparent lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/80 to-transparent block lg:hidden" />
          
          {/* Subtle JA in background */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 2 }}
            className="hidden lg:block absolute -right-20 top-32 font-display text-[30rem] leading-none text-[#e63946]/5 select-none pointer-events-none"
          >
            JA
          </motion.div>
        </div>
      </motion.div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-8 md:gap-16">
        
        <div className="flex flex-col items-start gap-4">
          <DemoBadge text={entity.demoLabel} />
          <div className="font-mono text-[10px] sm:text-xs text-navy/60 uppercase tracking-widest font-bold">
            DOSSIER JOUEUR · SOUS LE RADAR
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mt-8 md:mt-24">
          <div className="flex flex-col gap-6 md:w-2/3">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-wide leading-[0.85] text-navy">
              <span className="block overflow-hidden pb-1">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                   LE GARDIEN
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                   SUIVI AU JAPON
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1 text-navy/40">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                   AVANT D'APPARAÎTRE
                 </motion.span>
               </span>
               <span className="block overflow-hidden pb-1 text-navy/40">
                 <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                   AILLEURS.
                 </motion.span>
               </span>
            </h1>

            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.6 }}
               className="flex items-center gap-4 mt-6"
            >
               <h2 className="font-display text-4xl text-navy uppercase tracking-widest">{entity.name}</h2>
               {(isDemoMode || entity.isDemo) && (
                 <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#e63946] border border-[#e63946]/30 px-2 py-1">PERSONNAGE FICTIF</span>
               )}
            </motion.div>

            {(isDemoMode || entity.isDemo) && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="max-w-xl font-sans text-lg md:text-xl text-navy/70 leading-relaxed font-light mt-2"
              >
                Après un match fictif contre le Sénégal, l’édition japonaise enrichit son article avec plusieurs éléments de performance. Au même moment, les éditions anglaise et française observées restent beaucoup plus limitées.
              </motion.p>
            )}
            {!isDemoMode && !entity.isDemo && entity.shortDescription && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="max-w-xl font-sans text-lg md:text-xl text-navy/70 leading-relaxed font-light mt-2"
              >
                {entity.shortDescription}
              </motion.p>
            )}
            
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1.0 }}
               className="flex flex-wrap gap-2 mt-4"
            >
               <span className="font-mono text-[10px] uppercase font-bold tracking-widest bg-navy/5 px-3 py-1.5 text-navy">JA · EN · FR</span>
               <span className="font-mono text-[10px] uppercase font-bold tracking-widest bg-navy/5 px-3 py-1.5 text-navy">JAPON — SÉNÉGAL</span>
               <span className="font-mono text-[10px] uppercase font-bold tracking-widest bg-navy/5 px-3 py-1.5 text-blue-electric">SOUS LE RADAR</span>
            </motion.div>

          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col gap-4 w-full md:w-auto"
          >
             <button onClick={scrollToComparison} className="bg-navy text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric hover:text-white transition-colors w-full md:w-auto text-center">
               Comparer les éditions
             </button>
             <button onClick={scrollToTimeline} className="border border-navy/20 text-navy px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors w-full md:w-auto text-center">
               Voir la chronologie
             </button>
             
             {/* Mini comparative summary desktop */}
             <div className="hidden md:flex flex-col gap-2 mt-8 font-mono text-[10px] uppercase font-bold tracking-widest border-t border-navy/10 pt-4">
                <div className="flex justify-between items-center w-full min-w-[240px]">
                   <span className="text-[#e63946]">JA</span>
                   <span className="text-navy/70">Article enrichi</span>
                </div>
                <div className="flex justify-between items-center w-full">
                   <span className="text-blue-electric">EN</span>
                   <span className="text-navy/40">Ajouts non détectés</span>
                </div>
                <div className="flex justify-between items-center w-full">
                   <span className="text-navy/60">FR</span>
                   <span className="text-navy/40">Ajouts non détectés</span>
                </div>
             </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
