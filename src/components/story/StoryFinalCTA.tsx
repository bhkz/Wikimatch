import { Link } from "react-router-dom";

export default function StoryFinalCTA() {
  return (
    <section className="py-32 px-4 md:px-8 bg-cream-dark text-navy border-b border-navy/10 bg-grid-pattern-light">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col items-center gap-12 text-center">
        
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase leading-none tracking-wide">
          <span className="block text-navy/40">Un même match.</span>
          <span className="block text-navy/70">Plusieurs Wikipédias.</span>
          <span className="block text-navy mt-2">Parfois plusieurs récits.</span>
        </h2>
        
        <p className="font-sans text-lg md:text-xl text-navy/70 font-light max-w-2xl leading-relaxed">
          WikiMatch transforme des modifications publiques en histoires documentées, comparables et vérifiables.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full sm:w-auto">
          <Link to="/" className="bg-navy text-white px-8 py-4 font-mono font-bold uppercase tracking-widest text-sm hover:bg-blue-electric transition-colors">
            Retour aux histoires
          </Link>
          <Link to="/methodology" className="bg-white text-navy border border-navy/20 px-8 py-4 font-mono font-bold uppercase tracking-widest text-sm hover:border-navy transition-colors flex justify-center">
            Découvrir la méthodologie
          </Link>
        </div>

        <Link to="/observatoire" className="mt-4 font-mono text-xs text-navy/50 uppercase tracking-widest hover:text-blue-electric transition-colors underline underline-offset-4 decoration-navy/20">
          Ouvrir l'Observatoire
        </Link>

      </div>
    </section>
  );
}
