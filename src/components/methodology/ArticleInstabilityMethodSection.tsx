import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";

export default function ArticleInstabilityMethodSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16 z-10 relative">
        <div className="flex flex-col gap-6 max-w-3xl">
          <SectionLabel label="06 — GUERRE D'ÉDITION" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            LA TENSION
            <br />
            NE SE MESURE PAS
            <br />
            ENTRE LES LANGUES.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            Deux éditions peuvent écrire la même chose sans aucune tension. Une
            instabilité devient observable lorsqu’un même article modifie
            plusieurs fois un passage comparable.
          </p>
        </div>

        <div className="bg-white border border-navy/10 p-6 md:p-12 shadow-sm flex flex-col lg:flex-row gap-12 lg:gap-24">
          <div className="lg:w-1/2 flex flex-col gap-8 relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-navy/10"></div>

            {/* Timeline sequence */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative pl-12 flex flex-col gap-2"
            >
              <div className="absolute left-[13px] top-2 w-2 h-2 rounded-full bg-blue-electric"></div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                22:48 · EN
              </div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                AJOUTÉ
              </div>
              <p className="font-serif text-lg text-navy bg-yellow-100/50 p-2 border-l-2 border-[#38b000]">
                “Il est expulsé après une altercation avec un adversaire.”
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative pl-12 flex flex-col gap-2"
            >
              <div className="absolute left-[13px] top-2 w-2 h-2 rounded-full bg-blue-electric"></div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                22:51 · EN
              </div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                RETIRÉ
              </div>
              <p className="font-serif text-lg text-navy/50 italic line-through decoration-[#e63946]">
                Le passage disparaît.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative pl-12 flex flex-col gap-2"
            >
              <div className="absolute left-[13px] top-2 w-2 h-2 rounded-full bg-blue-electric"></div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                22:56 · EN
              </div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                RÉINTRODUIT
              </div>
              <p className="font-serif text-lg text-navy bg-yellow-100/50 p-2 border-l-2 border-[#38b000]">
                La mention revient.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="relative pl-12 flex flex-col gap-2"
            >
              <div className="absolute left-[13px] top-2 w-2 h-2 rounded-full bg-blue-electric"></div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                23:03 · EN
              </div>
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
                SOURCÉ
              </div>
              <p className="font-serif text-lg text-navy bg-blue-50 p-2 border-l-2 border-blue-electric">
                La formulation est réécrite avec une source.
              </p>
            </motion.div>
          </div>

          <div className="lg:w-1/2 flex flex-col gap-8 justify-center">
            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                CE QUI EST OBSERVABLE
              </h4>
              <p className="font-sans text-xl text-navy">
                Un passage précis évolue plusieurs fois sur le même article
                fictif.
              </p>
            </div>

            <div className="w-full h-px bg-navy/10"></div>

            <div className="flex flex-col gap-4">
              <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                CE QUI NE L'EST PAS AUTOMATIQUEMENT
              </h4>
              <p className="font-sans text-lg text-navy/70">
                La motivation des contributeurs, l’existence d’un conflit
                intentionnel ou la raison exacte des changements.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border border-navy/10 p-8 flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
              PAS UNE TENSION EN SOI
            </div>
            <ul className="font-serif text-lg text-navy/80 space-y-2">
              <li>
                <span className="font-bold text-navy">JA</span> ajoute une
                performance.
              </li>
              <li>
                <span className="font-bold text-navy">EN</span> ajoute la même
                performance.
              </li>
              <li>
                <span className="font-bold text-navy">FR</span> l'ajoute
                ensuite.
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-navy/5 font-sans text-sm text-navy/60 italic">
              Plusieurs éditions peuvent simplement converger.
            </div>
          </div>

          <div className="bg-white border text-blue-electric border-blue-electric/30 p-8 flex flex-col gap-4 shadow-[#e63946]/5 shadow-sm">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
              INSTABILITÉ OBSERVABLE
            </div>
            <ul className="font-serif text-lg text-navy space-y-2">
              <li>
                <span className="font-bold text-navy">EN</span> ajoute un
                passage.
              </li>
              <li>
                <span className="font-bold text-navy line-through decoration-[#e63946]">
                  EN
                </span>{" "}
                le retire.
              </li>
              <li>
                <span className="font-bold text-navy">EN</span> le restaure.
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-blue-electric/10 font-sans text-sm text-navy/80 italic">
              Le même article hésite sur le même contenu.
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <a
            href="/match/demo-france-belgique"
            className="bg-navy text-white px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors flex items-center justify-center gap-2"
          >
            VOIR L'EXEMPLE DANS LE DOSSIER MATCH →
          </a>
        </div>
      </div>
    </section>
  );
}
