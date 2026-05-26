import { Search } from "lucide-react";
import { useCustomSearch } from "./SearchContext";

export default function SearchContentTypesSection() {
  const { setQuery, setActiveFilter } = useCustomSearch();

  const handleCardClick = (queryVal: string, filterVal: any) => {
    setQuery(queryVal);
    setActiveFilter(filterVal);
  };

  const types = [
    {
      title: "HISTOIRE PUBLIÉE",
      desc: "Une divergence, une convergence, un article instable ou un sujet sous le radar.",
      example: "Un même carton rouge. Trois traitements Wikipédia.",
      query: "carton rouge",
      filter: "story",
    },
    {
      title: "DOSSIER MATCH",
      desc: "Les histoires validées issues d’une même rencontre.",
      example: "Un match suivi dans l’archive.",
      query: "match",
      filter: "match",
    },
    {
      title: "SUJET DOCUMENTÉ",
      desc: "Un joueur ou une équipe ayant fait l’objet d’un dossier public.",
      example: "Un joueur documenté dans plusieurs éditions.",
      query: "joueur",
      filter: "entity",
    },
    {
      title: "TRACE PUBLIQUE",
      desc: "Une modification ou un état comparé déjà exposable dans l’Observatoire.",
      example: "mention ajoutée dans un article comparé.",
      query: "altercation",
      filter: "public_trace",
    },
    {
      title: "MÉTHODOLOGIE",
      desc: "Les règles permettant d’interpréter correctement les histoires.",
      example: "Une langue n’est pas un pays.",
      query: "langue pays",
      filter: "methodology",
    },
  ];

  return (
    <section className="py-24 px-4 md:px-8 bg-cream text-navy overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        <h2 className="font-display text-4xl md:text-5xl uppercase tracking-wide leading-tight">
          CHERCHER
          <br />
          DANS LE RÉCIT
          <br />
          DU TOURNOI.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {types.map((t, idx) => (
            <button
              key={idx}
              onClick={() => handleCardClick(t.query, t.filter)}
              className="bg-white border border-navy/10 p-6 flex flex-col gap-4 text-left hover:border-blue-electric hover:shadow-lg transition-all group relative overflow-hidden h-full"
            >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric bg-blue-electric/5 px-2 py-1 w-fit border border-blue-electric/20 mb-2">
                {t.title}
              </div>
              <p className="font-sans text-sm text-navy/80 leading-relaxed min-h-[4rem]">
                {t.desc}
              </p>
              <div className="mt-auto pt-4 border-t border-navy/5">
                <span className="font-mono text-[9px] text-navy/40 uppercase block mb-1">
                  Exemple :
                </span>
                <span className="font-sans text-xs text-navy font-medium italic">
                  "{t.example}"
                </span>
              </div>

              {/* Hover effect background */}
              <div className="absolute inset-0 bg-blue-electric/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <div className="bg-blue-electric text-white px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                  <Search className="w-3 h-3" /> Rechercher cet exemple
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
