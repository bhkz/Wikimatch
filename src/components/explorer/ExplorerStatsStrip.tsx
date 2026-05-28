import { motion } from "motion/react";
import { ExplorerStats } from "../../types";

export default function ExplorerStatsStrip({ stats }: { stats: ExplorerStats }) {
  return null;
  return (
    <section className="py-12 px-4 md:px-8 border-b border-navy/10 bg-white relative z-20">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
        
        <div className="flex flex-col gap-2 shrink-0 text-center md:text-left">
           <div className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy/60 bg-navy/5 px-2 py-1 border border-navy/10">
             {stats.isDemo ? "EXEMPLE D'INTERFACE · DONNÉES FICTIVES" : "EXPLORER LIVE · HISTOIRES PUBLIÉES"}
           </div>
           <p className="font-sans text-xs text-navy/50 font-light max-w-xs mt-2">
             {stats.isDemo
               ? "Ces indicateurs décrivent uniquement les histoires fictives présentées dans la maquette."
               : "Ces indicateurs sont calculés depuis les stories publiées, sujets suivis et matchs présents en base."}
           </p>
        </div>

        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-6 md:gap-12 w-full justify-around lg:justify-end">
           <StatBox value={stats.publishedStories} label="histoires publiées" delay={0.1} />
           <StatBox value={stats.mappedSubjects} label="sujets cartographiés" delay={0.2} />
           <StatBox value={stats.comparedEditions} label="éditions linguistiques comparées" delay={0.3} />
           <StatBox value={stats.documentedMatches} label="matchs documentés" delay={0.4} />
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
