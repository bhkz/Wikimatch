import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function MinorTraceExplanationSection() {
  return (
    <section className="py-24 md:py-32 px-4 md:px-8 bg-white border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24 relative">
        
        <div className="flex flex-col gap-6 text-center md:text-left max-w-4xl mx-auto md:mx-0">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            ET PARFOIS,<br/><span className="text-navy/40">LA TRACE</span><br/>S'ARRÊTE LÀ.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light mt-4">
            Certaines modifications sont réelles et visibles, mais n'ajoutent rien au récit du tournoi. Les montrer dans l'Observatoire ne signifie pas les publier dans le Magazine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 max-w-5xl mx-auto md:mx-0 w-full items-center">
           
           <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-6 lg:col-span-5 bg-cream border border-navy/10 p-6 md:p-8 flex flex-col gap-6 shadow-sm"
           >
              <div className="flex flex-col gap-1">
                 <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/50">FR · PAGE DU TOURNOI · 22:36:04</div>
                 <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 border border-navy/10 bg-white px-2 py-0.5 w-fit mt-2">MINEUR · NON PUBLIÉ</div>
              </div>
              <div className="flex flex-col gap-2 font-mono text-xs">
                 <div className="text-navy/60">Correction observée :</div>
                 <div className="text-[#e63946] line-through decoration-1">« ... organisée en 2026 »</div>
                 <div className="text-navy/40 text-[10px]">devient</div>
                 <div className="text-[#2a9d8f]">« ... organisée en 2026. »</div>
              </div>
              <div className="font-sans text-sm text-navy/70 font-light border-t border-navy/10 pt-4">
                 <span className="font-bold mr-2">Lecture :</span>une correction de ponctuation, sans changement narratif identifié.
              </div>
           </motion.div>

           <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-8 md:pl-12">
              <div className="flex flex-col gap-2 border-l-2 border-navy pl-6 py-2">
                 <h4 className="font-mono text-sm uppercase font-bold tracking-widest text-navy">VISIBLE</h4>
                 <p className="font-sans text-lg text-navy/70 font-light leading-relaxed">
                   La modification source et son caractère mineur figurent dans l'Observatoire.
                 </p>
              </div>
              
              <div className="flex flex-col gap-2 border-l-2 border-navy/20 pl-6 py-2">
                 <h4 className="font-mono text-sm uppercase font-bold tracking-widest text-navy/40">NON PUBLIÉE</h4>
                 <p className="font-sans text-lg text-navy/50 font-light leading-relaxed">
                   Aucune story, aucune alerte, aucune dramatisation dans le Magazine public.
                 </p>
              </div>
              
              <div className="mt-4 pl-6">
                 <Link to="/stories" className="border border-navy/20 text-navy px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors inline-block text-center shadow-sm">
                   Voir les histoires réellement publiées
                 </Link>
              </div>
           </div>

        </div>

      </div>
    </section>
  );
}
