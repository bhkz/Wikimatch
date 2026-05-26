import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function ObservatoryFinalCTA() {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center py-32 px-4 md:px-8 text-navy overflow-hidden bg-cream border-t border-navy/10">
      
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-multiply flex items-center justify-center pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #0a192f 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-12">
        <h2 className="font-display text-5xl sm:text-6xl md:text-8xl uppercase tracking-wide leading-[0.85] text-navy">
          <span className="block mb-2 text-navy/70">VOIR LES TRACES.</span>
          <span className="block mb-2 text-navy">PUIS LIRE</span>
          <span className="block text-blue-electric">LES HISTOIRES.</span>
        </h2>

        <p className="font-sans text-xl md:text-2xl font-light leading-relaxed max-w-2xl text-navy/80">
          L'Observatoire montre comment WikiMatch pourrait relier des modifications publiques à des récits documentés, comparables et vérifiables.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <Link to="/stories" className="bg-navy text-white px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-blue-electric hover:text-white transition-colors w-full sm:w-auto text-center shadow-lg">
            Lire les histoires publiées
          </Link>
          <Link to="/explorer" className="bg-transparent border border-navy/20 text-navy px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-navy/5 transition-colors w-full sm:w-auto text-center">
            Explorer les visualisations
          </Link>
        </div>

        <Link 
          to="/matches" 
          className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/40 hover:text-navy transition-colors mt-8 underline decoration-navy/20"
        >
          Voir les matchs suivis
        </Link>
      </div>
    </section>
  );
}
