import { motion } from "motion/react";
import DemoBadge from "../DemoBadge";
import { isDemoMode } from "../../data";
import { Link } from "react-router-dom";

export default function MatchesHero() {
  const titleLines = ["TOUS LES MATCHS", "NE LAISSERONT PAS", "LA MÊME TRACE."];

  return (
    <section className="relative min-h-[80svh] md:min-h-[85vh] w-full flex flex-col justify-end overflow-hidden pt-32 pb-16 px-4 md:px-8 bg-navy text-cream">
      
      {/* Background Image & Effects */}
      <motion.div 
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 z-0 bg-navy"
      >
        <img 
          src="https://images.unsplash.com/photo-1574629810360-1ffb54cc357c?q=80&w=2600&auto=format&fit=crop" 
          alt="Stadium lights" 
          className="w-full h-full object-cover opacity-30 grayscale mix-blend-luminosity brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-navy/40" />
      </motion.div>

      {/* Decorative text */}
      <div className="absolute right-8 top-32 z-0 hidden lg:flex flex-col gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-cream/10 text-right">
        <span>À SUIVRE</span>
        <span>DOSSIER PUBLIÉ</span>
        <span>ÉDITIONS COMPARÉES</span>
        <span>ARTICLES OBSERVÉS</span>
      </div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-8 md:gap-16">
        
        <div className="flex flex-col items-start gap-4">
          {isDemoMode && <DemoBadge text="DÉMONSTRATION D’INTERFACE · CALENDRIER FICTIF · AUCUNE DONNÉE RÉELLE" />}
          <div className="font-mono text-[10px] sm:text-xs text-blue-electric uppercase tracking-widest font-bold">
            MATCHS SUIVIS · WIKIMATCH · WC26
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mt-8 md:mt-16">
          <div className="flex flex-col gap-6 md:w-2/3">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-wide leading-[0.85] text-white">
              {titleLines.map((line, i) => (
                 <span key={i} className="block overflow-hidden pb-1">
                   <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.2 + (i * 0.1), duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="block">
                     {line}
                   </motion.span>
                 </span>
              ))}
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="max-w-xl font-sans text-lg md:text-xl text-cream/70 leading-relaxed font-light"
            >
              WikiMatch suit une sélection de rencontres de la Coupe du monde pour documenter ce qui entre réellement dans Wikipédia, ce qui diverge entre éditions et ce qui mérite d'être raconté.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-cream/50 mt-4 border-l-2 border-cream/20 pl-4"
            >
              Un match peut être surveillé<br className="hidden sm:block"/> sans produire d'histoire publiée.
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col gap-4 w-full md:w-auto"
          >
             <button className="bg-blue-electric text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-white hover:text-blue-electric transition-colors w-full md:w-auto text-center" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
               Voir les matchs suivis
             </button>
             {isDemoMode && (
             <Link to="/match/demo-france-belgique" className="border border-cream/20 bg-cream/5 text-cream px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-cream/10 transition-colors w-full md:w-auto text-center">
               Découvrir un dossier publié
             </Link>
             )}
          </motion.div>
        </div>

      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 right-8 z-10 hidden md:flex flex-col items-center gap-2 text-cream/40"
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-cream/40 to-transparent animate-pulse" />
      </motion.div>
    </section>
  );
}
