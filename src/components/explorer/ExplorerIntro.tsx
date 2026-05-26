import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function ExplorerIntro() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24 relative">
        
        <div className="flex flex-col gap-6 text-center md:text-left max-w-4xl mx-auto md:mx-0">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            DES HISTOIRES VISUALISÉES.<br/><span className="text-navy/40">PAS UN FLUX BRUT.</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light mt-4">
            Explorer organise uniquement des histoires fictives supposées publiées dans cette démonstration : un fait entré dans Wikipédia, une divergence entre éditions, un article instable ou un sujet sous le radar. Les modifications brutes, les sources techniques et les observations non publiées vivront dans l'Observatoire.
          </p>
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
               Ici, dans Explorer
             </h3>
             <div className="flex flex-col gap-4">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">HISTOIRES PUBLIÉES</div>
                <ul className="flex flex-col gap-4 font-sans text-lg text-navy/80 font-light list-disc pl-4">
                  <li>Sujets cartographiés</li>
                  <li>Éditions comparées</li>
                  <li>Timelines éditoriales</li>
                  <li>Dossiers accessibles</li>
                </ul>
             </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="flex flex-col gap-8 pl-0 md:pl-12"
          >
             <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-[#e63946] border-b border-[#e63946]/30 pb-4">
               Plus tard, dans l'Observatoire
             </h3>
             <div className="flex flex-col gap-4">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">TRACES BRUTES</div>
                <ul className="flex flex-col gap-4 font-sans text-lg text-navy/70 font-light list-disc pl-4">
                  <li>Modifications sources</li>
                  <li>Articles observés</li>
                  <li>Filtres techniques</li>
                  <li>Données de transparence</li>
                </ul>
             </div>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
           <button onClick={() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' })} className="bg-navy text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric hover:text-white transition-colors text-center w-full sm:w-auto shadow-md">
             Explorer les visualisations
           </button>
           <Link to="/observatoire" className="bg-transparent border border-navy/20 text-navy px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors text-center w-full sm:w-auto flex items-center justify-center">
             Ouvrir l'Observatoire
           </Link>
        </div>

      </div>
    </section>
  );
}
