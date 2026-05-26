import { motion } from "motion/react";
import { ArticleInstabilityCase } from "../../types";
import MatchDemoBadge from "./MatchDemoBadge";

export default function ArticleInstabilityFeature({ data }: { data: ArticleInstabilityCase }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-cream relative overflow-hidden bg-grid-pattern">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Left Text */}
        <div className="flex flex-col gap-8 w-full lg:w-5/12 z-10">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-4xl sm:text-5xl uppercase leading-none">
              ICI, LA TENSION SE JOUE<br/>SUR UN SEUL ARTICLE.
            </h2>
          </div>
          <p className="font-sans text-lg text-cream/70 leading-relaxed font-light mt-4">
            Plusieurs langues qui modifient le même sujet ne constituent pas une guerre d'édition. Une instabilité apparaît lorsqu'un même article ajoute, retire ou réintroduit un passage de manière répétée.
          </p>
          <div className="mt-8 flex flex-col gap-4 border-l border-cream/20 pl-6">
            <span className="font-mono text-[10px] tracking-widest uppercase text-cream/40 font-bold">STATUT</span>
            <p className="font-sans text-cream/90">{data.observation}</p>
          </div>
          <div className="flex flex-col gap-4 border-l border-cream/20 pl-6 text-cream/50">
             <span className="font-mono text-[10px] tracking-widest uppercase font-bold">LIMITE</span>
             <p className="font-sans text-sm font-light leading-relaxed">{data.limitation}</p>
          </div>
        </div>

        {/* Right Feature Panel */}
        <div className="w-full lg:w-7/12 flex justify-end z-10">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-[#0B1021] border border-cream/10 p-6 md:p-10 w-full shadow-2xl relative"
          >
            <div className="absolute top-4 right-4">
              <MatchDemoBadge text="ARTICLE ANGLAIS · DÉMONSTRATION" />
            </div>

            <h3 className="font-display text-3xl md:text-4xl text-cream uppercase mt-8 mb-2">
              UNE MENTION AJOUTÉE,<br/>RETIRÉE, PUIS SOURCÉE.
            </h3>
            <div className="font-mono text-xs uppercase text-cream/40 tracking-widest mb-12">
              {data.articleLabel}
            </div>

            <div className="flex flex-col gap-6 relative">
              {/* Vertical line connector */}
              <div className="absolute left-[5px] top-4 bottom-4 w-[2px] bg-cream/10 z-0" />

              {data.events.map((ev, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className="flex flex-col items-center mt-1">
                    <div className={`w-3 h-3 rounded-full border border-[#0B1021]
                      ${ev.action === 'added' ? 'bg-cream' : 
                        ev.action === 'removed' ? 'bg-red-signal' : 
                        ev.action === 'restored' ? 'bg-blue-electric' : 'bg-green-acid'}`} 
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full bg-cream/5 border border-cream/10 p-4 rounded-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-cream/40">{ev.time}</span>
                      <span className={`font-mono text-[10px] font-bold uppercase tracking-widest
                        ${ev.action === 'added' ? 'text-cream' : 
                          ev.action === 'removed' ? 'text-red-signal line-through decoration-red-signal/50' : 
                          ev.action === 'restored' ? 'text-blue-electric' : 'text-green-acid'}`}>
                        {ev.action === 'added' ? 'AJOUTÉ' : 
                         ev.action === 'removed' ? 'RETIRÉ' : 
                         ev.action === 'restored' ? 'RÉINTRODUIT' : 'SOURCÉ'}
                      </span>
                    </div>
                    <p className={`font-sans text-sm font-light mt-2 
                      ${ev.action === 'removed' ? 'text-cream/40 line-through' : 'text-cream/90'}`}>
                      {ev.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-8 bg-transparent text-cream border border-cream/20 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest w-full hover:bg-cream hover:text-navy transition-colors text-center">
              Voir les versions successives
            </button>
            <div className="text-center font-mono text-[10px] text-cream/30 uppercase mt-2">
              Versions non connectées dans la démonstration frontend.
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
