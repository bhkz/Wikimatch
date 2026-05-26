import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function MatchSourcesSection() {
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 shadow-inner">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            LES PREUVES<br/>DERRIÈRE LE RÉCIT
          </h2>
          <div className="inline-flex mt-2">
            <span className="px-3 py-1.5 rounded bg-navy/10 text-navy font-mono text-[10px] font-bold tracking-widest uppercase">
              DÉMONSTRATION · SOURCES NON CONNECTÉES
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-8">
          
          <div className="flex flex-col gap-6">
            <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-navy/40 border-b border-navy/10 pb-4">
              Événements sportifs
            </h3>
            <div className="flex flex-col gap-4">
              <div className="bg-white border text-left border-navy/10 p-6 shadow-sm">
                <div className="font-mono text-[10px] uppercase font-bold text-navy/50 mb-2">Événement officiel du match</div>
                <div className="font-display text-2xl uppercase text-navy">Carton rouge à la 87e minute</div>
                <button className="mt-6 text-navy/40 uppercase font-mono text-[10px] tracking-widest underline decoration-navy/20 underline-offset-4 hover:text-navy cursor-not-allowed">Source officielle à connecter</button>
              </div>
              <div className="bg-white border text-left border-navy/10 p-6 shadow-sm">
                <div className="font-mono text-[10px] uppercase font-bold text-navy/50 mb-2">Résultat final</div>
                <div className="font-display text-2xl uppercase text-navy">France 2 — 1 Belgique</div>
                <button className="mt-6 text-navy/40 uppercase font-mono text-[10px] tracking-widest underline decoration-navy/20 underline-offset-4 hover:text-navy cursor-not-allowed">Source officielle à connecter</button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
             <h3 className="font-mono text-xs uppercase font-bold tracking-widest text-navy/40 border-b border-navy/10 pb-4">
              Modifications Wikipédia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { lang: "EN", type: "Article du match", action: "Résultat final ajouté · 22:41" },
                { lang: "EN", type: "Article du joueur", action: "Incident ajouté · 22:48" },
                { lang: "ES", type: "Article du joueur", action: "Sanction ajoutée · 22:52" },
                { lang: "FR", type: "Article du joueur", action: "État observé sans mention équivalente · 23:03" }
              ].map((item, i) => (
                <div key={i} className="bg-white border border-navy/10 p-6 flex flex-col justify-between shadow-sm min-h-[160px] group">
                  <div className="flex flex-col gap-2">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy">
                      <span className="text-blue-electric">{item.lang}</span> · {item.type}
                    </div>
                    <div className="font-sans text-sm font-light leading-relaxed text-navy/80">
                      {item.action}
                    </div>
                  </div>
                  <button className="mt-4 flex items-center justify-between text-navy/40 group-hover:text-blue-electric transition-colors uppercase font-mono text-[10px] tracking-widest border-t border-navy/5 pt-3 w-full text-left relative overflow-hidden">
                    <span className="z-10 bg-white group-hover:opacity-0 transition-opacity">Ouvrir l'observation</span>
                    <span className="text-lg leading-none z-10 bg-white group-hover:opacity-0 transition-opacity">↗</span>
                    <div className="absolute inset-0 bg-navy text-white items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity flex">
                      Non connecté
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Accordion */}
        <div className="mt-12 bg-white border border-navy/10 shadow-sm max-w-3xl mx-auto w-full">
          <button 
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex justify-between items-center p-6 text-left hover:bg-navy/5 transition-colors text-navy"
          >
            <span className="font-mono text-xs uppercase tracking-widest font-bold">
              Comment une histoire est-elle publiée ?
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
                  Les modifications brutes sont d'abord observées. Les changements substantiels sont ensuite comparés. Une histoire publique n'apparaît qu'après validation éditoriale.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
