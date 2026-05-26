import { motion } from "motion/react";

export default function TrackedScopeSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16 relative z-10">
        
        <div className="flex flex-col gap-6 md:w-2/3">
          <h2 className="font-display text-5xl md:text-7xl uppercase text-white leading-[0.9]">
            UN MATCH N'EST PAS<br/>TOUT WIKIPÉDIA.
          </h2>
          <p className="font-sans text-xl text-cream/70 font-light leading-relaxed max-w-2xl">
            Pour chaque rencontre suivie, WikiMatch sélectionne un périmètre d'articles pertinents : la page du match, les équipes, certains joueurs, les entraîneurs lorsque nécessaire et la page du tournoi. Une modification hors de ce périmètre ne doit pas contaminer le dossier du match.
          </p>
          <div className="font-mono text-[10px] uppercase tracking-widest text-cream/40 mt-4 border-l-2 border-blue-electric pl-4 font-bold">
            Une langue Wikipédia n'est pas un pays. WikiMatch compare des éditions linguistiques, jamais des opinions nationales.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-8">
          
          <ScopeBlock 
             number="01" 
             title="MATCH" 
             desc="Résultat, déroulé et résumé de la rencontre." 
             delay={0.1} 
          />
          <ScopeBlock 
             number="02" 
             title="ÉQUIPES" 
             desc="Qualification, progression et contexte du tournoi." 
             delay={0.2} 
          />
          <ScopeBlock 
             number="03" 
             title="JOUEURS" 
             desc="Buteurs, expulsions, records ou incidents documentés." 
             delay={0.3} 
          />
          <ScopeBlock 
             number="04" 
             title="TOURNOI" 
             desc="Tableaux, groupes et phases finales." 
             delay={0.4} 
          />
          <ScopeBlock 
             number="05" 
             title="ÉDITIONS" 
             desc="Comparaison des articles linguistiques pertinents." 
             delay={0.5} 
             highlight
          />

        </div>

      </div>
    </section>
  );
}

function ScopeBlock({ number, title, desc, delay, highlight = false }: { number: string, title: string, desc: string, delay: number, highlight?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.6 }}
      className={`flex flex-col gap-4 p-6 md:p-8 border ${highlight ? 'border-blue-electric bg-blue-electric/5' : 'border-white/10 bg-white/5'}`}
    >
      <div className={`font-mono text-sm uppercase font-bold tracking-widest ${highlight ? 'text-blue-electric' : 'text-cream/40'}`}>
        {number}
      </div>
      <h3 className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-cream">
        {title}
      </h3>
      <p className="font-sans text-sm text-cream/60 font-light leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}
