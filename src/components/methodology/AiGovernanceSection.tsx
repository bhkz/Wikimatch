import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";
import { aiRules } from "../../mockMethodologyData";

export default function AiGovernanceSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-white relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 z-10 relative">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="08 — INTELLIGENCE ARTIFICIELLE" />
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wide leading-tight">
            L’IA PEUT AIDER.
            <br />
            ELLE NE DÉCIDE
            <br />
            PAS CE QUI EST VRAI.
          </h2>
          <p className="font-sans text-xl text-white/70 leading-relaxed font-light">
            Dans la méthode cible de WikiMatch, l’IA peut servir d’assistant de
            lecture pour traiter des volumes de textes multilingues. Elle ne
            doit jamais devenir la rédactrice autonome du Magazine public.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-white/5 border border-[#38b000]/30 p-8 flex flex-col gap-6">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
              AUTORISÉ · AVEC VÉRIFICATION
            </div>
            <ul className="flex flex-col gap-6 font-sans text-lg text-white">
              {aiRules
                .filter((r) => r.allowed)
                .map((rule, idx) => (
                  <motion.li
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex gap-3 items-start">
                      <span className="text-[#38b000] mt-1">✓</span>
                      <span>{rule.task}</span>
                    </div>
                    <div className="pl-6 font-sans text-sm text-white/50 italic">
                      {rule.explanation}
                    </div>
                  </motion.li>
                ))}
            </ul>
          </div>

          <div className="bg-white/5 border border-[#e63946]/30 p-8 flex flex-col gap-6">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
              INTERDIT · SANS VALIDATION
            </div>
            <ul className="flex flex-col gap-6 font-sans text-lg text-white/80">
              {aiRules
                .filter((r) => !r.allowed)
                .map((rule, idx) => (
                  <motion.li
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex gap-3 items-start">
                      <span className="text-[#e63946] mt-1">✕</span>
                      <span className="line-through decoration-[#e63946]/50">
                        {rule.task}
                      </span>
                    </div>
                    <div className="pl-6 font-sans text-sm text-white/50 italic">
                      {rule.explanation}
                    </div>
                  </motion.li>
                ))}
            </ul>
          </div>
        </div>

        <div className="w-full mt-8 bg-white/5 border border-white/10 p-8 flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center gap-6 max-w-2xl">
            <div className="font-mono text-sm font-bold tracking-widest text-white/50 bg-black/30 px-4 py-2">
              TRACE
            </div>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="font-mono text-sm font-bold tracking-widest text-blue-electric bg-blue-electric/10 border border-blue-electric/30 px-4 py-2 flex flex-col items-center gap-2">
              ASSISTANCE IA POSSIBLE
              <span className="text-[9px] text-white/60">
                traduction / rapprochement / suggestion
              </span>
            </div>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="font-mono text-sm font-bold tracking-widest text-white bg-white/10 border border-white/20 px-4 py-2 flex flex-col items-center gap-2">
              REVUE ÉDITORIALE
              <span className="text-[9px] text-white/60">
                preuve / formulation / limite / source
              </span>
            </div>
            <div className="w-px h-6 bg-[#38b000]/50"></div>
            <div className="font-mono text-sm font-bold tracking-widest text-white bg-[#38b000] px-4 py-2">
              HISTOIRE PUBLIQUE
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 mt-4">
          <h3 className="font-display text-3xl md:text-5xl uppercase tracking-wide text-center">
            L’IA PEUT AIDER À TROUVER.
            <br />
            LA PUBLICATION DOIT RESTER RESPONSABLE.
          </h3>
          <a
            href="/observatoire"
            className="bg-white text-navy px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-cream transition-colors flex items-center justify-center gap-2"
          >
            VOIR LES PREUVES PUBLIQUES →
          </a>
        </div>
      </div>
    </section>
  );
}
