import { useCustomSearch } from "./SearchContext";
import { SearchFilterType } from "../../mockSearchData";
import { useState } from "react";

export default function SearchResultToolbar() {
  const {
    query,
    activeFilter,
    setActiveFilter,
    activeLang,
    setActiveLang,
    results,
  } = useCustomSearch();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const filters: { label: string; value: SearchFilterType }[] = [
    { label: "Tous", value: "all" },
    { label: "Histoires", value: "story" },
    { label: "Matchs", value: "match" },
    { label: "Sujets", value: "entity" },
    { label: "Traces publiques", value: "public_trace" },
    { label: "Méthodologie", value: "methodology" },
  ];

  const langs = ["EN", "FR", "ES", "JA", "AR", "PT"];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col border-b border-white/10 pb-6">
        <h2 className="font-display text-4xl uppercase tracking-wide text-white break-words">
          RÉSULTATS POUR
          <br />
          <span className="text-blue-electric">"{query}"</span>
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">
            {results.length} résultat{results.length > 1 ? "s" : ""} public
            {results.length > 1 ? "s" : ""} dans la démonstration
          </p>
          <p className="font-sans text-xs text-white/40 italic">
            Classés par correspondance textuelle. Aucun score de popularité
            n'est utilisé.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                activeFilter === f.value
                  ? "bg-blue-electric border-blue-electric text-white"
                  : "bg-transparent border-white/20 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="relative shrink-0">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className={`px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest border transition-colors flex items-center gap-2 ${
              activeLang || langMenuOpen
                ? "bg-white text-navy border-white"
                : "bg-transparent border-white/20 text-white hover:border-white"
            }`}
          >
            {activeLang ? `Édition : ${activeLang}` : "Édition linguistique"}
            <span className="text-[8px]">▼</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-navy border border-white/10 shadow-2xl z-50 flex flex-col">
              <button
                className="text-left px-4 py-3 font-mono text-[10px] uppercase font-bold text-white hover:bg-white/10"
                onClick={() => {
                  setActiveLang(null);
                  setLangMenuOpen(false);
                }}
              >
                Toutes les éditions
              </button>
              {langs.map((l) => (
                <button
                  key={l}
                  className="text-left px-4 py-3 font-mono text-[10px] uppercase font-bold border-t border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setActiveLang(l);
                    setLangMenuOpen(false);
                  }}
                >
                  {l}
                </button>
              ))}
              <div className="p-3 border-t border-white/10 bg-black/20">
                <p className="font-sans text-[10px] text-white/40 leading-tight">
                  Les codes de langue désignent des éditions de Wikipédia,
                  jamais des pays.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
