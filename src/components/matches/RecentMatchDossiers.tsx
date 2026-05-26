import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function RecentMatchDossiers() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide text-navy">
            LES DOSSIERS<br/>QUI MÉRITENT D'ÊTRE OUVERTS
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Lorsqu'un match produit plusieurs histoires validées, WikiMatch les rassemble dans un dossier complet : timeline, éditions comparées, articles instables et sources.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Poster */}
          <div className="lg:col-span-6 flex flex-col h-[500px] lg:h-[600px]">
             <Link to="/match/demo-france-belgique" className="group flex flex-col h-full border border-navy/10 bg-navy hover:border-blue-electric transition-colors shadow-sm relative overflow-hidden">
                <motion.img 
                  src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200&auto=format&fit=crop" 
                  alt="Dossier" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity grayscale group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
                <div className="absolute top-4 right-4">
                  <div className="font-mono text-[8px] uppercase tracking-widest font-bold bg-white text-navy px-2 py-1">SCÉNARIO FICTIF</div>
                </div>
                <div className="p-8 md:p-12 flex flex-col gap-4 flex-grow z-10 justify-end">
                   <div className="font-display text-5xl md:text-6xl uppercase text-white leading-[0.9]">
                      FRANCE<br/><span className="text-white/50">—</span><br/>BELGIQUE
                   </div>
                   <div className="font-sans text-xl text-cream/90 font-light mt-4">
                     Un résultat converge. Un incident diverge.
                   </div>
                   <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mt-2">
                     3 histoires publiées
                   </div>
                   <div className="mt-8 bg-blue-electric text-white px-6 py-3 font-mono text-xs uppercase font-bold tracking-widest w-fit group-hover:bg-white group-hover:text-navy transition-colors">
                     [Ouvrir le dossier]
                   </div>
                </div>
             </Link>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <SecondaryPoster 
               teams="PORTUGAL — URUGUAY" 
               desc="Un record apparaît d'abord dans l'édition portugaise." 
               count="1 histoire publiée"
               imgSrc="https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=800&auto=format&fit=crop"
            />
            <SecondaryPoster 
               teams="MAROC — CROATIE" 
               desc="Une qualification documentée dans plusieurs éditions." 
               count="Dossier à venir"
               imgSrc="https://images.unsplash.com/photo-1518605368461-1e96a4abcb32?q=80&w=800&auto=format&fit=crop"
               disabled
            />
          </div>

        </div>

      </div>
    </section>
  );
}

function SecondaryPoster({ teams, desc, count, imgSrc, disabled }: { teams: string, desc: string, count: string, imgSrc: string, disabled?: boolean }) {
  return (
    <div className={`group flex flex-col h-[400px] lg:h-[600px] border border-navy/10 relative overflow-hidden ${disabled ? 'cursor-not-allowed bg-navy' : 'bg-navy hover:border-blue-electric cursor-pointer'}`}>
       <motion.img 
          src={imgSrc} 
          alt="Dossier" 
          className={`absolute inset-0 w-full h-full object-cover mix-blend-luminosity grayscale transition-all duration-700 ${disabled ? 'opacity-20' : 'opacity-40 group-hover:scale-105 group-hover:grayscale-0'}`} 
       />
       <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/20" />
       <div className="p-8 flex flex-col gap-4 flex-grow z-10 justify-end">
          <div className="font-display text-3xl md:text-4xl uppercase text-white leading-tight">
             {teams.split(' — ')[0]}<br/>
             <span className="text-white/50">—</span><br/>
             {teams.split(' — ')[1]}
          </div>
          <div className="font-sans text-sm text-cream/70 font-light mt-2">
            {desc}
          </div>
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mt-2">
            {count}
          </div>
          <div className={`mt-6 px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest w-fit border ${disabled ? 'border-white/10 text-white/40' : 'border-blue-electric text-blue-electric group-hover:bg-blue-electric group-hover:text-white transition-colors'}`}>
            {disabled ? 'Démonstration UI' : '[Dossier à venir]'}
          </div>
       </div>
    </div>
  );
}
