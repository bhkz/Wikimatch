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
              <button onClick={() => setExpanded((v) => !v)} className="mt-6 font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric border-t border-navy/5 pt-4 w-full text-left">{expanded ? "Masquer les articles sélectionnés" : "Voir les articles sélectionnés"}</button>
            </div>
          )}

          {(expanded || !isLiveMode) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub, i) => (
              <motion.div 
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-navy/10 p-6 flex flex-col gap-3 hover:border-blue-electric transition-colors shadow-sm"
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-electric">
                  {sub.type === "match" ? "Page Match" : sub.type === "team" ? "Équipe" : sub.type === "player" ? "Joueur" : "Tournoi"}
                </div>
                <h4 className="font-display text-2xl uppercase tracking-wide text-navy">
                  {sub.label}
                </h4>
                <p className="font-sans text-sm text-navy/60 font-light leading-relaxed mt-auto">
                  {sub.reason}
                </p>
              </motion.div>
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
