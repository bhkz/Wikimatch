import { motion } from "motion/react";
import { PublishedStoryDetail } from "../../types";
import StoryDemoBadge from "./StoryDemoBadge";

export default function StoryHero({ story }: { story: PublishedStoryDetail }) {
  return (
    <section className="relative min-h-[88svh] md:min-h-screen w-full flex flex-col justify-end overflow-hidden pt-32 pb-16 px-4 md:px-8 bg-navy text-cream">
      
      {/* Background Image & Effects */}
      <motion.div 
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 z-0 bg-navy"
      >
        <img 
          src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=2600&auto=format&fit=crop" 
          alt="Stadium incident" 
          className="w-full h-full object-cover opacity-20 grayscale brightness-150"
        />
        {/* Dark subtle overlay + faint grid */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/40" />
        <div className="absolute inset-0 bg-grid-pattern-light opacity-5 mix-blend-overlay" />
      </motion.div>

      {/* Floating Graphics */}
      <div className="absolute top-1/4 right-8 hidden lg:flex flex-col gap-4 font-display text-7xl text-cream/5 items-end uppercase pointer-events-none">
        {story.languages.map(l => (
          <span key={l}>{l}</span>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-end">
        <div className="flex flex-col gap-6 md:w-2/3">
          <div className="flex flex-col items-start gap-4">
            <StoryDemoBadge />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="font-mono text-xs text-blue-electric uppercase tracking-widest"
            >
              {story.categoryLabel}
            </motion.p>
          </div>
          
          <h1 className="font-display text-[3.5rem] leading-[0.85] sm:text-[5rem] md:text-[6rem] lg:text-[7vw] uppercase tracking-wide">
            {story.title.split('. ').map((line, i) => (
              <span key={i} className="block overflow-hidden pb-2">
                <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.4 + (i * 0.1), duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">
                  {line}{i < story.title.split('. ').length - 1 ? '.' : ''}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="max-w-xl font-sans text-lg md:text-xl text-cream/80 leading-relaxed font-light mt-4"
          >
            {story.subtitle}
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="md:w-1/3 flex flex-col gap-6 border-l md:border-l-0 md:border-r border-cream/20 pl-6 md:pl-0 md:pr-8 md:text-right"
        >
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-cream/40 tracking-widest uppercase">Match surveillé</span>
            <span className="font-display text-2xl uppercase tracking-wider">{story.matchLabel}</span>
            <span className="font-mono text-xs text-cream/60">{story.matchStage}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-cream/40 tracking-widest uppercase">Éditions analysées</span>
            <div className="flex flex-wrap md:justify-end gap-2 mt-1">
              {story.languages.map(l => (
                <span key={l} className="px-2 py-1 bg-cream/10 font-mono text-[10px] rounded">{l}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="relative z-10 w-full flex justify-center mt-16 md:mt-24"
      >
        <div className="flex flex-col items-center gap-2 text-cream/50 animate-bounce">
          <span className="font-mono text-[10px] tracking-widest uppercase text-center max-w-[200px]">Faire défiler pour comparer les versions</span>
          <span className="text-xl">↓</span>
        </div>
      </motion.div>
    </section>
  );
}
