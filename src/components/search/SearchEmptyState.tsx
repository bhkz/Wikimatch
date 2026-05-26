import { Link } from "react-router-dom";
import { useCustomSearch } from "./SearchContext";
import { searchSuggestions } from "../../mockSearchData";

export default function SearchEmptyState() {
  const { setQuery, clearSearch } = useCustomSearch();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 md:px-8 text-center border border-dashed border-white/20 mt-8">
      <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] border border-[#e63946]/30 px-3 py-1 bg-[#e63946]/5 mb-6">
        AUCUN RÉSULTAT
      </div>

      <h3 className="font-display text-3xl md:text-5xl uppercase tracking-wide text-white leading-tight">
        AUCUN CONTENU PUBLIC
        <br />
        POUR CETTE RECHERCHE.
      </h3>

      <p className="font-sans text-lg text-white/70 leading-relaxed max-w-2xl mt-6 font-light">
        WikiMatch ne trouve aucune histoire publiée, aucun dossier public ni
        aucune trace exposable correspondant à votre requête dans cette
        démonstration.
      </p>
      <p className="font-sans text-lg text-[#e63946] leading-relaxed max-w-2xl mt-2 font-medium">
        Les candidats non validés et les données privées ne sont jamais affichés
        ici.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={clearSearch}
          className="bg-white text-navy px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-blue-electric hover:text-white transition-colors"
        >
          Réinitialiser la recherche
        </button>
        <Link
          to="/stories"
          className="border border-white/30 text-white px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-colors"
        >
          Explorer les histoires
        </Link>
        <Link
          to="/matches"
          className="border border-white/30 text-white px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-colors"
        >
          Voir les matchs suivis
        </Link>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 w-full max-w-lg">
        <span className="font-mono text-xs text-white/50 uppercase tracking-widest">
          Essayez ces suggestions :
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {searchSuggestions.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => setQuery(s.query)}
              className="bg-transparent border border-blue-electric/30 text-blue-electric px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-blue-electric hover:text-white transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
