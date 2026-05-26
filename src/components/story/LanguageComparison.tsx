import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PublishedStoryDetail, StoryLanguageState } from "../../types";

export default function LanguageComparison({ story }: { story: PublishedStoryDetail }) {
  const [activeLang, setActiveLang] = useState(story.languages[0]);

  return (
    <section className="py-24 px-4 md:px-8 bg-cream-dark border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 max-w-3xl">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy leading-none">
            TROIS ÉDITIONS.<br />TROIS ÉTATS DU RÉCIT.
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light mt-2">
            WikiMatch compare des articles Wikipédia dans plusieurs langues.<br className="hidden sm:block"/>
            Il ne compare pas des opinions nationales.
          </p>
        </div>

        {/* --- MOBILE VIEW (Tabs) --- */}
        <div className="flex flex-col lg:hidden gap-8">
          <div className="sticky top-[110px] z-30 bg-cream-dark pt-2 pb-4 -mx-4 px-4 border-b border-navy/10">
            <div className="flex bg-navy/5 p-1 rounded">
              {story.languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`flex-1 py-3 text-center font-display text-2xl uppercase transition-all relative ${
                    activeLang === lang ? "text-navy" : "text-navy/40 hover:text-navy/60"
                  }`}
                >
                  {lang}
                  {activeLang === lang && (
                    <motion.div layoutId="mobileTabIndicator" className="absolute bg-white shadow-sm inset-0 rounded-sm -z-10 border border-navy/10" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick overview indicator under tabs */}
            <div className="mt-4 flex flex-col gap-2 font-mono text-[10px] uppercase bg-white p-3 border border-navy/10 rounded">
              <div className="flex items-center justify-between">
                <span className="text-navy/60">Incident mentionné</span>
                <div className="flex gap-4 w-1/2 justify-between px-2">
                  <span className={activeLang === "EN" ? "font-bold text-navy" : "text-navy/40"}>EN {story.languageStates.find(s=>s.languageCode==="EN")?.status !== "absent" ? "✓" : "—"}</span>
                  <span className={activeLang === "ES" ? "font-bold text-navy" : "text-navy/40"}>ES {story.languageStates.find(s=>s.languageCode==="ES")?.status !== "absent" && story.languageStates.find(s=>s.languageCode==="ES")?.status !== "reworded" ? "✓" : "—"}</span>
                  <span className={activeLang === "FR" ? "font-bold text-navy" : "text-navy/40"}>FR {story.languageStates.find(s=>s.languageCode==="FR")?.status !== "absent" ? "✓" : "—"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-navy/60">Sanction mentionnée</span>
                <div className="flex gap-4 w-1/2 justify-between px-2">
                  <span className={activeLang === "EN" ? "font-bold text-navy" : "text-navy/40"}>EN {story.languageStates.find(s=>s.languageCode==="EN")?.status !== "absent" ? "✓" : "—"}</span>
                  <span className={activeLang === "ES" ? "font-bold text-navy" : "text-navy/40"}>ES {story.languageStates.find(s=>s.languageCode==="ES")?.status !== "absent" ? "✓" : "—"}</span>
                  <span className={activeLang === "FR" ? "font-bold text-navy" : "text-navy/40"}>FR {story.languageStates.find(s=>s.languageCode==="FR")?.status !== "absent" ? "✓" : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeLang}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-navy/10 p-6 flex flex-col gap-8 shadow-sm"
            >
              {(() => {
                const state = story.languageStates.find((s) => s.languageCode === activeLang);
                if (!state) return null;
                return <LanguageColumnContent state={state} />;
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* --- DESKTOP VIEW (3 Columns) --- */}
        <div className="hidden lg:grid grid-cols-3 gap-6 relative">
          <div className="absolute top-[80px] left-0 right-0 h-[1px] bg-navy/10 z-0" />
          
          {story.languageStates.map((state, i) => (
            <motion.div
              key={state.languageCode}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="bg-white border text-left border-navy/10 p-8 flex flex-col gap-10 shadow-sm relative z-10 hover:-translate-y-1 transition-transform group"
            >
              <LanguageColumnContent state={state} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LanguageColumnContent({ state }: { state: StoryLanguageState }) {
  const getHeaderColor = (code: string) => {
    if (code === "EN") return "text-blue-electric";
    if (code === "ES") return "text-[#A8B227]"; // A subtle warm green/yellow
    return "text-navy/40"; // FR
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className={`font-display text-5xl ${getHeaderColor(state.languageCode)} group-hover:scale-105 transition-transform origin-left`}>
            {state.languageCode}
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-navy/60">
          {state.languageLabel}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 border-t border-navy/5 pt-2 mt-2">
          {state.articleLabel}
        </div>
      </div>

      <div className="flex flex-col gap-8 flex-grow">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest">OBSERVÉ À {state.revisionTime}</span>
          <p className="font-sans text-lg text-navy leading-snug font-medium min-h-[60px]">
            {state.observedChange}
          </p>
        </div>

        <div className="flex flex-col gap-3 flex-grow">
          <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest">
            {state.translatedExcerpt ? "TRADUCTION DU PASSAGE OBSERVÉ" : "PAS DE TRADUCTION"}
          </span>
          <div className="bg-navy/5 p-4 border border-navy/10 text-sm italic font-serif leading-relaxed text-navy min-h-[100px] flex items-start">
            {state.translatedExcerpt ? `« ${state.translatedExcerpt} »` : <span className="text-navy/40 font-sans not-italic font-mono text-[10px] uppercase pt-2">Aucun passage équivalent</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6 border-t border-navy/10">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-navy/40">ÉTAT OBSERVÉ</span>
          <span className={`font-mono text-xs uppercase tracking-wide ${state.status === "absent" ? "text-navy/50" : "text-navy font-bold"}`}>
            {state.status === "present" ? "Mention présente" : state.status === "reworded" ? "Sanction présente · incident non mentionné" : "Absent dans la version observée"}
          </span>
        </div>
        
        <button className="text-left font-mono text-[10px] uppercase tracking-widest underline decoration-navy/20 underline-offset-4 hover:decoration-blue-electric hover:text-blue-electric transition-colors mt-2 text-navy/60">
          [Voir {state.status === "absent" ? "l'état observé" : "la modification source"} · démonstration]
        </button>
      </div>
    </>
  );
}
