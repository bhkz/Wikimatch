import { motion } from "motion/react";
import { EntityRelatedMatch } from "../../types";

export default function EntityRelatedMatches({ matches }: { matches: EntityRelatedMatch[] }) {
  
  const handleToast = () => {
    alert("Le dossier complet de ce match sera construit dans une prochaine étape de la démonstration.");
    console.log("Le dossier complet de ce match sera construit dans une prochaine étape de la démonstration.");
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy">
            LES MATCHS<br/>QUI FAÇONNENT<br/><span className="text-navy/40">SON DOSSIER</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {matches.map((match, i) => (
              <MatchPoster key={match.id} match={match} index={i} onClick={handleToast} />
           ))}
        </div>

      </div>
    </section>
  );
}

function MatchPoster({ match, index, onClick }: { key?: any, match: EntityRelatedMatch, index: number, onClick: () => void }) {
  const isPrimary = index === 0;

  return (
     <button 
       onClick={onClick}
       className={`group flex flex-col border border-navy/10 hover:border-blue-electric transition-colors shadow-sm relative overflow-hidden text-left bg-navy
         ${isPrimary ? 'h-[400px] md:h-[500px]' : 'h-[400px] md:h-[500px] bg-navy/90'}
       `}
     >
        <motion.img 
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 1 }}
            src={isPrimary ? "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200&auto=format&fit=crop" : "https://images.unsplash.com/photo-1518605368461-1e96a4abcb32?q=80&w=800&auto=format&fit=crop"} 
            alt="Match cover" 
            className={`absolute inset-0 w-full h-full object-cover mix-blend-luminosity grayscale transition-all duration-700 
               ${isPrimary ? 'opacity-40 group-hover:grayscale-0' : 'opacity-20'}
            `} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-transparent" />
        
        <div className="p-8 flex flex-col gap-4 flex-grow z-10 justify-end h-full">
           <div className={`font-mono text-[10px] uppercase font-bold tracking-widest text-cream bg-white/10 px-2 py-1 border border-white/10 w-fit mb-4`}>
             {match.stageLabel}
           </div>

           <div className="font-display text-4xl md:text-5xl uppercase text-white leading-[0.9]">
              {match.matchLabel.split(' — ')[0]}<br/>
              <span className="text-white/40">—</span><br/>
              {match.matchLabel.split(' — ')[1]}
           </div>

           <div className="font-sans text-sm md:text-base text-cream/70 font-light mt-4 max-w-sm">
             {match.relationLabel}
           </div>

           <div className="mt-8 font-mono text-[10px] uppercase font-bold tracking-widest border px-4 py-2 w-fit 
              border-blue-electric text-blue-electric group-hover:bg-blue-electric group-hover:text-white transition-colors"
           >
             {match.dossierStatus === 'upcoming' ? '[Voir le suivi prévu]' : '[Dossier match à venir]'}
           </div>
        </div>
     </button>
  );
}
