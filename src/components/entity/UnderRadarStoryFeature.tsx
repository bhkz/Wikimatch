import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { EntityPublishedStory } from "../../types";

export default function UnderRadarStoryFeature({ story }: { story: EntityPublishedStory }) {
  
  const handleToast = () => {
    alert("Le partage sera connecté dans une prochaine étape de la démonstration.");
    console.log("Le partage sera connecté dans une prochaine étape de la démonstration.");
  };

  const scrollToSources = () => {
     document.getElementById('entity-sources')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-white relative border-b border-navy/10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=2600&auto=format&fit=crop"
          alt="Stadium background"
          className="w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
      </div>

      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12 relative z-10">
        
        <div className="flex items-center gap-4">
           <h2 className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#e63946] bg-white px-4 py-2 w-fit">
             CAS FICTIF · HISTOIRE PUBLIÉE EN DÉMONSTRATION
           </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          <div className="flex flex-col gap-6 lg:w-1/2">
             <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric border border-blue-electric/30 px-3 py-1 w-fit">
               {story.categoryLabel}
             </div>
             
             <h3 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-wide leading-[0.9] text-white">
               LE GARDIEN SUIVI<br/>AU JAPON AVANT<br/>D'APPARAÎTRE AILLEURS.
             </h3>

             <p className="font-sans text-xl text-cream/80 leading-relaxed font-light mt-4">
               {story.excerpt}
             </p>

             <div className="flex flex-col sm:flex-row gap-4 mt-8">
               <button onClick={scrollToSources} className="bg-blue-electric text-white px-6 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-white hover:text-navy transition-colors text-center w-full md:w-auto shadow-sm">
                 Voir les sources simulées
               </button>
               <button onClick={handleToast} className="border border-cream/20 text-cream px-6 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-cream/10 transition-colors w-full md:w-auto text-center hidden md:block">
                 Partager cette histoire
               </button>
             </div>
          </div>

          <div className="flex flex-col lg:w-1/2 gap-6 bg-white/5 border border-white/10 p-8 md:p-12">
             <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-cream/40 mb-4 border-b border-white/10 pb-4">ÉLÉMENTS DE PREUVE FICTIFS</div>
             
             <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                   <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">JA</div>
                   <div className="font-sans text-lg text-white font-light">3 ajouts substantiels observés</div>
                </div>
                
                <div className="flex flex-col gap-2">
                   <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">EN</div>
                   <div className="font-sans text-lg text-white/50 font-light">Aucun ajout équivalent détecté</div>
                </div>
                
                <div className="flex flex-col gap-2">
                   <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-cream/60">FR</div>
                   <div className="font-sans text-lg text-white/50 font-light">Aucun ajout équivalent détecté</div>
                </div>
             </div>
          </div>

        </div>

      </div>
    </section>
  );
}
