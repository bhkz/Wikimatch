import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { isLiveMode } from "../../data";
import { ExplorerStoryType, StoryGeoAnchor } from "../../types";

export default function EditorialWorldMap({
  anchors,
}: {
  anchors: StoryGeoAnchor[];
  unmapped: unknown[];
}) {
  const [activeFilter, setActiveFilter] = useState<ExplorerStoryType | "all">("all");
  const [selectedAnchor, setSelectedAnchor] = useState<StoryGeoAnchor | null>(anchors[0] || null);

  const filteredAnchors =
    activeFilter === "all" ? anchors : anchors.filter((anchor) => anchor.type === activeFilter);

  const handleMissingDetail = () =>
    alert(isLiveMode ? "Ce dossier n'est pas encore publie." : "Detail a venir dans une prochaine etape de la demonstration.");

  return (
    <section id="map" className="py-24 bg-navy text-white relative scroll-m-20 border-b border-navy/10 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none select-none">
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: -20 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="w-full h-[150%] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-contain bg-center bg-no-repeat opacity-40 mix-blend-screen"
        />
      </div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-12 px-4 md:px-8">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-white">
            L'ATLAS
            <br />
            <span className="text-white/40">DES SUJETS DOCUMENTES</span>
          </h2>
          <p className="font-sans text-xl text-white/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Chaque point correspond a un joueur, une selection ou un lieu lie a une histoire publiee.
          </p>
        </div>

        <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy bg-white px-4 py-2 border border-white/20 w-fit mx-auto md:mx-0">
          POSITION = SUJET DE L'HISTOIRE · PAS LOCALISATION DU CONTRIBUTEUR
        </div>

        <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-start">
          <FilterChip label="Toutes" active={activeFilter === "all"} onClick={() => setActiveFilter("all")} />
          <FilterChip label="Un fait entre" active={activeFilter === "fact_entry"} onClick={() => setActiveFilter("fact_entry")} />
          <FilterChip label="Convergence" active={activeFilter === "language_convergence"} onClick={() => setActiveFilter("language_convergence")} />
          <FilterChip label="Divergence" active={activeFilter === "language_divergence"} onClick={() => setActiveFilter("language_divergence")} />
          <FilterChip label="Sous le radar" active={activeFilter === "under_radar"} onClick={() => setActiveFilter("under_radar")} />
        </div>

        {filteredAnchors.length === 0 ? (
          <div className="bg-white/10 border border-white/20 p-10 text-center">
            <div className="font-display text-3xl uppercase text-white/40 mb-4">AUCUN POINT PUBLIE</div>
            <p className="font-sans text-sm text-white/60 font-light">
              L'atlas se remplira automatiquement lorsque des histoires live auront un sujet geolocalisable.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mt-8">
            <div className="w-full lg:w-2/3 h-[400px] md:h-[600px] border border-white/10 bg-white/5 relative overflow-hidden flex items-center justify-center p-8">
              <div className="font-mono text-center text-[10px] uppercase font-bold tracking-widest text-white/30 absolute top-4 left-0 right-0">
                ZONES D'ANCRAGE DES SUJETS
              </div>

              <div className="relative w-full h-[80%] border border-dashed border-white/20">
                <AnimatePresence>
                  {filteredAnchors.map((anchor) => {
                    const isSelected = selectedAnchor?.id === anchor.id;
                    const top = `${Math.max(10, Math.min(90, 50 - (anchor.latitude / 90) * 40))}%`;
                    const left = `${Math.max(10, Math.min(90, 50 + (anchor.longitude / 180) * 40))}%`;

                    return (
                      <motion.button
                        key={anchor.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={() => setSelectedAnchor(anchor)}
                        className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center ${
                          isSelected
                            ? "bg-white border-white scale-125 z-20 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            : "bg-transparent border-white/50 hover:border-white"
                        }`}
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

            <div className="w-full lg:w-1/3">
              {selectedAnchor ? (
                <motion.div
                  key={selectedAnchor.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-6 bg-white/10 border border-white/20 p-6 md:p-8 h-full"
                >
                  <div className="flex flex-col gap-2">
                    <div className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 w-fit border ${getTypeBadgeClass(selectedAnchor.type)}`}>
                      {getTypeLabel(selectedAnchor.type)}
                    </div>
                    <h3 className="font-display text-4xl uppercase text-white mt-2 leading-tight">{selectedAnchor.subjectLabel}</h3>
                    <div className="font-sans text-xs text-white/50 font-medium">{selectedAnchor.geographyLabel}</div>
                  </div>

                  <div className="flex flex-col gap-4 flex-grow border-y border-white/10 py-6">
                    <h4 className="font-sans text-lg md:text-xl font-bold text-white leading-relaxed">{selectedAnchor.title}</h4>
                    <p className="font-sans text-sm text-white/70 font-light leading-relaxed">{selectedAnchor.excerpt}</p>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#e63946]">
                      {selectedAnchor.languages.join(" · ")}
                    </div>
                    {selectedAnchor.route ? (
                      <Link to={selectedAnchor.route} className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-white hover:bg-cream transition-colors px-4 py-2 text-center shadow-lg">
                        [Ouvrir le dossier]
                      </Link>
                    ) : (
                      <button onClick={handleMissingDetail} className="font-mono text-[10px] uppercase font-bold tracking-widest text-white border border-white/20 hover:bg-white/10 transition-colors px-4 py-2 text-center">
                        [Detail a venir]
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest px-4 py-2 border transition-colors ${
        active
          ? "bg-white text-navy border-white shadow-lg"
          : "bg-transparent text-white/60 border-white/20 hover:border-white/60 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function getTypeColorClass(type: ExplorerStoryType) {
  switch (type) {
    case "fact_entry": return "bg-yellow-400";
    case "language_convergence": return "bg-blue-electric";
    case "language_divergence": return "bg-[#e63946]";
    case "under_radar": return "bg-[#2a9d8f]";
    default: return "bg-white";
  }
}

function getTypeBadgeClass(type: ExplorerStoryType) {
  switch (type) {
    case "fact_entry": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
    case "language_convergence": return "text-blue-300 border-blue-300/30 bg-blue-300/10";
    case "language_divergence": return "text-[#ff8fa3] border-[#ff8fa3]/30 bg-[#ff8fa3]/10";
    case "under_radar": return "text-[#2a9d8f] border-[#2a9d8f]/30 bg-[#2a9d8f]/10";
    default: return "text-white border-white/20 bg-white/5";
  }
}

function getTypeLabel(type: ExplorerStoryType) {
  const labels: Record<string, string> = {
    fact_entry: "UN FAIT ENTRE",
    language_convergence: "MISE A JOUR CONVERGENTE",
    language_divergence: "DIVERGENCE ENTRE EDITIONS",
    article_instability: "ARTICLE INSTABLE",
    under_radar: "SOUS LE RADAR",
    match_recap: "RECAP MATCH",
  };
  return labels[type] || String(type).toUpperCase();
}
