import { motion } from "motion/react";

export default function EntityEpistemicLimitsSection() {
  return (
    <section className="py-24 md:py-32 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 lg:gap-24">
        
        <div className="flex flex-col gap-6 text-center md:text-left max-w-4xl mx-auto md:mx-0">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide text-navy leading-[1.1]">
            PLUS DOCUMENTÉ<br/>NE VEUT PAS DIRE<br/>PLUS IMPORTANT PARTOUT.
          </h2>
          <p className="font-sans text-lg md:text-xl text-navy/70 leading-relaxed font-light mt-2">
            Un article plus développé dans une édition linguistique peut refléter un intérêt éditorial local, un rythme de mise à jour différent ou simplement un contributeur disponible à ce moment-là. WikiMatch documente le décalage observé. Il n’en invente pas la cause.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative">
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="flex flex-col gap-8"
          >
             <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-navy border-b border-navy/20 pb-4">
               Ce que l'on observe
             </h3>
             <div className="flex flex-col gap-4 font-sans text-lg text-navy/80 font-light">
                <div className="flex gap-4">
                   <div className="font-mono text-[10px] bg-navy text-white px-2 py-1 mt-1 shrink-0 h-fit">OUI</div>
                   <span>L'article japonais contient trois ajouts substantiels.</span>
                </div>
                <div className="flex gap-4">
                   <div className="font-mono text-[10px] bg-navy text-white px-2 py-1 mt-1 shrink-0 h-fit">OUI</div>
                   <span>Les articles anglais et français comparés n'intègrent pas ces éléments à l'instant observé.</span>
                </div>
                <div className="flex gap-4">
                   <div className="font-mono text-[10px] bg-navy text-white px-2 py-1 mt-1 shrink-0 h-fit">OUI</div>
                   <span>Le décalage est documentable et sourçable.</span>
                </div>
             </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="flex flex-col gap-8"
          >
             <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-[#e63946] border-b border-[#e63946]/30 pb-4">
               Ce que l'on ne conclut pas
             </h3>
             <div className="flex flex-col gap-4 font-sans text-lg text-navy/70 font-light">
                <div className="flex gap-4 opacity-70">
                   <div className="font-mono text-[10px] bg-[#e63946] text-white px-2 py-1 mt-1 shrink-0 h-fit">NON</div>
                   <span>Que le joueur est ignoré hors du Japon.</span>
                </div>
                <div className="flex gap-4 opacity-70">
                   <div className="font-mono text-[10px] bg-[#e63946] text-white px-2 py-1 mt-1 shrink-0 h-fit">NON</div>
                   <span>Que les communautés jugent différemment sa performance.</span>
                </div>
                <div className="flex gap-4 opacity-70">
                   <div className="font-mono text-[10px] bg-[#e63946] text-white px-2 py-1 mt-1 shrink-0 h-fit">NON</div>
                   <span>Que l'article japonais restera le plus détaillé.</span>
                </div>
                <div className="flex gap-4 opacity-70">
                   <div className="font-mono text-[10px] bg-[#e63946] text-white px-2 py-1 mt-1 shrink-0 h-fit">NON</div>
                   <span>Que cette différence représente une opinion nationale.</span>
                </div>
             </div>
          </motion.div>

        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-12 md:mt-24 text-center max-w-3xl border border-navy/10 p-8 md:p-16 bg-white"
        >
           <h4 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
             UNE ÉDITION LINGUISTIQUE<br/>N'EST PAS UN PAYS.
           </h4>
        </motion.div>

      </div>
    </section>
  );
}
