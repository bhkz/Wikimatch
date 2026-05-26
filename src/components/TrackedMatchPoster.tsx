import { motion } from "motion/react";
import { Link } from "react-router-dom";
import DemoBadge from "./DemoBadge";
import type { TrackedMatch } from "../types";

export default function TrackedMatchPoster({
  nextMatch,
}: {
  nextMatch: TrackedMatch;
}) {
  return (
    <section id="matchs" className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative overflow-hidden bg-grid-pattern-light">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
          PROCHAIN MATCH SURVEILLÉ
        </h2>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full bg-navy text-cream flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Background Poster Image */}
          <div className="absolute inset-0 opacity-20 hidden md:block">
            <img src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=2000&auto=format&fit=crop" alt="Stadium" className="w-full h-full object-cover grayscale" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row w-full h-full">
            
            {/* Poster Info */}
            <div className="flex-grow p-8 md:p-12 flex flex-col gap-12 justify-between border-b md:border-b-0 md:border-r border-cream/10">
              <div className="flex justify-between items-start">
                <DemoBadge />
                <div className="font-mono text-xs text-cream/40 uppercase tracking-widest text-right">
                  {nextMatch.stage}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 md:gap-8 py-12 md:py-24">
                <div className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider uppercase text-center w-full flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12">
                  <span>{nextMatch.teams[0]}</span>
                  <div className="w-full md:w-32 h-[1px] md:h-1 bg-blue-electric my-4 md:my-0 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy px-4 font-mono text-sm tracking-widest text-cream/50">VS</span>
                  </div>
                  <span>{nextMatch.teams[1]}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 font-mono font-medium tracking-widest">
                <div className="text-xl md:text-2xl uppercase">
                  {nextMatch.dateLabel}
                </div>
                <div className="text-xs md:text-sm text-blue-electric uppercase bg-blue-electric/10 px-4 py-2 border border-blue-electric/20 rounded-none">
                  {nextMatch.timeLabel}
                </div>
              </div>
            </div>

            {/* Sidebar / Context */}
            <div className="w-full md:w-[400px] p-8 md:p-12 flex flex-col justify-between bg-navy/95 backdrop-blur-sm">
              <div className="flex flex-col gap-6">
                <p className="font-sans text-sm md:text-base leading-relaxed text-cream/70 font-light">
                  Au coup d’envoi, WikiMatch suivra les pages du match, des deux sélections, des joueurs concernés et du tournoi pour documenter ce qui entre réellement dans Wikipédia.
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  <span className="font-mono text-[10px] text-cream/40 uppercase">Pages suivies</span>
                  <span className="font-mono text-xs uppercase text-cream border-t border-cream/10 pt-2">{nextMatch.trackedPagesLabel}</span>
                </div>
              </div>
              <Link to="/match/demo-france-belgique" className="mt-12 bg-cream text-navy px-6 py-4 font-medium uppercase font-display tracking-widest text-lg hover:bg-blue-electric hover:text-white transition-colors w-full text-center">
                Voir comment un match sera raconté
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
