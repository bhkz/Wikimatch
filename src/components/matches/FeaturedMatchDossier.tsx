import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { TrackedMatchCard } from "../../types";

export default function FeaturedMatchDossier({ match }: { match: TrackedMatchCard }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        
        <div className="flex items-center gap-4">
          <h2 className="font-mono text-sm uppercase font-bold tracking-widest text-navy bg-navy/5 px-4 py-2 border border-navy/10 w-fit">
            DOSSIER À LA UNE
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 border border-navy/10 bg-white hover:border-navy/30 transition-colors shadow-sm group">
          
          {/* Left: Image / Poster style */}
          <div className="w-full lg:w-5/12 aspect-[4/3] lg:aspect-auto lg:min-h-full bg-navy relative overflow-hidden flex flex-col items-center justify-center p-8 text-center text-cream">
            <motion.img 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 1 }}
              src="https://images.unsplash.com/photo-1518605368461-1e96a4abcb32?q=80&w=1600&auto=format&fit=crop" 
              alt="Match Cover"
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent opacity-80" />
            
            <div className="relative z-10 flex flex-col items-center gap-6">
              {(match.isDemo) && (
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest bg-blue-electric px-3 py-1 text-white">
                  DÉMONSTRATION · DOSSIER FICTIF
                </div>
              )}
              <div className="font-display text-5xl md:text-7xl uppercase tracking-widest text-white leading-none">
                {match.homeTeam.name}
              </div>
              <div className="font-display text-4xl text-blue-electric">
                {match.score?.[0]} <span className="opacity-50">—</span> {match.score?.[1]}
              </div>
              <div className="font-display text-5xl md:text-7xl uppercase tracking-widest text-white leading-none">
                {match.awayTeam.name}
              </div>
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-cream/60 mt-4">
                {match.stageLabel} · {match.dateLabel}
              </div>
              <div className="font-mono text-xs uppercase tracking-widest font-bold text-blue-electric border border-blue-electric/30 px-4 py-2 mt-2 bg-navy/50 backdrop-blur-sm">
                {match.statusLabel}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="w-full lg:w-7/12 p-8 md:p-16 flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <h3 className="font-display text-5xl sm:text-6xl md:text-7xl uppercase tracking-wide leading-[0.85] text-navy group-hover:text-blue-electric transition-colors">
                UN RÉSULTAT CONVERGE.<br/>
                UN INCIDENT DIVERGE.
              </h3>
              <p className="font-sans text-lg text-navy/70 leading-relaxed font-light mt-2 max-w-xl">
                {match.editorialSummary}
              </p>
            </div>

            <div className="flex justify-between items-end mt-12 mb-12 border-l-2 border-navy/10 pl-6">
               <div className="flex flex-col gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-navy/60">
                 <span className="text-navy text-sm">{match.storyCount} HISTOIRES PUBLIÉES</span>
                 <span className="flex items-center gap-2 mt-1">
                   {match.languagesCompared?.map(l => (
                     <span key={l} className="bg-navy/5 px-2 py-0.5 rounded-sm text-navy">{l}</span>
                   ))}
                 </span>
                 <span className="mt-2">1 ARTICLE INSTABLE OBSERVÉ</span>
               </div>
            </div>

            <div className="flex flex-col gap-3 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-navy/80 mb-12">
               <div className="flex items-start gap-4">
                 <span className="font-bold text-blue-electric">01</span>
                 <span>Un même carton rouge. Trois traitements Wikipédia.</span>
               </div>
               <div className="flex items-start gap-4">
                 <span className="font-bold text-blue-electric">02</span>
                 <span>Le résultat final apparaît dans trois éditions.</span>
               </div>
               <div className="flex items-start gap-4">
                 <span className="font-bold text-blue-electric">03</span>
                 <span>Une mention retirée puis réintroduite sur l'article anglais.</span>
               </div>
            </div>

            <div className="pt-8 border-t border-navy/10 flex justify-end">
               <Link 
                 to={match.availableRoute || "#"} 
                 className="bg-navy text-white px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest hover:bg-blue-electric transition-colors text-center w-full md:w-auto"
               >
                 Ouvrir le dossier du match
               </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
