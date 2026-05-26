import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";
import type { PublicationCriterion } from "../../types";

export default function PublicationCriteriaSection({
  publicationCriteria,
}: {
  publicationCriteria: PublicationCriterion[];
}) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="03 — CRITÈRES" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            TOUT CE QUI BOUGE
            <br />
            NE MÉRITE PAS
            <br />
            D’ÊTRE RACONTÉ.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            WikiMatch ne doit pas transformer le bruit en récit. Avant toute
            publication, cinq questions doivent recevoir une réponse solide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicationCriteria.map((crit, index) => (
            <motion.div
              key={crit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white border border-navy/10 p-8 flex flex-col gap-6 shadow-sm"
            >
              <div className="font-display text-4xl text-navy/20">
                0{index + 1}
              </div>
              <h3 className="font-sans text-lg font-bold text-navy min-h-[50px]">
                {crit.question}
              </h3>

              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#38b000]">
                    Acceptable :
                  </span>
                  <span className="font-sans text-sm text-navy/80">
                    {crit.acceptedAnswer}
                  </span>
                </div>
                <div className="w-full h-px bg-navy/5"></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#e63946]">
                    Refusé :
                  </span>
                  <span className="font-sans text-sm text-navy/80">
                    {crit.rejectedExample}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center bg-white p-8 md:p-12 border border-navy/10 mt-8">
          <div className="flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy bg-cream px-3 py-1 w-fit border border-navy/10">
              EXEMPLE VISUEL
            </div>
            <h4 className="font-sans text-2xl font-bold text-navy">
              Trace ou Histoire ?
            </h4>
            <p className="font-sans text-sm text-navy/70 leading-relaxed max-w-sm">
              Une trace n’est pas nécessairement une histoire. Observez la
              différence entre ces deux modifications fictives.
            </p>
            <a
              href="/observatoire"
              className="mt-4 font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-navy transition-colors w-fit"
            >
              Voir ces traces dans l'Observatoire →
            </a>
          </div>

          <div className="flex flex-col gap-6">
            {/* Mineur */}
            <div className="border border-navy/10 p-6 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-navy/20"></div>
              <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-navy/50">
                MINEUR · NON PUBLIÉ
              </div>
              <div className="font-serif text-lg text-navy line-through decoration-[#e63946] decoration-1 opacity-70">
                “… organisée en 2026”
              </div>
              <div className="font-serif text-lg text-navy">
                “… organisée en 2026.”
              </div>
              <div className="font-sans text-xs text-navy/60 italic mt-2">
                Correction de ponctuation. Visible dans l'Observatoire
                seulement.
              </div>
            </div>

            {/* Histoire */}
            <div className="border border-[#38b000]/30 bg-[#38b000]/5 p-6 flex flex-col gap-3 relative shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#38b000]"></div>
              <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#38b000]">
                SUBSTANTIEL · COMPARABLE
              </div>
              <div className="font-serif text-lg text-navy bg-yellow-100 px-1 w-fit">
                “Il reçoit un carton rouge à la suite d’un incident en fin de
                match.”
              </div>
              <div className="font-sans text-xs text-navy/80 italic mt-2">
                Ajout de contenu observable, comparé avec d'autres éditions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
