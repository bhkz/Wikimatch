import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PublishedStoryDetail } from "../../types";

export default function StorySourcesSection({ story }: { story: PublishedStoryDetail }) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 shadow-inner">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            REMETTRE LES SOURCES AU CENTRE
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light max-w-2xl">
            Chaque histoire publiée par WikiMatch doit pouvoir être vérifiée dans les modifications Wikipédia qui l’ont fondée.
          </p>
        </div>

        <div className="mb-4 inline-flex w-fit">
          <div className="px-3 py-1.5 rounded bg-navy/10 text-navy font-mono text-[10px] font-bold tracking-widest uppercase">
            DÉMONSTRATION · AUCUN LIEN RÉEL CONNECTÉ DANS CETTE MAQUETTE
          </div>
        </div>

        {/* Source Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {story.languageStates.map((state, i) => (
            <motion.div 
              key={state.languageCode}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-navy/10 p-6 flex flex-col justify-between min-h-[220px] shadow-sm hover:border-navy/30 transition-colors"
            >
              <div className="flex flex-col gap-4">
                <div className="font-mono text-[10px] uppercase tracking-widest font-bold text-navy flex items-center gap-2">
                  <span className="text-blue-electric text-sm">{state.languageCode}</span> · {state.languageLabel}
                </div>
                <div className="font-sans text-sm text-navy/80 font-medium">
                  {state.articleLabel} · {state.status === 'absent' ? 'Version' : 'modification'} observée à {state.revisionTime}
                </div>
                <div className="font-sans text-sm text-navy/60 font-light italic">
                  {state.status === 'absent' ? "Aucun passage équivalent détecté." : state.observedChange}
                </div>
              </div>
              
              <button 
                className="mt-6 flex items-center justify-between p-3 bg-navy/5 font-mono text-[10px] uppercase tracking-widest text-navy/40 border border-navy/10 hover:bg-navy/10 transition-colors w-full group relative overflow-hidden"
              >
                <span>Ouvrir {state.status === 'absent' ? "l'état observé" : "la modification source"}</span>
                <span className="text-lg leading-none">↗</span>
                
                {/* Tooltip demonstration hint */}
                <div className="absolute inset-0 bg-navy text-cream flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Source non connectée
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Technical Accordion */}
        <div className="mt-12 bg-white border border-navy/10 shadow-sm max-w-3xl mx-auto w-full">
          <button 
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex justify-between items-center p-6 text-left hover:bg-navy/5 transition-colors"
          >
            <span className="font-mono text-xs uppercase tracking-widest font-bold text-navy">
              Comment cette comparaison serait-elle vérifiée ?
            </span>
            {accordionOpen ? <ChevronUp className="w-5 h-5 text-navy/50" /> : <ChevronDown className="w-5 h-5 text-navy/50" />}
          </button>
          
          <AnimatePresence>
            {accordionOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 font-sans text-sm text-navy/70 leading-relaxed font-light border-t border-navy/5 mx-6">
                  <br />
                  WikiMatch compare des articles associés au même sujet, observe les passages ajoutés ou retirés, 
                  traduit les extraits lorsque nécessaire, puis publie uniquement les histoires validées éditorialement. 
                  Dans une version finale, chaque carte ci-dessus pointerait vers l'URL exacte du diff Wikipédia ("diff view") 
                  ou le permalien de la version de la page ("oldid") correspondant à l'heure indiquée.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
