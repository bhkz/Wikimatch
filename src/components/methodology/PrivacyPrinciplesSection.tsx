import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";
import { privacyPrinciples } from "../../mockMethodologyData";

export default function PrivacyPrinciplesSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="09 — VIE PRIVÉE" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            OBSERVER LES ARTICLES.
            <br />
            PAS SURVEILLER
            <br />
            LES PERSONNES.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            WikiMatch s’intéresse aux changements visibles sur des articles liés
            au tournoi. Son interface publique ne doit pas exposer l’identité,
            l’adresse IP, la localisation ou le comportement individuel de
            contributeurs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {privacyPrinciples.map((principle, index) => (
            <motion.div
              key={principle.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white border border-navy/10 p-8 flex flex-col gap-6 shadow-sm"
            >
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                VETO
              </div>
              <h3 className="font-sans text-xl font-bold text-navy leading-snug">
                {principle.title}
              </h3>
              <p className="font-sans text-sm text-navy/70 leading-relaxed">
                {principle.description}
              </p>
              <div className="mt-auto pt-4 border-t border-navy/5">
                <ul className="flex flex-col gap-2 font-sans text-xs text-navy/60">
                  {principle.prohibitedPublicOutput.map((item, i) => (
                    <li key={i} className="flex gap-2 items-center">
                      <span className="text-[#e63946]">✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-navy/10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center mt-4">
          <div className="md:w-1/3 flex justify-center">
            <div className="font-mono text-xs uppercase font-bold tracking-widest text-navy bg-cream border border-navy/10 px-4 py-2">
              CONTRIBUTEUR ANONYMISÉ
            </div>
          </div>
          <div className="md:w-2/3 flex flex-col gap-4">
            <h4 className="font-sans text-xl font-bold text-navy">
              Rendu public dans l’Observatoire
            </h4>
            <p className="font-sans text-base text-navy/70 leading-relaxed">
              Dans l’Observatoire public, le contenu de la trace importe.
              L’identité de son auteur n’est pas nécessaire à la compréhension
              de l’histoire.
            </p>
            <a
              href="/observatoire"
              className="mt-2 font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-navy transition-colors w-fit"
            >
              Voir l'Observatoire public →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
