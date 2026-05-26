import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function ArchiveMethodologyBlock() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl uppercase text-navy leading-[0.9]">
            <span className="block mb-2">TOUT CE QUI</span>
            <span className="block mb-2 text-navy/60">BOUGE</span>
            <span className="block mb-2 text-navy/40">NE DEVIENT PAS</span>
            <span className="block">UNE HISTOIRE.</span>
          </h2>
          <p className="font-sans text-xl text-navy/80 font-light leading-relaxed mt-4">
            WikiMatch peut observer de nombreuses modifications. Mais l'archive publique ne retient que les changements compréhensibles, sourcés et dignes d'être racontés.
          </p>
          <div className="flex flex-col gap-4 mt-8">
            <Link to="/observatoire" className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/50 hover:text-navy underline decoration-navy/20 transition-colors w-fit">
              Ouvrir l'Observatoire
            </Link>
            <Link to="/methodology" className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy bg-navy/5 border border-navy/10 px-4 py-2 hover:bg-navy hover:text-white transition-colors w-fit text-center">
              Lire la méthodologie complète
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-7/12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 pt-4 lg:pt-0">
          
          <div className="flex flex-col gap-8">
             <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric border-b-2 border-blue-electric pb-4">
               PUBLIABLE
             </h3>
             <ul className="flex flex-col gap-6 font-sans text-lg text-navy font-light leading-relaxed list-none m-0 p-0">
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-1.5 before:h-1.5 before:bg-blue-electric before:rounded-full">Un résultat ou un record ajouté.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-1.5 before:h-1.5 before:bg-blue-electric before:rounded-full">Une différence observable entre éditions.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-1.5 before:h-1.5 before:bg-blue-electric before:rounded-full">Un passage ajouté, retiré puis restauré.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-1.5 before:h-1.5 before:bg-blue-electric before:rounded-full">Un sujet documenté ailleurs avant d'être visible ici.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-1.5 before:h-1.5 before:bg-blue-electric before:rounded-full">Un recap construit à partir d'histoires validées.</li>
             </ul>
          </div>

          <div className="flex flex-col gap-8">
             <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/40 border-b-2 border-navy/10 pb-4">
               OBSERVÉ, MAIS NON PUBLIÉ
             </h3>
             <ul className="flex flex-col gap-6 font-sans text-lg text-navy/50 font-light leading-relaxed list-none m-0 p-0">
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-4 before:h-[1px] before:bg-navy/20">Une correction de ponctuation.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-4 before:h-[1px] before:bg-navy/20">Un simple changement de mise en page.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-4 before:h-[1px] before:bg-navy/20">Une activité élevée sans contenu compris.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-4 before:h-[1px] before:bg-navy/20">Plusieurs langues actives sans comparaison.</li>
               <li className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-3 before:w-4 before:h-[1px] before:bg-navy/20">Une interprétation automatique non validée.</li>
             </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
