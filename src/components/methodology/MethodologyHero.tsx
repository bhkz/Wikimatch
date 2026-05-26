import { Link } from "react-router-dom";
import { motion } from "motion/react";
import AnimatedTextReveal from "../AnimatedTextReveal";
import DemoBadge from "../DemoBadge";

export default function MethodologyHero() {
  return (
    <section className="relative w-full min-h-[90svh] md:min-h-screen bg-cream flex flex-col justify-center px-4 md:px-8 py-24 overflow-hidden pt-32">
      {/* Abstract Background slightly visible */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-navy/20 via-cream to-cream"></div>
        {/* Subtle grid or lines */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-navy/10"></div>
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-navy/5"></div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12 z-10">
        <div className="flex flex-col gap-4">
          <DemoBadge label="PROTOCOLE CIBLE · DÉMONSTRATION FRONTEND · EXEMPLES FICTIFS" />
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] mb-4">
            MÉTHODOLOGIE · WIKIMATCH · WC26
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl xl:text-9xl uppercase tracking-wide text-navy leading-[0.85]">
            <AnimatedTextReveal text="UNE HISTOIRE" />
            <br />
            <AnimatedTextReveal text="NE COMMENCE PAS" delay={0.1} />
            <br />
            <AnimatedTextReveal text="PAR UN SCORE." delay={0.2} />
            <br />
            <AnimatedTextReveal text="ELLE COMMENCE" delay={0.3} />
            <br />
            <AnimatedTextReveal text="PAR UNE TRACE" delay={0.4} />
            <br />
            <AnimatedTextReveal text="QUE L’ON PEUT" delay={0.5} />
            <br />
            <AnimatedTextReveal text="VÉRIFIER." delay={0.6} />
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mt-8">
          <p className="font-sans text-xl md:text-2xl text-navy/80 leading-relaxed max-w-2xl font-light">
            WikiMatch veut documenter comment un match, un joueur ou une équipe
            s’inscrit dans Wikipédia.
            <br />
            <br />
            Pour être publiée, une histoire doit montrer ce qui a changé,
            comment les articles diffèrent et ce que l’observation ne permet pas
            de conclure.
          </p>

          <div className="flex flex-col gap-8 md:items-end md:text-right">
            <div className="font-sans text-lg md:text-2xl text-navy/80 leading-relaxed font-bold">
              OBSERVER.
              <br />
              COMPARER.
              <br />
              SOURCER.
              <br />
              PUBLIER SEULEMENT CE QUI TIENT.
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <a
                href="#methodology-pipeline"
                className="bg-navy text-white px-6 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors flex items-center justify-center gap-2"
              >
                COMPRENDRE LA MÉTHODE
              </a>
              <Link
                to="/observatoire"
                className="bg-transparent border border-navy/20 text-navy px-6 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:border-navy transition-colors flex items-center justify-center gap-2"
              >
                INSPECTER LE REJEU FICTIF
              </Link>
            </div>
          </div>
        </div>

        {/* Floating fragments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute top-1/4 right-8 md:right-24 bg-white/80 backdrop-blur-sm px-4 py-2 font-mono text-xs text-[#e63946] border border-[#e63946]/20 hidden lg:block"
        >
          <span className="line-through opacity-50 block mb-1">
            Texte supprimé
          </span>
          <span>Texte ajouté avec précision</span>
        </motion.div>

        <div className="mt-12 bg-white/50 backdrop-blur-sm border border-navy/10 p-6 md:p-8 max-w-3xl">
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] mb-2">
            IMPORTANT
          </div>
          <p className="font-sans text-sm text-navy/80 leading-relaxed">
            Cette interface présente la méthode cible de WikiMatch. Les exemples
            visibles sont fictifs et servent uniquement à valider l’expérience
            frontend avant connexion à des sources réelles.
          </p>
        </div>
      </div>
    </section>
  );
}
