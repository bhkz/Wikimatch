import { motion } from "motion/react";
import { comparisonRules } from "../../mockMethodologyData";

export default function LanguageIsNotCountrySection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-navy text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/20"></div>
        <div className="absolute right-1/4 top-0 bottom-0 w-px bg-white/20"></div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 z-10 relative">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-start">
          <div className="md:w-1/2 flex flex-col gap-6">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-white/50 border border-white/20 px-3 py-1 w-fit">
              05 — RÈGLE CARDINALE
            </div>
            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-tight">
              UNE LANGUE
              <br />
              N’EST PAS
              <br />
              UN PAYS.
            </h2>
            <p className="font-sans text-xl text-white/80 leading-relaxed font-light mt-4">
              Une édition linguistique de Wikipédia est un ensemble d’articles
              écrits dans une langue. Elle ne représente ni un État, ni une
              opinion publique, ni un groupe national homogène.
            </p>
          </div>

          <div className="md:w-1/2 flex flex-col gap-8 w-full">
            {comparisonRules.map((rule, idx) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col gap-4 border-b border-white/10 pb-8 last:border-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#e63946]">
                    LECTURE TROMPEUSE
                  </span>
                  <span className="font-serif text-lg text-white/70 line-through decoration-[#e63946]/50">
                    “{rule.incorrectAssumption}”
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#38b000]">
                    LECTURE CORRECTE
                  </span>
                  <span className="font-sans text-lg text-white">
                    “{rule.correctReading}”
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-white/20 mt-8">
          <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/20 bg-white/5 flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
              FORMULATION À PRIVILÉGIER
            </div>
            <p className="font-sans text-lg leading-relaxed text-white">
              “L’édition anglaise mentionne une altercation. L’édition espagnole
              mentionne la sanction. Aucune mention équivalente n’est détectée
              dans l’édition française observée.”
            </p>
          </div>
          <div className="p-8 md:p-12 bg-white/5 flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
              FORMULATION À ÉVITER
            </div>
            <p className="font-sans text-lg leading-relaxed text-white/70 line-through decoration-[#e63946]/50">
              “Les Anglais accusent le joueur, l’Espagne minimise l’incident et
              la France l’ignore.”
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <a
            href="/story/demo-divergence"
            className="bg-white text-navy px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-cream transition-colors flex items-center justify-center gap-2"
          >
            VOIR UNE COMPARAISON EN CONTEXTE →
          </a>
        </div>
      </div>
    </section>
  );
}
