import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ObservatoryStorySourceChain } from "../../types";

export default function StorySourceChainSection({ chain }: { chain: ObservatoryStorySourceChain }) {
  return (
    <section id="story-source-chain" className="py-24 md:py-32 px-4 md:px-8 bg-cream border-b border-navy/10 relative scroll-m-20">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 md:gap-24 relative">
        
        <div className="flex flex-col gap-6 text-center">
          <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy bg-white px-4 py-2 border border-navy/10 w-fit mx-auto">
             DÉMONSTRATION · CHAÎNE DE PREUVE FICTIVE
          </div>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            COMMENT UNE STORY<br/><span className="text-navy/40">REMONTE À SES SOURCES</span>
          </h2>
        </div>

        <div className="flex flex-col gap-8 md:gap-16 items-center">
           
           {/* Sources row */}
           <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full justify-center relative z-10">
              
              <SourceBox 
                lang="EN · 22:48" 
                title="AJOUT OBSERVÉ" 
                desc="Mention de l'altercation et du carton rouge." 
                delay={0}
              />
              
              <SourceBox 
                lang="ES · 22:52" 
                title="AJOUT OBSERVÉ" 
                desc="Mention del carton rouge, sans altercation équivalente." 
                delay={0.1}
              />

              <SourceBox 
                lang="FR · 23:03" 
                title="ÉTAT COMPARÉ" 
                desc="Aucune mention équivalente détectée." 
                delay={0.2}
              />

           </div>

           {/* Arrow graphic */}
           <div className="flex justify-center -my-8 md:-my-12 z-0">
             <div className="w-[1px] h-24 md:h-32 bg-navy/20" />
           </div>

           {/* Story result */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.4 }}
             className="bg-white border border-navy shadow-md p-8 md:p-12 w-full max-w-3xl text-center flex flex-col items-center gap-6 z-10"
           >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] border-b border-[#e63946]/30 pb-2">
                 HISTOIRE PUBLIÉE · {chain.categoryLabel}
              </div>
              <h3 className="font-display text-4xl md:text-5xl uppercase tracking-wide text-navy leading-tight">
                 {chain.storyTitle}
              </h3>
              <p className="font-mono text-xs uppercase tracking-widest text-navy/50 font-bold">
                 Les articles comparés ne retiennent pas les mêmes éléments du même épisode fictif.
              </p>
           </motion.div>

        </div>

        {/* Narrative blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-8 max-w-4xl mx-auto">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="flex flex-col gap-4"
           >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-navy/5 px-2 py-1 w-fit">OBSERVATION</div>
              <p className="font-sans text-sm md:text-base text-navy/80 font-light leading-relaxed">
                 {chain.observation}
              </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="flex flex-col gap-4"
           >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] bg-[#e63946]/5 px-2 py-1 w-fit">LIMITE</div>
              <p className="font-sans text-sm md:text-base text-navy/80 font-light leading-relaxed">
                 {chain.limitation}
              </p>
           </motion.div>
        </div>

        <div className="flex justify-center">
           <Link to={chain.storyRoute} className="bg-navy text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric transition-colors shadow-sm">
             Lire l'histoire complète
           </Link>
        </div>

      </div>
    </section>
  );
}

function SourceBox({ lang, title, desc, delay }: { lang: string, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
       initial={{ opacity: 0, y: 10 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
       transition={{ delay }}
       className="bg-white border border-navy/10 p-6 flex flex-col gap-4 w-full md:w-64 text-center md:text-left shadow-sm"
    >
       <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">{lang}</div>
       <div className="font-sans text-sm font-bold text-navy">{title}</div>
       <p className="font-sans text-xs text-navy/70 leading-relaxed font-light">{desc}</p>
    </motion.div>
  );
}
