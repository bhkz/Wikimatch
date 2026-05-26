import { motion } from "motion/react";

export default function ObservatoryScopeStatement() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24">
        
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            PUBLIC, TRANSPARENT,<br/><span className="text-navy/40">MAIS PAS SANS LIMITES.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative">
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[1px] bg-navy/10" />
          
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="flex flex-col gap-8 pr-0 md:pr-12"
          >
             <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-navy border-b border-navy/20 pb-4">
               VISIBLE DANS L'OBSERVATOIRE
             </h3>
             <ul className="flex flex-col gap-4 font-sans text-lg text-navy/80 font-light list-disc pl-4">
                <li>Articles fictifs surveillés.</li>
                <li>Modifications et passages comparés.</li>
                <li>Changements mineurs ou substantiels.</li>
                <li>Liens entre traces et histoires publiées.</li>
                <li>Limites de lecture.</li>
             </ul>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="flex flex-col gap-8 pl-0 md:pl-12"
          >
             <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-[#e63946] border-b border-[#e63946]/30 pb-4">
               NON EXPOSÉ PUBLIQUEMENT
             </h3>
             <ul className="flex flex-col gap-4 font-sans text-lg text-navy/70 font-light list-disc pl-4">
                <li>Identité ou localisation de contributeurs.</li>
                <li>Adresse IP ou compte utilisateur.</li>
                <li>Candidats automatiques non validés.</li>
                <li>Sorties IA internes.</li>
                <li>Décisions détaillées du Desk éditorial.</li>
             </ul>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-8 md:mt-16 text-center max-w-4xl"
        >
           <h4 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-navy leading-tight border border-navy/10 p-8 md:p-12 bg-white">
             WIKIMATCH DOCUMENTE DES ARTICLES ET DES VERSIONS.<br/>IL NE SURVEILLE PAS DES PERSONNES.
           </h4>
        </motion.div>

      </div>
    </section>
  );
}
