import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { MatchTrackedSubject } from "../../types";
import { isLiveMode } from "../../data";

export default function TrackedSubjectsSection({ subjects }: { subjects: MatchTrackedSubject[] }) {
  const [expanded, setExpanded] = useState(!isLiveMode);
  const languages = useMemo(() => {
    const codes = subjects
      .map((s) => s.languageCode?.toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(codes)).sort();
  }, [subjects]);

  const languageCount = languages.length;

  const subjectsCount = useMemo(() => {
    const keys = subjects.map((sub) => {
      if (sub.type === "match") return "match";
      if (sub.type === "tournament") return "tournament";
      return sub.label;
    });
    return new Set(keys).size;
  }, [subjects]);

  // Group 12 subjects into 4 distinct understandable subject categories
  const groupedSubjects = useMemo(() => {
    const groups: Record<string, { title: string; typeLabel: string; items: MatchTrackedSubject[] }> = {
      match: { title: "ARTICLE DU MATCH", typeLabel: "Page Match", items: [] },
      psg: { title: "PARIS SAINT-GERMAIN", typeLabel: "Équipe", items: [] },
      arsenal: { title: "ARSENAL", typeLabel: "Équipe", items: [] },
      competition: { title: "COMPÉTITION", typeLabel: "Tournoi", items: [] },
    };

    subjects.forEach((sub) => {
      const lowerLabel = (sub.label ?? "").toLowerCase();
      const lowerPageTitle = (sub.pageTitle ?? "").toLowerCase();
      
      if (sub.type === "match" || lowerLabel.includes("final") || lowerPageTitle.includes("final")) {
        groups.match.items.push(sub);
      } else if (lowerLabel.includes("paris") || lowerPageTitle.includes("paris")) {
        groups.psg.items.push(sub);
      } else if (lowerLabel.includes("arsenal") || lowerPageTitle.includes("arsenal")) {
        groups.arsenal.items.push(sub);
      } else if (sub.type === "tournament" || lowerLabel.includes("league") || lowerPageTitle.includes("league")) {
        groups.competition.items.push(sub);
      } else {
        // Fallback for sorting players or other items
        if (sub.type === "team") {
          if (groups.psg.items.length < 3) groups.psg.items.push(sub);
          else groups.arsenal.items.push(sub);
        } else {
          groups.competition.items.push(sub);
        }
      }
    });

    return Object.values(groups).filter(g => g.items.length > 0);
  }, [subjects]);

  return (
    <section className="py-24 px-4 md:px-8 bg-cream-dark border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            PÉRIMÈTRE<br/>SÉLECTIONNÉ
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light mb-8 lg:mb-0">
            Ces articles constituent le périmètre préparé pour le test. La collecte dédiée n'est pas encore activée et aucune histoire n'a été publiée.
          </p>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          {isLiveMode && (
            <div className="bg-white border border-navy/10 p-4 md:p-6 shadow-sm">
              <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50">ARTICLES SÉLECTIONNÉS POUR CE MATCH</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <div className="font-display text-3xl text-navy">{subjects.length}</div>
                  <div className="font-mono text-[10px] uppercase text-navy/50 tracking-wider mt-1">Articles sélectionnés</div>
                </div>
                <div className="flex flex-col">
                  <div className="font-display text-2xl md:text-3xl text-navy">
                    {languageCount > 0 ? `${languageCount} ÉDITIONS` : "ÉDITIONS À CONFIRMER"}
                  </div>
                  <div className="font-mono text-[10px] uppercase text-navy/50 tracking-wider mt-1">
                    {languageCount > 0 ? languages.join(" · ") : "Langues suivies"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="font-display text-3xl text-navy">
                    {subjectsCount}
                  </div>
                  <div className="font-mono text-[10px] uppercase text-navy/50 tracking-wider mt-1">
                    Sujets suivis
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setExpanded((v) => !v)} 
                className="mt-6 font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric border-t border-navy/5 pt-4 w-full text-left cursor-pointer hover:text-navy transition-colors"
              >
                {expanded ? "Masquer les articles sélectionnés" : "Voir les articles sélectionnés"}
              </button>
            </div>
          )}

          {(expanded || !isLiveMode) && (
            <div className="flex flex-col gap-8">
              {groupedSubjects.map((group) => (
                <div key={group.title} className="flex flex-col gap-4">
                  <h3 className="font-display text-2xl text-navy tracking-wide border-b border-navy/10 pb-2 uppercase">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map((sub, i) => {
                      const displayReason = sub.reason && sub.reason !== "ucl_final_2026_rehearsal" ? sub.reason : null;
                      return (
                        <motion.div 
                          key={sub.id}
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-navy/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-electric transition-colors shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            <span className="font-mono text-xs font-bold px-2 py-1 bg-navy/5 text-navy border border-navy/10 min-w-[36px] text-center uppercase rounded-sm">
                              {sub.languageCode || "—"}
                            </span>
                            <div className="flex flex-col gap-1">
                              {sub.canonicalUrl ? (
                                <a
                                  href={sub.canonicalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-sans text-base font-semibold text-navy hover:text-blue-electric transition-colors leading-snug break-all sm:break-normal"
                                >
                                  {sub.pageTitle || sub.label}
                                </a>
                              ) : (
                                <span className="font-sans text-base font-semibold text-navy leading-snug">
                                  {sub.pageTitle || sub.label}
                                </span>
                              )}
                              {displayReason && (
                                <span className="font-sans text-xs text-navy/50 font-light">
                                  {displayReason}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {sub.canonicalUrl && (
                            <a
                              href={sub.canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[9px] uppercase tracking-widest text-blue-electric hover:underline flex items-center gap-1 self-start sm:self-center shrink-0"
                            >
                              Ouvrir sur Wikipédia ↗
                            </a>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 font-mono text-[10px] text-navy/40 uppercase tracking-widest text-center border-t border-navy/5 pt-6">
            La présence d’une modification dans cette sélection n’en fait pas automatiquement une histoire publiée.
          </div>
        </div>

      </div>
    </section>
  );
}
