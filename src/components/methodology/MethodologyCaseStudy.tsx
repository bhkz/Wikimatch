import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";
import { isLiveMode } from "../../data";

export default function MethodologyCaseStudy() {
  // Étude de cas écrite intégralement autour de demo-divergence (France-Belgique).
  // En live, cette section n'a aucune valeur — masquée. À remplacer plus tard
  // par un sélecteur dynamique parmi les stories réellement publiées.
  if (isLiveMode) return null;
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-6 items-center text-center max-w-3xl mx-auto">
          <SectionLabel label="11 — ÉTUDE DE CAS COMPLÈTE" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            LA MÉTHODE
            <br />
            EN UNE HISTOIRE.
          </h2>
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] border border-[#e63946]/20 px-3 py-1">
            CAS FICTIF · DÉMONSTRATION FRONTEND
          </div>
        </div>

        <div className="bg-white border border-navy/10 shadow-sm flex flex-col">
          {/* Header */}
          <div className="p-8 md:p-12 border-b border-navy/10 bg-navy text-white text-center flex flex-col items-center gap-4">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric border border-blue-electric/30 px-3 py-1 bg-blue-electric/10">
              DIVERGENCE ENTRE ÉDITIONS
            </div>
            <h3 className="font-display text-3xl md:text-5xl uppercase tracking-wide">
              UN MÊME CARTON ROUGE.
              <br />
              TROIS TRAITEMENTS WIKIPÉDIA.
            </h3>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="col-span-1 lg:col-span-4 p-8 border-b lg:border-b-0 lg:border-r border-navy/10 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                  ÉTAPE 1 / CONTEXTE
                </div>
                <div className="font-sans text-sm text-navy/80">
                  Un carton rouge survient en fin de rencontre France —
                  Belgique.
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                  ÉTAPE 2 / TRACES OBSERVÉES
                </div>
                <ul className="flex flex-col gap-4">
                  <li className="flex gap-4">
                    <span className="font-mono text-xs font-bold w-6">EN</span>
                    <span className="font-sans text-sm text-navy/80">
                      Mention de l’altercation et de la sanction.
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-mono text-xs font-bold w-6">ES</span>
                    <span className="font-sans text-sm text-navy/80">
                      Mention de la sanction uniquement.
                    </span>
                  </li>
                  <li className="flex gap-4">
                    <span className="font-mono text-xs font-bold w-6">FR</span>
                    <span className="font-sans text-sm text-navy/80">
                      Aucune mention équivalente détectée dans la version
                      observée.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-8 grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 border-b md:border-b-0 md:border-r border-navy/10 flex flex-col gap-4 justify-center bg-[#38b000]/5">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                  ÉTAPE 3 / PUBLIABLE
                </div>
                <h4 className="font-sans text-lg font-bold text-navy">
                  Observation
                </h4>
                <p className="font-sans text-sm text-navy/80 leading-relaxed">
                  Les trois articles comparés ne retiennent pas les mêmes
                  éléments du même épisode fictif.
                </p>
              </div>
              <div className="p-8 flex flex-col gap-4 justify-center bg-[#e63946]/5">
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                  ÉTAPE 4 / EXCLU
                </div>
                <h4 className="font-sans text-lg font-bold text-navy">
                  Non concluant
                </h4>
                <p className="font-sans text-sm text-navy/80 leading-relaxed">
                  Cette différence ne dit rien, à elle seule, de l’opinion des
                  publics, des pays ou des contributeurs.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-8 border-t border-navy/10 bg-cream/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 max-w-md">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50">
                ÉTAPE 5 / PREUVES PUBLIQUES
              </div>
              <div className="font-sans text-xs text-navy/70">
                Les passages observés sont consultables dans l’Observatoire et
                rattachés à la story.
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <a
                href="/observatoire"
                className="bg-transparent border border-navy/20 text-navy px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-navy transition-colors text-center"
              >
                Voir la chaîne de preuve
              </a>
              <a
                href="/story/demo-divergence"
                className="bg-navy text-white px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors text-center"
              >
                Lire la story
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
