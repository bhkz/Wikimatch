import { Link } from "react-router-dom";
import { isLiveMode } from "../../data";

export default function ExplorerFinalCTA() {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center py-32 px-4 md:px-8 text-white overflow-hidden bg-navy">
      <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none mix-blend-screen">
        <div className="w-[150%] h-[150%] rounded-full border border-dashed border-white/20 animate-[spin_120s_linear_infinite]" />
        <div className="absolute w-[100%] h-[100%] rounded-full border border-white/10 animate-[spin_80s_reverse_linear_infinite]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-12">
        <h2 className="font-display text-5xl sm:text-6xl md:text-8xl uppercase tracking-wide leading-[0.85] text-white">
          <span className="block mb-2 text-[#2a9d8f] border-b border-[#2a9d8f]/30 pb-2 w-fit mx-auto">PASSER DE LA</span>
          <span className="block mb-2 text-white">VUE D'ENSEMBLE</span>
          <span className="block text-white/50">AU DETAIL D'UNE HISTOIRE.</span>
        </h2>

        <p className="font-sans text-xl md:text-2xl font-light leading-relaxed max-w-2xl text-white/80">
          {isLiveMode
            ? "Les dossiers editoriaux apparaitront ici uniquement apres publication depuis le pipeline live."
            : "Maintenant que vous avez visualise les tendances, plongez dans le contenu des dossiers editoriaux de demonstration WikiMatch."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <Link to="/stories" className="bg-white text-navy px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-cream transition-colors w-full sm:w-auto text-center shadow-lg">
            Ouvrir les archives d'histoires
          </Link>
          <Link to="/observatoire" className="bg-transparent border border-white/20 text-white px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors w-full sm:w-auto text-center">
            Voir les traces sources
          </Link>
        </div>
      </div>
    </section>
  );
}
