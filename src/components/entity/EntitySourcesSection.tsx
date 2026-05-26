import { motion } from "motion/react";
import { EntityLanguageArticleState } from "../../types";

export default function EntitySourcesSection({ states }: { states: EntityLanguageArticleState[] }) {
  
  const handleToast = () => {
    alert("Source non connectée dans cette démonstration frontend.");
    console.log("Source non connectée dans cette démonstration frontend.");
  };

  return (
    <section id="entity-sources" className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 scroll-m-20">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#e63946] bg-navy/5 px-4 py-2 border border-[#e63946]/20 w-fit mx-auto md:mx-0 mb-4">
             DÉMONSTRATION · AUCUNE SOURCE RÉELLE CONNECTÉE
          </div>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy">
            LES ARTICLES<br/>DERRIÈRE LE DOSSIER
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {states.map((state, i) => (
             <motion.div 
                key={state.languageCode}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col bg-white border border-navy/10 p-6 flex-grow shadow-sm"
             >
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy mb-4 border-b border-navy/10 pb-4">
                  {state.languageCode} · {state.languageLabel}
                </div>
                <div className="font-sans text-sm text-navy/80 font-bold mb-2">
                  {state.articleLabel}
                </div>
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 mb-6 font-light">
                  {state.lastObservedLabel}
                </div>

                <div className="font-sans text-sm text-navy/70 leading-relaxed font-light mb-8 flex-grow">
                  {state.substantiveChanges > 0 
                    ? `${state.substantiveChanges} ajouts substantiels simulés : match, titularisation, arrêt décisif.` 
                    : `Aucun ajout équivalent détecté dans la version simulée.`}
                </div>

                <button 
                  onClick={handleToast}
                  className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy border border-navy/20 py-3 hover:bg-navy/5 transition-colors"
                >
                  {state.substantiveChanges > 0 ? '[Ouvrir les modifications sources]' : '[Ouvrir l\'état observé]'}
                </button>
             </motion.div>
           ))}
        </div>

        <div className="mt-8 border border-navy/10 bg-white p-8 group">
           <h4 className="font-mono text-sm uppercase font-bold tracking-widest text-navy mb-4">
             Comment un sujet Sous le radar est-il validé ?
           </h4>
           <p className="font-sans text-sm text-navy/70 leading-relaxed font-light max-w-3xl">
             WikiMatch doit identifier un changement substantiel dans une édition linguistique, vérifier qu'il concerne bien le joueur ou l'événement suivi, puis comparer des articles équivalents dans d'autres éditions. Une activité plus forte seule ne suffit pas. L'histoire repose sur le contenu effectivement observé.
           </p>
        </div>

      </div>
    </section>
  );
}
