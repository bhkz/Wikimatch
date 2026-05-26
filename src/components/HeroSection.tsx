import { motion } from "motion/react";
import { Link } from "react-router-dom";
import DemoBadge from "./DemoBadge";
import type { PublishedStory } from "../types";

export default function HeroSection({
  featuredStory,
}: {
  featuredStory: PublishedStory;
}) {
  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-end overflow-hidden pt-24 pb-12 px-4 md:px-8 bg-navy text-cream">
      
      {/* Background Image & Effects */}
      <motion.div 
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="https://images.unsplash.com/photo-1508344928928-7137b29de218?q=80&w=2600&auto=format&fit=crop" 
          alt="Stadium at night" 
          className="w-full h-full object-cover opacity-30"
        />
        {/* Dark subtle overlay + faint grid */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/30" />
        <div className="absolute inset-0 bg-grid-pattern-light opacity-10" />
      </motion.div>

      {/* Floating Abstract Metadata (Decorative) — anchored to the top of the
          hero, well above the headline block which sits at the bottom via
          justify-end. Hidden on small screens where the layout is single-column. */}
      <div className="absolute top-24 right-8 xl:right-16 hidden lg:flex flex-col gap-2 font-mono text-[10px] text-cream/40 items-end z-0 pointer-events-none">
        <span>FR ................. [ 292 EDITS ]</span>
        <span>EN ................. [ 1.2K EDITS ]</span>
        <span>ES ................. [ 543 EDITS ]</span>
      </div>
      <div className="absolute top-24 left-8 xl:left-16 hidden lg:flex flex-col gap-2 font-mono text-[10px] text-cream/40 z-0 pointer-events-none">
        <span>ARTICLE COMPARÉ</span>
        <span>VERSION OBSERVÉE</span>
        <span>SOURCES DISPONIBLES</span>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-8 md:gap-12">
        <div className="flex flex-col gap-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-mono text-xs md:text-sm text-cream/70 uppercase tracking-widest"
          >
            WIKIMATCH · COUPE DU MONDE 2026 · MÉDIA DATA INDÉPENDANT
          </motion.p>

          <h1 className="font-display text-[3.5rem] leading-[0.9] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] xl:text-[8.5rem] 2xl:text-[10rem] uppercase tracking-wide">
            <span className="block overflow-hidden">
              <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">Le match se joue</motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">sur le terrain.</motion.span>
            </span>
            <span className="block overflow-hidden text-blue-electric">
              <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">Son histoire s’écrit</motion.span>
            </span>
            <span className="block overflow-hidden text-blue-electric">
              <motion.span initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">sur Wikipédia.</motion.span>
            </span>
          </h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-col gap-8 md:items-start justify-start pb-24 lg:pb-0"
        >
          <div className="max-w-md font-sans text-sm md:text-lg text-cream/80 leading-relaxed font-light">
            WikiMatch observe comment les matchs, les joueurs et les équipes apparaissent, diffèrent et se stabilisent dans les différentes éditions linguistiques de Wikipédia.
          </div>
          
          <div className="flex flex-col items-start gap-4">
            <div className="font-mono text-[10px] md:text-xs text-cream/60 tracking-widest text-left">
              DIFFS SOURCÉS · ÉDITIONS COMPARÉES · HISTOIRES VALIDÉES
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to={`/story/${featuredStory.slug}`} className="bg-blue-electric text-white px-6 py-3 rounded-none font-medium hover:bg-white hover:text-blue-electric transition-colors whitespace-nowrap group text-center">
                Lire l’histoire à la une
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link to="/observatoire" className="border border-cream/30 text-cream px-6 py-3 rounded-none font-medium hover:bg-cream/10 transition-colors whitespace-nowrap text-center">
                Ouvrir l’Observatoire
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Teaser (Scrolls up) */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-4 right-4 md:right-8 z-20 w-[90%] md:w-[400px] hidden lg:block"
      >
        <Link to={`/story/${featuredStory.slug}`}>
          <div className="bg-cream text-navy p-6 shadow-2xl border-t-4 border-blue-electric flex flex-col gap-4 hover:translate-y-[-4px] transition-transform">
            <DemoBadge />
            <div>
              <div className="font-mono text-xs text-navy/50 mb-1">À LA UNE</div>
              <h3 className="font-display text-2xl uppercase leading-tight">Un même carton rouge. Trois traitements Wikipédia.</h3>
            </div>
            <div className="flex gap-2">
              {["EN", "ES", "FR"].map(lang => (
                <span key={lang} className="px-2 py-1 bg-navy/5 font-mono text-[10px] rounded">{lang}</span>
              ))}
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
