import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";
import type { MethodologyDefinition } from "../../types";

export default function CoreDefinitionsSection({
  methodologyDefinitions,
}: {
  methodologyDefinitions: MethodologyDefinition[];
}) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="01 — FONDATION" />
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wide text-navy leading-tight">
            QUATRE MOTS
            <br />
            POUR NE PAS
            <br />
            TOUT CONFONDRE.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            WikiMatch ne compare pas des pays et ne publie pas des volumes. Il
            travaille à partir de sujets, d’articles, de traces observées et
            d’histoires publiées.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {methodologyDefinitions.map((def, index) => (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white border border-navy/10 p-6 flex flex-col gap-4 shadow-sm"
            >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                0{index + 1} · {def.term}
              </div>
              <h3 className="font-sans text-lg font-bold text-navy leading-snug">
                {def.shortDefinition}
              </h3>
              <p className="font-sans text-sm text-navy/70 leading-relaxed">
                {def.fullDefinition}
              </p>
              {def.example && (
                <div className="mt-auto pt-4 border-t border-navy/5 font-mono text-[10px] text-navy/60 italic">
                  Exemple fictif :<br />
                  {def.example}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="w-full mt-12 mb-8 bg-white border border-navy/10 p-8 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cream/50 via-transparent to-transparent opacity-50"></div>

          <div className="z-10 flex flex-col items-center gap-6 max-w-2xl">
            <div className="font-mono text-sm font-bold tracking-widest text-navy bg-cream px-4 py-2 border border-navy/10">
              SUJET : Ren Ito
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-navy/20"></div>
              <div className="font-sans text-xs text-navy/50 italic my-1">
                existe dans plusieurs
              </div>
              <div className="w-px h-6 bg-navy/20"></div>
            </div>
            <div className="flex gap-4">
              <div className="font-mono text-xs tracking-widest bg-white border border-navy/10 px-3 py-1">
                JA
              </div>
              <div className="font-mono text-xs tracking-widest bg-white border border-navy/10 px-3 py-1">
                EN
              </div>
              <div className="font-mono text-xs tracking-widest bg-white border border-navy/10 px-3 py-1">
                FR
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-navy/20"></div>
              <div className="font-sans text-xs text-navy/50 italic my-1">
                reçoivent des
              </div>
              <div className="w-px h-6 bg-navy/20"></div>
            </div>
            <div className="flex gap-16 md:gap-24 w-full justify-center text-center">
              <div className="font-mono text-xs text-[#e63946] flex flex-col items-center max-w-[120px]">
                <span className="font-bold mb-1">ajout</span>
                <span className="text-[9px] text-navy/50">Trace observée</span>
              </div>
              <div className="font-mono text-xs text-navy/40 flex flex-col items-center max-w-[120px]">
                <span className="font-bold mb-1">
                  aucun ajout équivalent observé
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-navy/20"></div>
              <div className="font-sans text-xs text-navy/50 italic my-1">
                peuvent fonder une
              </div>
              <div className="w-px h-6 bg-navy/20"></div>
            </div>
            <div className="font-mono text-sm font-bold tracking-widest text-white bg-navy px-4 py-2">
              HISTOIRE : Sous le radar
            </div>

            <a
              href="/entity/demo-japan-goalkeeper"
              className="mt-8 font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-navy transition-colors flex items-center gap-2"
            >
              VOIR LE DOSSIER DE REN ITO →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
