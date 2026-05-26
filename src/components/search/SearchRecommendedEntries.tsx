import { useCustomSearch } from "./SearchContext";
import SearchResultCard from "./SearchResultCard";

export default function SearchRecommendedEntries() {
  const { allResults } = useCustomSearch();
  const recommendedItems = allResults.slice(0, 3);

  return (
    <section className="py-24 px-4 md:px-8 bg-navy border-t border-white/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric border-b border-blue-electric/30 pb-2 w-fit mb-2">
            POINTS D’ENTRÉE
          </div>

          <p className="font-sans text-xl text-white/70 leading-relaxed font-light mt-2 max-w-2xl">
            Commencez par l’un de ces contenus publiés, ou utilisez la recherche pour parcourir l’index public.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedItems.map((item) => (
            <SearchResultCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
