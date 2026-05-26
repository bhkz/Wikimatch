import { motion } from "motion/react";
import AnimatedTextReveal from "../AnimatedTextReveal";
import { useCustomSearch } from "./SearchContext";
import { Search } from "lucide-react";

export default function SearchHero() {
  const {
    query,
    setQuery,
    searchState,
    clearSearch,
    setActiveFilter,
    suggestions: searchSuggestions,
  } = useCustomSearch();

  const handleSuggestionClick = (queryVal: string, filterVal?: string) => {
    setQuery(queryVal);
    if (filterVal) setActiveFilter(filterVal as any);
  };

  if (searchState === "results") {
    return (
      <section className="bg-navy pt-8 pb-4 px-4 md:px-8 border-b border-white/10">
        <div className="w-full max-w-screen-xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une histoire, un joueur..."
              className="w-full bg-cream/10 border border-white/20 text-white pl-12 pr-12 py-3 font-sans focus:outline-none focus:border-blue-electric transition-colors focus:bg-cream/20"
              aria-label="Recherche"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label="Effacer"
              >
                ✕
              </button>
            )}
          </div>
          <div className="hidden md:block font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] border border-[#e63946]/30 px-3 py-1 bg-[#e63946]/5">
            DÉMONSTRATION D’INTERFACE · RECHERCHE SUR CONTENUS FICTIFS
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full pt-16 md:pt-24 pb-16 px-4 md:px-8 bg-navy text-white overflow-hidden min-h-[70vh] flex flex-col justify-center border-b border-white/10">
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern-light"></div>
      </div>

      <div className="w-full max-w-screen-md mx-auto flex flex-col gap-8 z-10">
        <div className="flex flex-col gap-2 relative">
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-white/50 bg-white/5 px-3 py-1 w-fit border border-white/10 mb-4">
            RECHERCHE · INDEX PUBLIC · WIKIMATCH
          </div>

          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-tight">
            <AnimatedTextReveal text="RETROUVER" />
            <AnimatedTextReveal text="UNE HISTOIRE." delay={0.1} />
            <AnimatedTextReveal text="UN MATCH." delay={0.2} />
            <AnimatedTextReveal text="UN SUJET." delay={0.3} />
            <AnimatedTextReveal text="UNE PREUVE." delay={0.4} />
          </h1>
        </div>

        <p className="font-sans text-xl text-white/70 leading-relaxed font-light max-w-lg mt-4">
          Recherchez dans les histoires publiées, les dossiers de match, les
          sujets documentés, les traces publiques et la méthodologie WikiMatch.
        </p>

        <div className="relative w-full mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un joueur, un match, une histoire ou une règle…"
            className="w-full bg-white text-navy pl-14 pr-12 py-5 font-sans text-lg md:text-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-blue-electric transition-all placeholder:text-navy/30"
            aria-label="Recherche globale"
          />
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
            Essayer :
          </span>
          <div className="flex flex-wrap gap-2">
            {searchSuggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSuggestionClick(s.query, s.filter)}
                className="bg-white/5 border border-white/10 text-white hover:bg-blue-electric hover:border-blue-electric px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 border-l-2 border-[#e63946] bg-[#e63946]/5 font-sans text-sm text-white/80">
          <strong className="text-[#e63946] font-mono text-[10px] uppercase tracking-widest block mb-1">
            DÉMONSTRATION D’INTERFACE · RECHERCHE SUR CONTENUS FICTIFS ET
            PUBLICS
          </strong>
          La recherche publique n’affiche que des contenus documentés ou des
          traces déjà exposables dans l’Observatoire.
        </div>
      </div>
    </section>
  );
}
