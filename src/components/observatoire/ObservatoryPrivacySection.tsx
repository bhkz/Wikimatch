import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function ObservatoryPrivacySection() {
  
  return (
    <section className="py-24 md:py-32 px-4 md:px-8 bg-navy text-white relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24 relative">
        
        <div className="flex flex-col gap-6 text-center md:text-left max-w-4xl mx-auto md:mx-0">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-[0.9]">
            LES ARTICLES SONT OBSERVÉS.<br/><span className="text-white/40">PAS LES PERSONNES.</span>
          </h2>
          <p className="font-sans text-xl text-white/70 leading-relaxed font-light mt-4">
            WikiMatch s'intéresse aux modifications publiques des articles liés au tournoi. Dans cette interface, aucune identité, aucune adresse IP et aucune localisation de contributeur n'est exposée.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full">
           
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="flex flex-col gap-4 border-t border-white/20 pt-6"
           >
              <h3 className="font-mono text-sm uppercase font-bold tracking-widest text-cream">CONTRIBUTEURS ANONYMISÉS</h3>
              <p className="font-sans text-base text-white/70 font-light leading-relaxed">
                 L'interface publique ne présente pas de classement ni de profil de contributeur.
              </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="flex flex-col gap-4 border-t border-white/20 pt-6"
           >
              <h3 className="font-mono text-sm uppercase font-bold tracking-widest text-cream">AUCUNE GÉOLOCALISATION</h3>
              <p className="font-sans text-base text-white/70 font-light leading-relaxed">
                 La carte d'Explorer situe les sujets des histoires, jamais les personnes qui modifient Wikipédia.
              </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="flex flex-col gap-4 border-t border-white/20 pt-6"
           >
              <h3 className="font-mono text-sm uppercase font-bold tracking-widest text-cream">PAS DE DRAMATISATION AUTOMATIQUE</h3>
              <p className="font-sans text-base text-white/70 font-light leading-relaxed">
                 Une modification n'est publiée comme histoire qu'après qualification et validation.
              </p>
           </motion.div>

        </div>

        <div className="flex justify-center md:justify-start mt-8">
           <Link to="/methodology" className="border border-white/20 text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-white/10 transition-colors">
             Lire la méthodologie complète
           </Link>
        </div>

      </div>
    </section>
  );
}
