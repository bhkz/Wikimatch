import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { isLiveMode } from "../../data";

export default function UnderRadarExplorerFeature() {
  // Encart explicatif "Sous le radar" — contient des liens fictifs vers
  // demo-japan-goalkeeper. Le pipeline live publie des stories under_radar
  // réelles dans la grille principale de l'Explorer.
  if (isLiveMode) return null;
  return (
    <section className="py-24 md:py-32 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 relative items-center">
        
        <div className="flex flex-col gap-6 text-center md:text-left w-full md:w-1/2">
          <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#2a9d8f] border border-[#2a9d8f]/30 bg-[#2a9d8f]/5 px-4 py-2 w-fit mx-auto md:mx-0">
             ZOOM SUR UNE SOUS-CATÉGORIE
          </div>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            LE DÉFI DES SUJETS<br/><span className="text-[#2a9d8f]">SOUS LE RADAR</span>.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light mt-4">
            Certaines équipes ou joueurs documentés bénéficient de moins d'attention globale. Explorer met en évidence ces sujets où la documentation dépend entièrement d'une seule langue ou édition.
          </p>
          <div className="mt-4">
             <Link to="/entity/demo-japan-goalkeeper" className="border border-navy/20 text-navy px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors inline-block text-center shadow-sm">
               Voir un exemple de profil sous le radar
             </Link>
          </div>
        </div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="w-full md:w-1/2 bg-white border border-navy/10 p-8 shadow-md flex flex-col gap-6"
        >
           <h3 className="font-sans text-2xl font-bold text-navy">Pourquoi les isoler ?</h3>
           <p className="font-sans text-base text-navy/70 leading-relaxed font-light">
             Parce qu'ils représentent des vulnérabilités dans la couverture d'un tournoi mondial, ou à l'inverse, l'effort crucial de contributeurs isolés. Localiser et comparer ces articles permet de comprendre qui écrit l'histoire de ceux que l'on lit moins.
           </p>
           
           <div className="flex flex-col gap-2 border-t border-navy/10 pt-6 font-mono text-[10px] font-bold text-navy">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#2a9d8f]" />
                 JOUER SANS TRADUCTION EXISTANTE
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#2a9d8f]" />
                 ARTICLE MAINTENU PAR UN UNIQUE CONTRIBUTEUR (Fictif)
              </div>
           </div>
        </motion.div>

      </div>
    </section>
  );
}
