import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function MatchRecapsSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide text-navy">
            LES MATCHS<br/>QUI ONT LAISSÉ UNE TRACE
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Un recap réunit les histoires validées d'une rencontre : faits intégrés, comparaisons entre éditions et articles instables.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Recap */}
          <div className="lg:col-span-8 flex flex-col">
             <Link to="/match/demo-france-belgique" className="group flex flex-col h-full border border-navy/10 bg-white hover:border-navy/30 transition-colors shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-electric/5 to-transparent pointer-events-none" />
                <div className="absolute top-4 right-4">
                  <div className="font-mono text-[8px] uppercase tracking-widest font-bold bg-navy text-white px-2 py-1">SCÉNARIO FICTIF</div>
                </div>
                <div className="p-8 md:p-16 flex flex-col gap-8 flex-grow z-10">
                   <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
                     RÉCAP MATCH
                   </div>
                   <div className="font-display text-5xl md:text-7xl uppercase text-navy group-hover:text-blue-electric transition-colors leading-[0.9]">
                      FRANCE <span className="opacity-50">—</span> BELGIQUE
                   </div>
                   <div className="font-display text-3xl uppercase text-navy/80 leading-tight max-w-md">
                     Un résultat converge. Un incident diverge.
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-navy/10 font-mono text-[10px] uppercase tracking-widest font-bold text-navy/60">
                     <div className="flex flex-col gap-2">
                       <span className="text-3xl font-display text-navy">3</span>
                       <span>Histoires publiées</span>
                     </div>
                     <div className="flex flex-col gap-2">
                       <span className="text-3xl font-display text-navy">3</span>
                       <span>Éditions comparées</span>
                     </div>
                     <div className="flex flex-col gap-2">
                       <span className="text-3xl font-display text-navy border-b-[3px] border-red-signal w-fit pb-1">1</span>
                       <span>Article instable</span>
                     </div>
                   </div>
                </div>
                <div className="px-8 py-6 border-t border-navy/10 bg-navy text-white font-mono text-xs uppercase font-bold tracking-widest flex justify-between items-center group-hover:bg-blue-electric transition-colors">
                  <span>Ouvrir le dossier du match</span>
                  <span className="text-lg">→</span>
                </div>
             </Link>
          </div>

          {/* Secondary Recaps */}
          <div className="lg:col-span-4 flex flex-col gap-8">
             
             {/* Abstract poster 1 */}
             <div className="flex-grow flex flex-col border border-navy/10 bg-cream-dark opacity-90 relative overflow-hidden group cursor-not-allowed">
                <div className="p-8 flex flex-col gap-6 h-full justify-center text-center">
                   <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 font-bold">RÉCAP MATCH</div>
                   <div className="font-display text-4xl uppercase text-navy leading-none">
                     MAROC<br/><span className="text-navy/40">—</span><br/>CROATIE
                   </div>
                   <div className="font-sans text-sm text-navy/60 font-light mt-4">
                     Une qualification documentée dans quatre éditions.
                   </div>
                </div>
                <div className="absolute inset-0 bg-navy/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                   <span className="bg-cream text-navy px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-center">
                     Dossier à venir<br/>Démonstration UI
                   </span>
                </div>
             </div>

             {/* Abstract poster 2 */}
             <div className="flex-grow flex flex-col border border-navy/10 bg-cream-dark opacity-90 relative overflow-hidden group cursor-not-allowed">
                <div className="p-8 flex flex-col gap-6 h-full justify-center text-center">
                   <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 font-bold">RÉCAP MATCH</div>
                   <div className="font-display text-4xl uppercase text-navy leading-none">
                     JAPON<br/><span className="text-navy/40">—</span><br/>SÉNÉGAL
                   </div>
                   <div className="font-sans text-sm text-navy/60 font-light mt-4">
                     Un sujet sous le radar émerge dans l'édition japonaise.
                   </div>
                </div>
                <div className="absolute inset-0 bg-navy/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                   <span className="bg-cream text-navy px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-center">
                     Dossier à venir<br/>Démonstration UI
                   </span>
                </div>
             </div>

          </div>
        </div>

      </div>
    </section>
  );
}
