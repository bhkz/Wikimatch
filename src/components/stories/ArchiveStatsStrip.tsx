import { motion } from "motion/react";
import { StoriesArchiveStats } from "../../types";

export default function ArchiveStatsStrip({ stats }: { stats: StoriesArchiveStats }) {
  return (
    <section className="bg-cream border-b border-navy/10 relative z-20 py-8 px-4 md:px-8">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
          <div className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-navy/40 px-2 py-1 border border-navy/10 rounded-sm">
            EXEMPLE D’INTERFACE · DONNÉES FICTIVES
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 relative text-navy border-t border-navy/10 pt-6">
          <StatBlock label="histoires publiées" value={stats.storyCount} delay={0.1} />
          <StatBlock label="matchs documentés" value={stats.matchCount} delay={0.2} />
          <StatBlock label="éditions linguistiques comparées" value={stats.languageCount} delay={0.3} />
          <StatBlock label="sources associées" value={stats.sourceCount} delay={0.4} />
        </div>

        <p className="font-sans text-sm text-navy/60 font-light max-w-2xl mt-4">
          Une histoire publique résulte d'un changement substantiel observé, comparé et validé — jamais d'un simple volume d'activité.
        </p>

      </div>
    </section>
  );
}

function StatBlock({ label, value, delay }: { label: string, value: number, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col gap-1 md:border-r border-navy/10 last:border-r-0 md:pr-4"
    >
      <div className="font-display text-4xl sm:text-5xl tracking-wide uppercase text-blue-electric">
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/70 leading-snug">
        {label}
      </div>
    </motion.div>
  );
}
