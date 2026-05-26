import { motion } from "motion/react";
import { Link } from "react-router-dom";
import NoStoryMatchCard from "./cards/NoStoryMatchCard";
import { featuredMatch } from "../../mockMatchesData";

export default function NoStoryExplanationSection() {

  // Create a fake match for the example
  const exampleMatch = {
    ...featuredMatch,
    id: "demo-canada-ghana-example",
    dateLabel: "29 JUIN 2026",
    timeLabel: "TERMINÉ",
    homeTeam: { name: "CANADA", shortName: "CAN", color: "red" },
    awayTeam: { name: "GHANA", shortName: "GHA", color: "yellow" },
    score: [0, 0] as [number, number],
    status: "completed_without_story" as const,
    statusLabel: "AUCUNE HISTOIRE PUBLIÉE · DÉMO",
  };

  return (
    <section className="py-32 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
        
        <div className="w-full lg:w-1/2 flex flex-col gap-6 text-center lg:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase text-navy leading-[0.85]">
            <span className="block mb-2">PARFOIS,</span>
            <span className="block mb-2">IL N'Y A RIEN</span>
            <span className="block text-navy/40">À RACONTER.</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 font-light leading-relaxed max-w-xl mx-auto lg:mx-0 mt-6">
            Un match peut générer des mises à jour normales : score ajouté, liens corrigés, page structurée. Si aucune différence significative, aucune instabilité et aucun changement substantiel digne d'intérêt n'est identifié, WikiMatch ne publie pas d'histoire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
             <Link to="/stories" className="bg-navy text-white px-8 py-4 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors">
               Voir les histoires publiées
             </Link>
             <button className="border border-navy/10 px-8 py-4 font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-navy/5 hover:bg-navy/10 transition-colors cursor-not-allowed">
               Ouvrir l'Observatoire
             </button>
          </div>
        </div>

        <div className="w-full lg:w-1/2 max-w-md mx-auto lg:mx-0">
          <div className="relative">
            <div className="absolute -inset-4 border border-navy/10 bg-navy/5 -rotate-3 rounded-sm pointer-events-none" />
            <div className="relative">
              <NoStoryMatchCard match={exampleMatch} index={0} />
            </div>
            
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.5 }}
               className="absolute top-1/2 -right-4 sm:-right-12 translate-x-full -translate-y-1/2 hidden xl:flex flex-col gap-2 max-w-[200px]"
            >
               <div className="w-8 h-[1px] bg-navy/20 absolute right-full top-4 mr-2" />
               <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">Pourquoi ?</div>
               <div className="font-sans text-sm text-navy/80 font-light leading-relaxed">
                 Les modifications observées ne suffisent pas à construire un récit public intéressant et vérifiable.
               </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
