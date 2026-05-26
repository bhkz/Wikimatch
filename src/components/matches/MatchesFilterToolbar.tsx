import { Search, Filter, X } from "lucide-react";
import { MatchesFilterState, MatchTrackingStatus, MatchStage } from "../../types";

type Props = {
  filters: MatchesFilterState;
  setFilters: (f: MatchesFilterState) => void;
  sortOrder: "editorial" | "chronological";
  setSortOrder: (o: "editorial" | "chronological") => void;
};

export default function MatchesFilterToolbar({ filters, setFilters, sortOrder, setSortOrder }: Props) {
  
  const statusChips: { id: "all" | MatchTrackingStatus | "completed_without_story", label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "upcoming", label: "À venir" },
    { id: "observing", label: "En observation" },
    { id: "completed_with_stories", label: "Dossiers publiés" },
    { id: "completed_without_story", label: "Sans histoire" },
  ];

  const phaseOptions: { id: "all" | MatchStage, label: string }[] = [
    { id: "all", label: "Toutes les phases" },
    { id: "group_stage", label: "Phase de groupes" },
    { id: "round_of_16", label: "Huitièmes" },
    { id: "quarter_final", label: "Quarts" },
    { id: "semi_final", label: "Demi-finales" },
    { id: "final", label: "Finale" },
  ];

  return (
    <section className="sticky top-[72px] z-30 bg-cream/95 backdrop-blur-md border-b border-navy/10 px-4 md:px-8 py-4">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
              <input 
                type="text"
                placeholder="Rechercher équipe..."
                value={filters.teamQuery}
                onChange={(e) => setFilters({ ...filters, teamQuery: e.target.value })}
                className="w-full bg-white border border-navy/10 pl-10 pr-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest placeholder:text-navy/40 text-navy focus:outline-none focus:border-blue-electric transition-colors"
              />
              {filters.teamQuery && (
                 <button onClick={() => setFilters({ ...filters, teamQuery: "" })} className="absolute right-3 top-1/2 -translate-y-1/2">
                   <X className="w-3 h-3 text-navy/60 hover:text-navy" />
                 </button>
              )}
            </div>

            {/* Chips */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {statusChips.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setFilters({ ...filters, status: chip.id })}
                  className={`whitespace-nowrap px-4 py-2 font-mono text-[10px] font-bold tracking-widest uppercase transition-colors shrink-0 
                    ${filters.status === chip.id ? "bg-navy text-white" : "bg-white text-navy/60 hover:text-navy border border-navy/10 hover:border-navy/30"}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            {/* Phase Selector (Simple visually for fake dropdown on desktop, real select on mobile ideally, here custom class) */}
            <div className="relative w-full sm:w-auto">
              <select 
                value={filters.phase}
                onChange={(e) => setFilters({ ...filters, phase: e.target.value as "all" | MatchStage })}
                className="w-full appearance-none bg-white border border-navy/10 pl-4 pr-10 py-2 font-mono text-[10px] uppercase font-bold tracking-widest text-navy focus:outline-none focus:border-blue-electric cursor-pointer"
              >
                 {phaseOptions.map(opt => (
                   <option key={opt.id} value={opt.id}>{opt.label}</option>
                 ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-navy/50">
                <Filter className="w-4 h-4" />
              </div>
            </div>

            {/* Sort Toggle */}
            <button 
              onClick={() => setSortOrder(sortOrder === "editorial" ? "chronological" : "editorial")}
              className="hidden md:block whitespace-nowrap text-right font-mono text-[10px] uppercase tracking-widest font-bold text-navy/50 hover:text-navy transition-colors underline decoration-navy/20"
            >
              Tri : {sortOrder === "editorial" ? "Éditorial" : "Chronologique"}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between relative mt-2 border-t border-navy/5 pt-2">
           <p className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
             Le statut "en observation" signifie qu'un match est surveillé, pas qu'une histoire a été identifiée.
           </p>
           {/* Mobile sort toggle */}
           <button 
              onClick={() => setSortOrder(sortOrder === "editorial" ? "chronological" : "editorial")}
              className="md:hidden mt-2 whitespace-nowrap text-left font-mono text-[10px] uppercase tracking-widest font-bold text-navy/50 hover:text-navy transition-colors underline decoration-navy/20"
            >
              Tri : {sortOrder === "editorial" ? "Éditorial" : "Chronologique"}
            </button>
        </div>

      </div>
    </section>
  );
}
