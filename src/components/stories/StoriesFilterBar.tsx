import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { StoryArchiveFilter } from "../../types";

type Props = {
  filters: StoryArchiveFilter[];
  activeFilterId: string;
  onSelectFilter: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export default function StoriesFilterBar({ filters, activeFilterId, onSelectFilter, searchQuery, onSearchChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <section className="sticky top-[72px] z-30 bg-cream/95 backdrop-blur-md border-b border-navy/10 px-4 md:px-8 py-4">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Main Filters (Chips/Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              className={`whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors shrink-0 
                ${activeFilterId === f.id ? "bg-navy text-white" : "bg-white text-navy/60 hover:text-navy border border-navy/10 hover:border-navy/30"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Advanced Mobile Trigger */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
            <input 
              type="text"
              placeholder="Rechercher dans les histoires fictives..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-navy/10 pl-10 pr-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest placeholder:text-navy/40 text-navy focus:outline-none focus:border-blue-electric transition-colors"
            />
            {searchQuery && (
               <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                 <X className="w-3 h-3 text-navy/60 hover:text-navy" />
               </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 bg-white border border-navy/10 px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest text-navy/60 hover:text-navy hover:border-navy/30 transition-colors shrink-0"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Plus de filtres</span>
          </button>
        </div>

      </div>

      <div className="w-full max-w-screen-2xl mx-auto mt-2 hidden md:block">
         <p className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
           FR, EN ou ES désignent des éditions linguistiques de Wikipédia, pas les opinions de pays ou de populations.
         </p>
      </div>
      
      {/* Fake Advanced Filters Bottom Sheet / Dropdown */}
      {showAdvanced && (
         <div className="w-full max-w-screen-2xl mx-auto mt-4 pt-4 border-t border-navy/10 font-mono text-[10px] uppercase tracking-widest bg-white p-6 shadow-xl relative z-40">
            <button onClick={() => setShowAdvanced(false)} className="absolute top-4 right-4 text-navy/40 hover:text-navy">
               <X className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
               <div className="flex flex-col gap-3">
                 <span className="font-bold text-navy border-b border-navy/5 pb-2">Match</span>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Tous les matchs</button>
                 <button className="text-left text-navy">France — Belgique</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Maroc — Croatie</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Japon — Sénégal</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Portugal — Uruguay</button>
               </div>
               <div className="flex flex-col gap-3">
                 <span className="font-bold text-navy border-b border-navy/5 pb-2">Édition linguistique</span>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Toutes</button>
                 <button className="text-left text-navy">EN</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">FR</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">ES</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">AR</button>
               </div>
               <div className="flex flex-col gap-3">
                 <span className="font-bold text-navy border-b border-navy/5 pb-2">Sujet</span>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Tous les sujets</button>
                 <button className="text-left text-navy">Match</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Sélection</button>
                 <button className="text-left text-navy/50 hover:text-blue-electric transition-colors">Joueur</button>
               </div>
            </div>
            <div className="mt-8 flex justify-end">
               <button onClick={() => setShowAdvanced(false)} className="bg-navy text-white px-4 py-2 font-bold hover:bg-blue-electric transition-colors">
                 Appliquer
               </button>
            </div>
         </div>
      )}
    </section>
  );
}
