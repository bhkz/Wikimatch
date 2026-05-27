import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { isLiveMode } from "../../data";
import { ExplorerTimelineEvent } from "../../types";

export default function TournamentEditorialTimeline({ events }: { events: ExplorerTimelineEvent[] }) {
  const handleAlert = () =>
    alert(isLiveMode ? "Ce dossier n'est pas encore publie." : "Ce raccourci n'est pas actif dans la demo front.");

  return (
    <section id="timeline" className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative scroll-m-20">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24 relative">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            LA CHRONOLOGIE
            <br />
            <span className="text-navy/40">DU TOURNOI SUR WIKIPEDIA</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0 mt-2">
            {isLiveMode
              ? "Cette timeline superpose les matchs importes et les evolutions editoriales publiees par WikiMatch."
              : "Cette timeline superpose les rencontres de demonstration et les evolutions editoriales documentees par WikiMatch."}
          </p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white border border-navy/10 p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="font-mono text-xs uppercase font-bold tracking-widest text-[#e63946] mb-4">
              Aucune observation vérifiée disponible dans l'explorateur pour le moment.
            </div>
            <p className="font-sans text-sm text-navy/60 font-light">
              La chronologie se remplira automatiquement lorsque des histoires live seront publiées.
            </p>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden pb-12">
            <div className="hidden md:block absolute top-[20px] bottom-0 left-1/2 w-[2px] bg-navy/10" />

            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col md:flex-row w-full mb-16 md:mb-24 items-center md:justify-between group"
              >
                <div className="md:absolute md:left-1/2 md:-translate-x-1/2 z-10 w-4 h-4 rounded-full bg-cream border-2 border-navy mb-6 md:mb-0" />

                <div className="w-full md:w-[calc(50%-40px)] flex flex-col items-center md:items-end text-center md:text-right pr-0 md:pr-12 gap-2 mb-6 md:mb-0">
                  {event.matchLabel ? (
                    <>
                      <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                        {isLiveMode ? "CONTEXTE DU MATCH" : "CONTEXTE DU MATCH DEMO"}
                      </div>
                      <h3 className="font-display text-3xl uppercase tracking-wide text-navy">{event.matchLabel}</h3>
                      <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/50">{event.dateLabel}</div>
                    </>
                  ) : (
                    <div className="hidden md:block font-mono text-[10px] uppercase font-bold tracking-widest text-navy/30">
                      {event.dateLabel}
                    </div>
                  )}
                </div>

                <div className="w-full md:w-[calc(50%-40px)] pl-0 md:pl-12 flex flex-col items-center md:items-start text-center md:text-left gap-4">
                  <div className="bg-white border border-navy/10 hover:border-navy p-6 md:p-8 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all w-full relative">
                    <div className={`font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 w-fit mx-auto md:mx-0 border ${getTypeBadge(event.type)}`}>
                      {getTypeLabel(event.type)}
                    </div>
                    <h4 className="font-sans text-xl font-bold text-navy leading-tight">{event.title}</h4>
                    <div className="w-8 h-[1px] bg-navy/20 mx-auto md:mx-0" />
                    <p className="font-sans text-sm text-navy/70 leading-relaxed font-light">{event.categoryLabel}</p>
                    <div className="mt-4 border-t border-navy/10 pt-4 w-full flex justify-between items-center">
                      {event.route ? (
                        <Link to={event.route} className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] hover:text-blue-electric transition-colors">
                          [Ouvrir l'histoire]
                        </Link>
                      ) : (
                        <button onClick={handleAlert} className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/40 hover:text-navy transition-colors">
                          [Brouillon]
                        </button>
                      )}
                      <div className="font-mono text-[9px] font-bold text-navy/30">{event.dateLabel}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getTypeBadge(type: string) {
  switch (type) {
    case "fact_entry": return "text-yellow-600 border-yellow-600/20 bg-yellow-50";
    case "language_convergence": return "text-blue-electric border-blue-electric/20 bg-blue-electric/5";
    case "language_divergence": return "text-[#e63946] border-[#e63946]/20 bg-[#e63946]/5";
    case "article_instability": return "text-[#780000] border-[#780000]/20 bg-[#780000]/5";
    case "under_radar": return "text-[#2a9d8f] border-[#2a9d8f]/20 bg-[#2a9d8f]/5";
    default: return "text-navy border-navy/20 bg-white";
  }
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    fact_entry: "UN FAIT ENTRE",
    language_convergence: "CONVERGENCE",
    language_divergence: "DIVERGENCE",
    article_instability: "INSTABILITE",
    under_radar: "SOUS LE RADAR",
    match_recap: "RECAP MATCH",
  };
  return labels[type] || String(type || "INCONNU").toUpperCase();
}
