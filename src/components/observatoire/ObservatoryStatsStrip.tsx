import { motion } from "motion/react";
import { ObservatoryPublicStats } from "../../types";

export default function ObservatoryStatsStrip({ stats }: { stats: ObservatoryPublicStats }) {
  return (
    <section className="py-12 px-4 md:px-8 border-b border-navy/10 bg-white relative z-20">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
        
        <div className="flex flex-col gap-2 shrink-0 text-center md:text-left">
           <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy/60 bg-navy/5 px-2 py-1 border border-navy/10">
             {stats.isDemo ? "EXEMPLE D'INTERFACE · DONNÉES FICTIVES" : "OBSERVATOIRE LIVE · DONNÉES WIKIPÉDIA"}
           </div>
           <p className="font-sans text-xs text-navy/50 font-light max-w-xs mt-2">
             {stats.isDemo
               ? "Ces chiffres décrivent uniquement le jeu de traces fictives utilisé pour concevoir l’interface."
               : "Ces chiffres sont calculés depuis les traces, extraits publics et articles réellement présents dans Supabase."}
           </p>
        </div>

        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-6 md:gap-12 w-full justify-around lg:justify-end">
           <StatBox value={stats.observedTraces} label="traces observées" delay={0.1} />
           <StatBox value={stats.substantialChanges} label="changements substantiels" delay={0.2} />
           <StatBox value={stats.publishedStoryLinks} label="liens vers des histoires" delay={0.3} />
           <StatBox value={stats.monitoredArticles} label="articles surveillés" delay={0.4} />
        </div>

      </div>
    </section>
  );
}

function StatBox({ value, label, delay }: { value: number, label: string, delay: number }) {
  return (
    <motion.div 
       initial={{ opacity: 0, y: 10 }}
       whileInView={{ opacity: 1, y: 0 }}
       viewport={{ once: true }}
       transition={{ delay, duration: 0.5 }}
       className="flex flex-col gap-1 items-center md:items-start"
    >
       <div className="font-display text-4xl md:text-6xl text-navy">{value}</div>
       <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/60 max-w-[120px] text-center md:text-left leading-tight">
         {label}
       </div>
    </motion.div>
  );
}
