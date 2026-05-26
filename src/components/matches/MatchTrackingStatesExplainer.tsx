import React from "react";
import { motion } from "motion/react";
import { Clock, Eye, CheckCircle2 } from "lucide-react";

export default function MatchTrackingStatesExplainer() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide text-navy">
            TROIS ÉTATS.<br/>UNE SEULE EXIGENCE :<br/>NE PAS INVENTER D'HISTOIRE.
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-[28px] left-[40px] right-[40px] h-[1px] bg-navy/10 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
            
            <StateCard 
              icon={<Clock className="w-6 h-6 text-navy/40" />}
              title="À SUIVRE"
              description="Avant le match, WikiMatch prépare les pages qui seront observées : match, équipes, joueurs et tournoi. Aucun récit n'est encore publié."
              delay={0.1}
            />
            
            <StateCard 
              icon={<Eye className="w-6 h-6 text-blue-electric" />}
              title="EN OBSERVATION"
              description="Pendant le match, des articles peuvent changer. Ces modifications sont analysées, mais ne deviennent pas automatiquement des histoires."
              delay={0.2}
            />

            <StateCard 
              icon={<CheckCircle2 className="w-6 h-6 text-navy" />}
              title="DOSSIER PUBLIÉ"
              description="Après vérification, les changements significatifs deviennent des stories et rejoignent le dossier du match."
              delay={0.3}
            />

          </div>
        </div>

      </div>
    </section>
  );
}

function StateCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.6 }}
      className="flex flex-col gap-6 bg-white p-8 border border-navy/10 hover:border-navy/30 transition-colors shadow-sm relative group"
    >
      <div className="w-14 h-14 rounded-full bg-cream border border-navy/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="font-mono text-sm uppercase font-bold tracking-widest text-navy mb-3">
          {title}
        </h3>
        <p className="font-sans text-sm text-navy/70 leading-relaxed font-light">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
