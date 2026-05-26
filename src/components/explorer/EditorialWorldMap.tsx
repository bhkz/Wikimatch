import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { StoryGeoAnchor, ExplorerStoryType } from "../../types";

export default function EditorialWorldMap({ anchors, unmapped }: { anchors: StoryGeoAnchor[], unmapped: any[] }) {
  const [activeFilter, setActiveFilter] = useState<ExplorerStoryType | "all">("all");
  const [selectedAnchor, setSelectedAnchor] = useState<StoryGeoAnchor | null>(anchors.find(a => a.id === "anchor-japan-goalkeeper") || null);

  const filteredAnchors = activeFilter === "all" 
     ? anchors 
     : anchors.filter(a => a.type === activeFilter);

  const handleToast = () => alert("Détail à venir dans une prochaine étape de la démonstration.");

  return (
    <section id="map" className="py-24 bg-navy text-white relative scroll-m-20 border-b border-navy/10 overflow-hidden">
      
      {/* Background Carto Graphic */}
       <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none select-none">
         <motion.div 
           initial={{ y: 20 }}
           animate={{ y: -20 }}
           transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: "linear" }}
           className="w-full h-[150%] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-contain bg-center bg-no-repeat opacity-40 mix-blend-screen"
         />
       </div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-12 px-4 md:px-8">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-white">
            L'ATLAS<br/><span className="text-white/40">DES SUJETS DOCUMENTÉS</span>
          </h2>
          <p className="font-sans text-xl text-white/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Chaque point correspond à un joueur ou une sélection lié à une histoire fictive publiée dans la démonstration.
          </p>
        </div>

        <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy bg-white px-4 py-2 border border-white/20 w-fit mx-auto md:mx-0">
          POSITION = SUJET DE L'HISTOIRE · PAS LOCALISATION DU CONTRIBUTEUR
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
           <FilterChip label="Toutes" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
           <FilterChip label="Un fait entre" active={activeFilter === "fact_entry"} onClick={() => setActiveFilter("fact_entry")} />
           <FilterChip label="Convergence" active={activeFilter === "language_convergence"} onClick={() => setActiveFilter("language_convergence")} />
           <FilterChip label="Divergence" active={activeFilter === "language_divergence"} onClick={() => setActiveFilter("language_divergence")} />
           <FilterChip label="Sous le radar" active={activeFilter === "under_radar"} onClick={() => setActiveFilter("under_radar")} />
        </div>

        {filteredAnchors.length === 0 && activeFilter === "article_instability" && (
           <div className="bg-white/10 border border-white/20 p-6 text-center text-white/50 font-mono text-xs uppercase tracking-widest">
             Aucun article instable cartographié dans cette démonstration. <br/> Les instabilités concernent un article précis et peuvent ne pas posséder d’ancrage géographique pertinent.
           </div>
        )}

        {/* The "Map" Area & Detail Panel */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mt-8">
           
           {/* Abstract Map Box */}
           <div className="w-full lg:w-2/3 h-[400px] md:h-[600px] border border-white/10 bg-white/5 relative overflow-hidden flex items-center justify-center p-8">
              
              <div className="font-mono text-center text-[10px] uppercase font-bold tracking-widest text-white/30 absolute top-4 left-0 right-0">ZONES D'ANCRAGE SIMULÉES</div>
              
              <div className="relative w-full h-[80%] border border-dashed border-white/20">
                 {/* Placed abstract dots based on roughly scaled positioning for demo visual */}
                 <AnimatePresence>
                   {filteredAnchors.map((anchor) => {
                      const isSelected = selectedAnchor?.id === anchor.id;
                      // Mapping abstract lat/long to basic % for demo
                      const top = `${Math.max(10, Math.min(90, 50 - (anchor.latitude / 90) * 40))}%`;
                      const left = `${Math.max(10, Math.min(90, 50 + (anchor.longitude / 180) * 40))}%`;

                      return (
                         <motion.button
                           key={anchor.id}
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0 }}
                           onClick={() => setSelectedAnchor(anchor)}
                           className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center
                             ${isSelected ? 'bg-white border-white scale-125 z-20 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-transparent border-white/50 hover:border-white'}
                           `}
                           style={{ top, left }}
                         >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-navy" />}
                            <div className={`absolute w-full h-full rounded-full animate-ping opacity-50 ${getTypeColorClass(anchor.type)}`} />
                         </motion.button>
                      );
                   })}
                 </AnimatePresence>
              </div>

           </div>

           {/* Selected Detail Panel */}
           <div className="w-full lg:w-1/3">
              <AnimatePresence mode="wait">
                 {selectedAnchor ? (
                    <motion.div
                       key={selectedAnchor.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 20 }}
                       className="flex flex-col gap-6 bg-white/10 border border-white/20 p-6 md:p-8 h-full"
                    >
                       <div className="flex flex-col gap-2">
                          <div className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 w-fit border ${getTypeBadgeClass(selectedAnchor.type)}`}>
                            {getTypeLabel(selectedAnchor.type)} · CAS FICTIF
                          </div>
                          <h3 className="font-display text-4xl uppercase text-white mt-2 leading-tight">
                            {selectedAnchor.subjectLabel}
                          </h3>
                          <div className="font-sans text-xs text-white/50 font-medium">
                            {selectedAnchor.geographyLabel}
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-4 flex-grow border-y border-white/10 py-6">
                          <h4 className="font-sans text-lg md:text-xl font-bold text-white leading-relaxed">
                            {selectedAnchor.title}
                          </h4>
                          <p className="font-sans text-sm text-white/70 font-light leading-relaxed">
                            {selectedAnchor.excerpt}
                          </p>
                       </div>

                       <div className="flex justify-between items-center mt-auto">
                          <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#e63946]">
                            {selectedAnchor.languages.join(' · ')}
                          </div>
                          {selectedAnchor.route ? (
                             <Link to={selectedAnchor.route} className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-white hover:bg-cream transition-colors px-4 py-2 text-center shadow-lg">
                               [Ouvrir le dossier]
                             </Link>
                          ) : (
                             <button onClick={handleToast} className="font-mono text-[10px] uppercase font-bold tracking-widest text-white border border-white/20 hover:bg-white/10 transition-colors px-4 py-2 text-center">
                               [Détail à venir]
                             </button>
                          )}
                       </div>
                    </motion.div>
                 ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 h-full">
                       <div className="font-mono text-xs uppercase font-bold tracking-widest text-white/40">Sélectionnez un point<br/>pour voir les détails</div>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* Unmapped Stories */}
        <div className="flex flex-col gap-8 mt-16 pt-16 border-t border-white/10">
           <div className="flex flex-col gap-4 text-center md:text-left">
             <h3 className="font-display text-4xl uppercase tracking-wide text-white">TOUTES LES HISTOIRES<br/>NE TIENNENT PAS DANS UN POINT.</h3>
             <p className="font-sans text-lg text-white/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
               Une comparaison liée à un match ou à plusieurs articles ne possède pas toujours un ancrage géographique unique. WikiMatch préfère ne pas forcer une localisation trompeuse.
             </p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {unmapped.map(story => (
                 <div key={story.id} className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10 hover:border-white/30 transition-colors">
                    <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-white/50">{story.label}</div>
                    <div className="font-sans text-xl font-bold text-white">{story.title}</div>
                    {story.route ? (
                       <Link to={story.route} className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-white hover:bg-cream transition-colors px-4 py-2 w-fit mt-4">
                         [Lire l'histoire]
                       </Link>
                    ) : (
                       <button onClick={handleToast} className="font-mono text-[10px] uppercase font-bold tracking-widest text-white border border-white/20 hover:bg-white/10 transition-colors px-4 py-2 w-fit mt-4">
                         [Détail à venir]
                       </button>
                    )}
                 </div>
              ))}
           </div>
        </div>

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
          ? 'bg-white text-navy border-white shadow-sm' 
          : 'bg-transparent text-white/60 border-white/20 hover:border-white/60 hover:text-white'}
      `}
    >
      {label}
    </button>
  );
}

function getTypeColorClass(type: string) {
  switch(type) {
    case 'fact_entry': return 'bg-yellow-400';
    case 'language_convergence': return 'bg-blue-electric';
    case 'language_divergence': return 'bg-[#e63946]';
    case 'article_instability': return 'bg-[#780000]';
    case 'under_radar': return 'bg-[#2a9d8f]';
    case 'match_recap': return 'bg-blue-300';
    default: return 'bg-white';
  }
}

function getTypeBadgeClass(type: string) {
  switch(type) {
    case 'fact_entry': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
    case 'language_convergence': return 'text-blue-electric border-blue-electric bg-blue-electric/10';
    case 'language_divergence': return 'text-[#e63946] border-[#e63946] bg-[#e63946]/10';
    case 'article_instability': return 'text-[#e63946] border-[#e63946]/50 bg-[#e63946]/5';
    case 'under_radar': return 'text-[#2a9d8f] border-[#2a9d8f] bg-[#2a9d8f]/10';
    case 'match_recap': return 'text-white border-white bg-white/10';
    default: return 'text-white border-white bg-white/10';
  }
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    'fact_entry': 'UN FAIT ENTRE',
    'language_convergence': 'MISE À JOUR CONVERGENTE',
    'language_divergence': 'DIVERGENCE ENTRE ÉDITIONS',
    'article_instability': 'ARTICLE INSTABLE',
    'under_radar': 'SOUS LE RADAR',
    'match_recap': 'RÉCAP MATCH'
  };
  return map[type] || type.toUpperCase();
}
