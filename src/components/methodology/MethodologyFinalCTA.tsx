import { Link } from "react-router-dom";

export default function MethodologyFinalCTA() {
  return (
    <section className="relative w-full py-32 px-4 md:px-8 bg-navy text-white overflow-hidden flex flex-col justify-center items-center text-center">
      {/* Abstract Background slightly visible */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        {/* Subtle grid or lines */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10"></div>
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/5"></div>
        <div className="absolute right-1/4 top-0 bottom-0 w-px bg-white/5"></div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12 z-10 items-center">
        <h2 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase tracking-wide leading-[0.9]">
          COMPRENDRE
          <br />
          LA MÉTHODE.
          <br />
          PUIS LIRE
          <br />
          LES HISTOIRES.
        </h2>

        <p className="font-sans text-xl md:text-2xl text-white/80 leading-relaxed font-light max-w-2xl">
          WikiMatch veut raconter ce qui change dans Wikipédia autour du
          tournoi, sans transformer le bruit en récit ni l’observation en
          certitude.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full md:w-auto">
          <Link
            to="/stories"
            className="bg-white text-navy px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-cream hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            LIRE LES HISTOIRES →
          </Link>
          <Link
            to="/observatoire"
            className="bg-transparent border border-white/30 text-white px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:border-white transition-colors flex items-center justify-center gap-2"
          >
            INSPECTER LES TRACES
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mt-12 items-center">
          <Link
            to="/explorer"
            className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-white transition-colors"
          >
            EXPLORER LES VISUALISATIONS
          </Link>
          <div className="w-1 h-1 rounded-full bg-white/20 hidden sm:block"></div>
          <Link
            to="/matches"
            className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-white transition-colors"
          >
            VOIR LES MATCHS SUIVIS
          </Link>
        </div>
      </div>
    </section>
  );
}
