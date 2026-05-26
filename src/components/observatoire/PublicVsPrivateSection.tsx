import { motion } from "motion/react";

export default function PublicVsPrivateSection() {
  return (
    <section className="py-24 md:py-32 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24 relative">
        
        <div className="flex flex-col gap-6 text-center md:text-left max-w-4xl mx-auto md:mx-0">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            TRANSPARENT<br/><span className="text-navy/40">NE VEUT PAS DIRE</span><br/>TOUT EXPOSER.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light mt-4">
            L'Observatoire permet de consulter les traces et leurs liens avec les histoires publiées. La détection de candidats, les suggestions de traduction, la revue éditoriale et les décisions de publication appartiendront à un espace privé séparé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative w-full">
           
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="bg-white border border-navy/10 p-8 md:p-12 flex flex-col gap-6 shadow-sm"
           >
              <h3 className="font-mono text-sm uppercase font-bold tracking-widest text-navy border-b border-navy/10 pb-4">
                VISIBLE PUBLIQUEMENT
              </h3>
              <ul className="flex flex-col gap-4 font-sans text-lg text-navy/80 font-light list-disc pl-4">
                 <li>Modifications observées</li>
                 <li>Diffs et traductions publiées</li>
                 <li>Stories reliées à leurs sources</li>
                 <li>Articles suivis</li>
              </ul>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="bg-navy/5 border border-navy/10 p-8 md:p-12 flex flex-col gap-6"
           >
              <h3 className="font-mono text-sm uppercase font-bold tracking-widest text-navy/50 border-b border-navy/10 pb-4">
                RÉSERVÉ AU DESK PRIVÉ FUTUR
              </h3>
              <ul className="flex flex-col gap-4 font-sans text-lg text-navy/60 font-light list-disc pl-4">
                 <li>Candidats non validés</li>
                 <li>Sorties IA de travail</li>
                 <li>Validation / rejet</li>
                 <li>Réglages et publication</li>
              </ul>
           </motion.div>

        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-8 md:mt-12 text-center max-w-4xl"
        >
           <h4 className="font-display text-4xl sm:text-5xl uppercase tracking-wide text-navy leading-tight py-8 md:py-12 px-6">
             LA TRANSPARENCE PORTE SUR LES PREUVES.<br/>LA REVUE INTERNE RESTE UNE RESPONSABILITÉ ÉDITORIALE.
           </h4>
        </motion.div>

      </div>
    </section>
  );
}
