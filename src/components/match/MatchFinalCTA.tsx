import { Link } from "react-router-dom";

export default function MatchFinalCTA() {
  return (
    <section className="py-32 px-4 md:px-8 bg-cream border-t border-navy/10 relative overflow-hidden">
      <div className="w-full max-w-screen-md mx-auto flex flex-col items-center text-center gap-12 relative z-10">
        
        <h2 className="font-display text-5xl md:text-7xl uppercase text-navy leading-[0.9]">
          <span className="block text-navy/40 mb-2">CHAQUE MATCH</span>
          <span className="block text-navy/70 mb-2">PEUT LAISSER</span>
          <span className="block text-navy">UNE TRACE DIFFÉRENTE.</span>
        </h2>

        <p className="font-sans text-xl text-navy/80 font-light leading-relaxed">
          Certains matchs ne produiront qu’une mise à jour factuelle. D’autres feront apparaître des divergences, des corrections ou des articles instables. WikiMatch documente uniquement ce qui mérite d’être raconté.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <Link to="/" className="bg-navy text-white px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-blue-electric transition-colors w-full sm:w-auto text-center shadow-md">
            Voir tous les matchs suivis
          </Link>
          <Link to="/" className="bg-white border border-navy/20 text-navy px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-navy/5 transition-colors w-full sm:w-auto text-center shadow-sm">
            Explorer les histoires
          </Link>
        </div>
        
        <Link to="/methodology" className="text-navy/50 font-mono text-[10px] font-bold uppercase tracking-widest underline decoration-navy/20 hover:text-navy transition-colors mt-2">
          Comprendre la méthodologie
        </Link>
      </div>

       {/* Decorative */}
       <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-electric/5 rounded-full blur-3xl" />
       <div className="absolute top-12 -right-12 w-64 h-64 bg-green-acid/5 rounded-full blur-3xl" />
    </section>
  );
}
