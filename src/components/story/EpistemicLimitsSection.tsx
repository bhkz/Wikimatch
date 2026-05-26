import { motion } from "motion/react";

export default function EpistemicLimitsSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-cream">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <h2 className="font-display text-5xl sm:text-7xl lg:text-[8rem] uppercase leading-none text-cream text-center md:text-left">
          OBSERVABLE.<br/>
          <span className="text-navy" style={{ WebkitTextStroke: "1px rgba(249, 248, 246, 0.4)" }}>PAS SURINTERPRÉTÉ.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mt-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-8 border-t border-cream/20 pt-8"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-blue-electric font-bold">
              CE QUE L’ON PEUT DIRE
            </div>
            <ul className="flex flex-col gap-4 font-sans text-lg md:text-xl font-light text-cream/90 leading-relaxed">
              <li className="flex gap-4"><span className="text-blue-electric">—</span>Trois articles linguistiques sont comparés.</li>
              <li className="flex gap-4"><span className="text-blue-electric">—</span>Deux mentionnent la sanction.</li>
              <li className="flex gap-4"><span className="text-blue-electric">—</span>Un seul mentionne l’altercation.</li>
              <li className="flex gap-4"><span className="text-blue-electric">—</span>Aucune mention équivalente n’est détectée dans la version française observée.</li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-8 border-t border-cream/20 pt-8"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-cream/50 font-bold">
              CE QUE L’ON NE PEUT PAS DIRE
            </div>
            <ul className="flex flex-col gap-4 font-sans text-lg md:text-xl font-light text-cream/60 leading-relaxed">
              <li className="flex gap-4"><span className="text-cream/30">×</span>Que les publics nationaux pensent différemment.</li>
              <li className="flex gap-4"><span className="text-cream/30">×</span>Que l’absence d’un passage est volontaire.</li>
              <li className="flex gap-4"><span className="text-cream/30">×</span>Que les modifications reflètent une opinion collective.</li>
              <li className="flex gap-4"><span className="text-cream/30">×</span>Que les différences resteront identiques dans le temps.</li>
            </ul>
          </motion.div>

        </div>

        <div className="mt-16 text-center w-full">
          <div className="inline-block border border-cream/20 py-4 px-8 font-display text-2xl md:text-4xl uppercase tracking-wider text-cream/80 bg-cream/5">
            UNE ÉDITION LINGUISTIQUE N’EST PAS UN PAYS.
          </div>
        </div>

      </div>
    </section>
  );
}
