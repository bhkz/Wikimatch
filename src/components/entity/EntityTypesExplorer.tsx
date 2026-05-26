import { motion } from "motion/react";

export default function EntityTypesExplorer() {
  
  const placeholders = [
    { title: "ÉQUIPE", desc: "Comment une qualification entre dans plusieurs éditions." },
    { title: "MATCH", desc: "Comment un incident est raconté différemment." },
    { title: "ENTRAÎNEUR", desc: "Comment une décision apparaît dans les biographies." },
    { title: "COMPÉTITION", desc: "Comment la mémoire du tournoi s'enrichit au fil des rencontres." }
  ];

  const handleToast = () => {
    alert("Ce type de dossier sera développé dans une prochaine étape.");
    console.log("Ce type de dossier sera développé dans une prochaine étape.");
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-6xl uppercase tracking-wide text-navy">
            UN TOURNOI,<br/>PLUSIEURS TYPES<br/><span className="text-navy/40">DE RÉCITS.</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            WikiMatch ne suivra pas seulement des joueurs. Un même principe peut documenter les équipes, les matchs, les entraîneurs ou la compétition elle-même.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           {placeholders.map((item, i) => (
              <button 
                key={i} 
                onClick={handleToast}
                className="group flex flex-col items-center justify-center text-center p-8 border border-navy/10 bg-white hover:border-navy/30 hover:bg-navy/5 transition-colors aspect-square"
              >
                 <div className="font-mono text-sm uppercase font-bold tracking-widest text-navy mb-4 group-hover:text-blue-electric transition-colors">
                   {item.title}
                 </div>
                 <div className="font-sans text-sm text-navy/60 font-light leading-relaxed max-w-[200px]">
                   {item.desc}
                 </div>
              </button>
           ))}
        </div>

      </div>
    </section>
  );
}
