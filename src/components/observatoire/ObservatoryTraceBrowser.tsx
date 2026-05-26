import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ObservatoryTrace, ObservatoryChangeStatus } from "../../types";
import TraceInspectorDrawer from "./TraceInspectorDrawer";
import { Link } from "react-router-dom";

export default function ObservatoryTraceBrowser({ traces }: { traces: ObservatoryTrace[] }) {
  const [activeStatus, setActiveStatus] = useState<ObservatoryChangeStatus | "all">("all");
  const [selectedTrace, setSelectedTrace] = useState<ObservatoryTrace | null>(
    traces.find(t => t.id === "trace-incident-en-added") || null
  );

  const filteredTraces = activeStatus === "all"
    ? traces
    : traces.filter(t => t.changeStatus === activeStatus);

  return (
    <section id="trace-browser" className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative scroll-m-20">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4">
          <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#e63946] bg-navy/5 px-4 py-2 border border-[#e63946]/20 w-fit mb-4">
             REJEU FICTIF · AUCUN FLUX WIKIPÉDIA CONNECTÉ
          </div>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy">
            EXPLORER<br/><span className="text-navy/40">LES TRACES OBSERVÉES</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mt-2">
            Corrections mineures, changements substantiels ou modifications liées à une histoire publiée : tout n’a pas le même poids éditorial.
          </p>
        </div>

        {/* Main Filters */}
        <div className="flex flex-wrap gap-2 md:gap-4 mt-4">
           <FilterChip label="Toutes les traces" active={activeStatus === "all"} onClick={() => setActiveStatus("all")} />
           <FilterChip label="Reliées à une histoire" active={activeStatus === "linked_to_published_story"} onClick={() => setActiveStatus("linked_to_published_story")} />
           <FilterChip label="Substantielles" active={activeStatus === "substantive"} onClick={() => setActiveStatus("substantive")} />
           <FilterChip label="Mineures" active={activeStatus === "minor"} onClick={() => setActiveStatus("minor")} />
           
           <button 
             onClick={() => alert("Les filtres avancés (langue, type, texte) seront développés dans une prochaine étape de la démo.")}
             className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest px-4 py-2 bg-transparent text-navy/60 hover:text-navy underline decoration-navy/20 transition-colors ml-auto md:ml-4"
           >
             Filtrer davantage
           </button>
        </div>

        {/* Browser Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 items-start">
           
           {/* List */}
           <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                 {filteredTraces.length > 0 ? (
                    filteredTraces.map((trace) => (
                       <motion.div
                         key={trace.id}
                         layout
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -10 }}
                       >
                         <TraceCard 
                            trace={trace} 
                            isSelected={selectedTrace?.id === trace.id} 
                            onSelect={() => setSelectedTrace(trace)} 
                         />
                       </motion.div>
                    ))
                 ) : (
                    <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       className="p-12 text-center bg-white border border-navy/10"
                    >
                       <div className="font-display text-3xl uppercase text-navy/40 mb-4">AUCUNE TRACE</div>
                       <p className="font-sans text-sm text-navy/60 font-light">Aucune modification fictive ne correspond à ce filtre.</p>
                       <button onClick={() => setActiveStatus("all")} className="font-mono text-[10px] uppercase font-bold tracking-widest mt-4 text-navy underline decoration-navy/20">Réinitialiser les filtres</button>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>

           {/* Inspector Desktop (Sticky) */}
           <div className="hidden lg:block lg:col-span-7 xl:col-span-8 sticky top-24">
              {selectedTrace ? (
                 <TraceInspectorDrawer trace={selectedTrace} isDesktop={true} onClose={() => setSelectedTrace(null)} />
              ) : (
                 <div className="h-[600px] flex items-center justify-center border border-navy/10 bg-white/50 border-dashed">
                    <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/30">Veuillez sélectionner une trace pour l'inspecter.</div>
                 </div>
              )}
           </div>

        </div>

        {/* Mobile drawer via state conditionally rendered overlay */}
        <AnimatePresence>
           {selectedTrace && (
             <div className="lg:hidden fixed inset-0 z-50 flex items-end">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedTrace(null)}
                 className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
               />
               <motion.div 
                 initial={{ y: "100%" }}
                 animate={{ y: 0 }}
                 exit={{ y: "100%" }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="relative w-full h-[85vh] bg-cream rounded-t-2xl shadow-2xl overflow-y-auto"
               >
                  <TraceInspectorDrawer trace={selectedTrace} isDesktop={false} onClose={() => setSelectedTrace(null)} />
               </motion.div>
             </div>
           )}
        </AnimatePresence>

      </div>
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest px-4 py-2 border transition-colors
        ${active 
          ? 'bg-navy text-white border-navy shadow-sm' 
          : 'bg-white text-navy/60 border-navy/20 hover:border-navy/60 hover:text-navy'}
      `}
    >
      {label}
    </button>
  );
}

function TraceCard({ trace, isSelected, onSelect }: { trace: ObservatoryTrace, isSelected: boolean, onSelect: () => void }) {
  
  const getStatusColor = (status: ObservatoryChangeStatus) => {
    switch (status) {
       case 'linked_to_published_story': return 'text-[#e63946] border-[#e63946]/20 bg-[#e63946]/5';
       case 'substantive': return 'text-blue-electric border-blue-electric/20 bg-blue-electric/5';
       case 'minor': return 'text-navy/50 border-navy/10 bg-white';
       default: return 'text-navy border-navy/10 bg-white';
    }
  };

  return (
    <button 
      onClick={onSelect}
      className={`w-full text-left p-5 border transition-all duration-200
         ${isSelected ? 'border-navy shadow-md bg-white' : 'border-navy/10 bg-white hover:border-navy/40'}
      `}
    >
       <div className="flex justify-between items-start mb-3">
          <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/40">
            {trace.observedAtLabel} · {trace.languageCode} · {trace.articleType}
          </div>
          <div className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border ${getStatusColor(trace.changeStatus)}`}>
            {trace.changeStatus === 'linked_to_published_story' ? 'STORY' : trace.changeStatus === 'substantive' ? 'SUBSTANTIEL' : 'MINEUR'}
          </div>
       </div>

       <h4 className="font-display text-xl uppercase tracking-wide text-navy mb-1 leading-tight">
         {trace.articleLabel}
       </h4>
       
       <p className="font-sans text-sm text-navy/70 leading-relaxed font-light mt-2 line-clamp-2">
         {trace.summary}
       </p>

       <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-3">
          {trace.relatedStoryTitle ? (
             <div className="font-mono text-[9px] uppercase tracking-widest text-[#e63946] font-bold truncate max-w-[70%]">
               STORY : {trace.relatedStoryTitle}
             </div>
          ) : (
             <div />
          )}
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/60 group-hover:text-navy transition-colors whitespace-nowrap">
             [Inspecter]
          </div>
       </div>
    </button>
  );
}
