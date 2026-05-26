import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import SectionLabel from "../SectionLabel";
import type { MethodologyPipelineStep } from "../../types";

export default function MethodologyPipeline({
  methodologyPipeline,
}: {
  methodologyPipeline: MethodologyPipelineStep[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      className="py-24 px-4 md:px-8 bg-white border-b border-navy/10 relative"
      ref={containerRef}
    >
      <div className="w-full max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        <div className="lg:w-1/3 flex flex-col gap-6 sticky top-[160px] self-start">
          <SectionLabel label="02 — PIPELINE" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            COMMENT UNE TRACE
            <br />
            PEUT DEVENIR
            <br />
            UNE HISTOIRE.
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
            La majorité des modifications ne doit jamais arriver dans le
            Magazine public. Une story n’existe qu’après plusieurs étapes de
            lecture, de comparaison et de validation.
          </p>
          <div className="flex gap-4 mt-4">
            <a
              href="/observatoire"
              className="bg-transparent border border-navy/20 text-navy px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-navy transition-colors"
            >
              Ouvrir l'Observatoire
            </a>
            <a
              href="/stories"
              className="bg-navy text-white px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors"
            >
              Voir les histoires
            </a>
          </div>
        </div>

        <div className="lg:w-2/3 relative pl-8 lg:pl-16">
          {/* Vertical scroll line for pipeline */}
          <div className="absolute left-0 lg:left-4 top-0 bottom-0 w-px bg-navy/10"></div>
          <motion.div
            className="absolute left-0 lg:left-4 top-0 w-[2px] bg-blue-electric origin-top"
            style={{ height: lineHeight }}
          />

          <div className="flex flex-col gap-12">
            {methodologyPipeline.map((step, index) => {
              const isPrivate = step.visibleIn === "desk_private";
              const isPublic = step.visibleIn === "magazine";
              const isObservatory = step.visibleIn === "observatory";

              let statusColor = "text-navy/50";
              if (isPublic) statusColor = "text-[#38b000]";
              if (isPrivate) statusColor = "text-[#e63946]";
              if (isObservatory) statusColor = "text-blue-electric";

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                  className="relative flex flex-col gap-3"
                >
                  <div
                    className={`absolute -left-[37px] lg:-left-[21px] top-6 w-3 h-3 rounded-full border-2 border-white ${isPublic ? "bg-[#38b000]" : isPrivate ? "bg-[#e63946]" : "bg-blue-electric"}`}
                  ></div>

                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="font-display text-5xl text-navy/20">
                      {step.number}
                    </span>
                    <span className="font-mono text-xs uppercase font-bold tracking-widest text-navy">
                      {step.label}
                    </span>
                  </div>

                  <div
                    className={`bg-white border ${isPublic ? "border-[#38b000]/30 shadow-sm" : isPrivate ? "border-[#e63946]/30 bg-cream/30" : "border-navy/10"} p-6 lg:p-8 flex flex-col gap-4`}
                  >
                    <h3 className="font-sans text-xl lg:text-2xl font-bold text-navy">
                      {step.title}
                    </h3>
                    <p className="font-sans text-base lg:text-lg text-navy/70 leading-relaxed font-light">
                      {step.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-navy/5">
                      <span
                        className={`font-mono text-[9px] uppercase font-bold tracking-widest ${statusColor}`}
                      >
                        {step.statusLabel}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
