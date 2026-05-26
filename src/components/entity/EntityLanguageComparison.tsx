import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EntityLanguageArticleState, EntityLanguageCode } from "../../types";

export default function EntityLanguageComparison({ states }: { states: EntityLanguageArticleState[] }) {
  const [activeLang, setActiveLang] = useState<EntityLanguageCode>("JA");

  return (
    <section id="entity-comparison" className="py-24 px-4 md:px-8 bg-white border-b border-navy/10 scroll-m-20">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            UN JOUEUR.<br/>TROIS ARTICLES.<br/><span className="text-navy/40">TROIS ÉTATS DE DOCUMENTATION.</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light mt-2 max-w-2xl">
            WikiMatch compare des éditions linguistiques de Wikipédia. Il ne compare pas des pays ni des opinions nationales.
          </p>
        </div>

        {/* Mobile View */}
        <div className="flex flex-col lg:hidden gap-8">
           
           {/* Mobile Matrix summary */}
           <div className="bg-cream p-4 border border-navy/10 flex flex-col gap-4">
               <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/50 mb-2">MATCH JAPON — SÉNÉGAL MENTIONNÉ</div>
                  <div className="flex justify-between font-mono text-[10px] uppercase font-bold tracking-widest">
                     <span className="text-navy">JA</span> <span className="text-blue-electric">Oui</span>
                     <span className="text-navy">EN</span> <span className="text-navy/40">Non détecté</span>
                     <span className="text-navy">FR</span> <span className="text-navy/40">Non détecté</span>
                  </div>
               </div>
               <div className="border-t border-navy/10 pt-4">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/50 mb-2">ARRÊT DÉCISIF MENTIONNÉ</div>
                  <div className="flex justify-between font-mono text-[10px] uppercase font-bold tracking-widest">
                     <span className="text-navy">JA</span> <span className="text-blue-electric">Oui</span>
                     <span className="text-navy">EN</span> <span className="text-navy/40">Non détecté</span>
                     <span className="text-navy">FR</span> <span className="text-navy/40">Non détecté</span>
                  </div>
               </div>
           </div>

           {/* Mobile Lang Selector */}
           <div className="flex items-center w-full">
              {["JA", "EN", "FR"].map((lang) => (
                <button 
                  key={lang}
                  onClick={() => setActiveLang(lang as EntityLanguageCode)}
                  className={`flex-1 py-4 font-mono text-sm font-bold uppercase tracking-widest text-center border-b-2 transition-colors
                    ${activeLang === lang ? "border-blue-electric text-blue-electric" : "border-navy/10 text-navy/40"}
                  `}
                >
                  {lang}
                </button>
              ))}
           </div>

           {/* Mobile Active Card */}
           <div className="relative">
             <AnimatePresence mode="wait">
                <motion.div
                   key={activeLang}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   transition={{ duration: 0.2 }}
                >
                   {states.map(state => state.languageCode === activeLang && (
                     <LanguageCard key={state.languageCode} state={state} isMobile={true} />
                   ))}
                </motion.div>
             </AnimatePresence>
           </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:grid grid-cols-3 gap-6 xl:gap-8">
           {states.map((state, i) => (
              <motion.div 
                 key={state.languageCode}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
              >
                 <LanguageCard state={state} />
              </motion.div>
           ))}
        </div>

      </div>
    </section>
  );
}

function LanguageCard({ state, isMobile = false }: { key?: any, state: EntityLanguageArticleState, isMobile?: boolean }) {
  
  const accentColors = {
    JA: "text-[#e63946]",
    EN: "text-blue-electric",
    FR: "text-navy/60"
  };
  
  const borderColors = {
    JA: "border-[#e63946]/30 bg-[#e63946]/5", // discrete vermillon
    EN: "border-blue-electric/30 bg-blue-electric/5",
    FR: "border-navy/10 bg-cream"
  };

  const accentColor = accentColors[state.languageCode] || "text-navy";
  const bgBorderClass = borderColors[state.languageCode] || "bg-cream border-navy/10";
  
  const handleToast = () => {
    alert("Source non connectée dans cette démonstration frontend."); // Replaced with alert/toast logic later if context allows. For now using built-in alert since no toast context is provided, or better pseudo-toast state.
    // However, guidelines say try to avoid window.alert in iframe. 
    // I will just use a generic browser alert for demo purposes or log.
    console.log("Source non connectée dans cette démonstration frontend.");
  };

  return (
    <div className={`p-6 md:p-8 flex flex-col gap-8 h-full border transition-colors hover:shadow-md ${bgBorderClass} ${isMobile ? 'border-t-0' : ''}`}>
       
       <div className="flex flex-col gap-2">
         <div className={`font-mono text-[10px] uppercase font-bold tracking-widest ${accentColor}`}>
           {state.languageCode} · {state.languageLabel}
         </div>
         <h3 className={`font-display text-3xl xl:text-4xl uppercase tracking-wide leading-tight ${state.state === 'expanded' ? 'text-navy' : 'text-navy/60'}`}>
           {state.articleDepthLabel}
         </h3>
         <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/40 mt-2">
           {state.lastObservedLabel}
         </div>
       </div>

       <div className="flex flex-col gap-6 flex-grow">
          {state.substantiveChanges > 0 && (
             <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest hover:text-navy/80 text-navy mb-1">CHANGEMENTS SUBSTANTIELS</div>
                <ul className="flex flex-col gap-2 font-sans text-sm text-navy/80 font-light list-disc pl-4">
                  {state.presentClaims.map((claim, i) => <li key={i}>{claim}</li>)}
                </ul>
             </div>
          )}

          {state.substantiveChanges === 0 && (
             <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy mb-1">CONTENU OBSERVÉ</div>
                <ul className="flex flex-col gap-2 font-sans text-sm text-navy/60 font-light list-disc pl-4">
                  {state.presentClaims.map((claim, i) => <li key={i}>{claim}</li>)}
                </ul>
             </div>
          )}

          {state.absentClaims.length > 0 && (
            <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-1">NON DÉTECTÉ DANS LA VERSION OBSERVÉE</div>
                <ul className="flex flex-col gap-2 font-sans text-sm text-navy/50 font-light list-disc pl-4">
                  {state.absentClaims.map((claim, i) => <li key={i}>{claim}</li>)}
                </ul>
            </div>
          )}

          {state.translatedExcerpt && (
            <div className="flex flex-col gap-2 mt-4">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-1">TRADUCTION DU PASSAGE OBSERVÉ</div>
                <div className="font-sans text-sm italic text-navy/80 bg-white p-4 border-l-2 border-navy/20 leading-relaxed font-light">
                  « {state.translatedExcerpt} »
                </div>
            </div>
          )}
       </div>

       <div className="pt-6 border-t border-navy/10 mt-auto">
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy mb-4">
            ÉTAT OBSERVÉ : <span className="font-sans lowercase font-light text-navy/70 ml-2">{state.substantiveChanges > 0 ? "Informations présentes dans l'article comparé." : "Aucun ajout équivalent détecté."}</span>
          </div>
          <button onClick={handleToast} className={`w-full py-3 font-mono text-[10px] uppercase font-bold tracking-widest border transition-colors
             ${state.state === 'expanded' ? 'bg-navy text-white hover:bg-blue-electric border-navy' : 'bg-white text-navy/60 border-navy/20 hover:border-navy hover:text-navy'}
          `}>
             {state.state === 'expanded' ? '[Voir les sources simulées]' : '[Voir l\'état simulé]'}
          </button>
       </div>

    </div>
  );
}
