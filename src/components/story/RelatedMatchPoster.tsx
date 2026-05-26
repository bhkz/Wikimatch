import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function RelatedMatchPoster() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative overflow-hidden bg-grid-pattern-light">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        <h2 className="font-display text-3xl sm:text-4xl text-center uppercase text-navy">
          CETTE HISTOIRE APPARTIENT À UN MATCH
        </h2>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-4xl mx-auto bg-navy text-cream shadow-2xl overflow-hidden group"
        >
          {/* Background Image */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <img 
              src="https://images.unsplash.com/photo-1518605368461-1ee0670d8a43?q=80&w=2000&auto=format&fit=crop" 
              alt="Match context" 
              className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-105" 
            />
          </div>
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/30" />

          {/* Content */}
          <div className="relative z-10 flex flex-col p-8 md:p-12 min-h-[400px] justify-between">
            <div className="flex justify-between items-start">
               <div className="px-2 py-1 bg-white/10 backdrop-blur font-mono text-[10px] text-white uppercase tracking-widest rounded border border-white/20">
                 SCÉNARIO FICTIF
               </div>
            </div>

            <div className="flex flex-col gap-6 w-full text-center md:text-left pt-12">
              <div className="font-mono text-xs uppercase tracking-widest text-cream/60">
                Phase de groupes
              </div>
              <div className="font-display text-5xl md:text-7xl uppercase tracking-wider text-white">
                FRANCE <span className="text-blue-electric mx-4">—</span> BELGIQUE
              </div>
              <p className="font-sans text-base md:text-lg text-cream/80 max-w-xl font-light leading-relaxed mx-auto md:mx-0">
                Un même match peut générer plusieurs histoires : faits ajoutés, versions divergentes, articles instables et récits stabilisés.
              </p>
            </div>

            <div className="flex justify-center md:justify-end mt-8">
              <Link to="/match/demo-france-belgique" className="flex items-center gap-4 bg-white text-navy px-8 py-4 font-medium uppercase font-display tracking-widest hover:bg-blue-electric hover:text-white transition-colors group-hover:shadow-[0_0_20px_rgba(0,85,255,0.4)]">
                Voir le dossier du match
                <span className="text-xl transform group-hover:translate-x-2 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
