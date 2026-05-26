import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";
import type { MethodologyLimitation } from "../../types";

export default function MethodologyLimitationsSection({
  methodologyLimitations,
}: {
  methodologyLimitations: MethodologyLimitation[];
}) {
  return (
    <section className="py-24 px-4 md:px-8 bg-white border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="10 — HONNÊTETÉ" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            CE QUE WIKIMATCH
            <br />
            NE POURRA PAS
            <br />
            GARANTIR SEUL.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            Une méthode crédible n’explique pas seulement ce qu’elle sait faire.
            Elle expose aussi ce qu’elle ne sait pas prouver.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methodologyLimitations.map((lim, index) => (
            <motion.div
              key={lim.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border border-navy/10 p-8 flex flex-col gap-4 bg-cream/30"
            >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] mb-2">
                LIMITE
              </div>
              <h3 className="font-sans text-lg font-bold text-navy leading-snug">
                {lim.title}
              </h3>
              <p className="font-sans text-sm text-navy/70 leading-relaxed">
                {lim.description}
              </p>
              <div className="mt-auto pt-4 border-t border-navy/5">
                <span className="font-sans text-xs italic text-navy/60">
                  Conséquence : {lim.consequence}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
