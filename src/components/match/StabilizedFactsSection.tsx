import { motion } from "motion/react";

export default function StabilizedFactsSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4 text-center md:text-left max-w-2xl">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            CE QUI RESTE<br/>APRÈS LE MATCH
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
            Certaines informations apparaissent dans plusieurs éditions et restent présentes dans les versions observées.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-navy/10 p-8 md:p-12 shadow-sm max-w-4xl mx-auto md:mx-0 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-green-acid/5 to-transparent pointer-events-none" />
          
          <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-navy/40 mb-8 w-fit px-3 py-1 bg-navy/5 rounded">
            MISE À JOUR CONVERGENTE · DÉMONSTRATION
          </div>

          <p className="font-sans text-xl md:text-2xl text-navy leading-relaxed font-light max-w-2xl">
            Le résultat final apparaît désormais dans les éditions anglaise, française et espagnole de la page fictive du match.
          </p>

          <div className="flex flex-col gap-4 mt-8 font-mono text-sm border-l-2 border-green-acid/50 pl-6">
             <div className="flex items-center gap-4">
               <span className="font-bold text-navy w-6">EN</span>
               <span className="text-navy/60">Présent depuis <span className="text-navy font-bold">22:41</span></span>
             </div>
             <div className="flex items-center gap-4">
               <span className="font-bold text-navy w-6">FR</span>
               <span className="text-navy/60">Présent depuis <span className="text-navy font-bold">22:46</span></span>
             </div>
             <div className="flex items-center gap-4">
               <span className="font-bold text-navy w-6">ES</span>
               <span className="text-navy/60">Présent depuis <span className="text-navy font-bold">22:50</span></span>
             </div>
          </div>

          <div className="mt-12 flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-navy">STATUT OBSERVÉ</span>
            <span className="font-display text-2xl text-navy/80 uppercase">Mise à jour factuelle convergente.</span>
          </div>
          
        </motion.div>

        <div className="font-mono text-[10px] sm:text-xs text-navy/40 uppercase tracking-widest max-w-4xl mx-auto md:mx-0 bg-cream border border-navy/10 p-4 border-l-0 border-r-0 border-b-0 text-center md:text-left">
          Stable dans les versions observées à ce stade. L'article peut toujours évoluer ultérieurement.
        </div>

      </div>
    </section>
  );
}
