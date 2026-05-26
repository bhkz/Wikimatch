import { motion } from "motion/react";
import SectionLabel from "../SectionLabel";

export default function GeographyMethodSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-8 max-w-3xl">
          <SectionLabel label="07 — CARTOGRAPHIE" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            UNE CARTE
            <br />
            QUI SITUE
            <br />
            CE DONT ON PARLE.
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light">
            WikiMatch ne cherche pas à savoir où se trouvent les personnes qui
            modifient Wikipédia. Lorsqu’une histoire possède un ancrage
            footballistique clair, la carte peut situer son sujet : une
            sélection, un joueur associé à une équipe ou un lieu de match
            pertinent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-white border border-[#38b000]/30 p-8 flex flex-col gap-6 shadow-sm">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
              POSITION DU SUJET
            </div>
            <ul className="flex flex-col gap-4 font-sans text-lg text-navy">
              <li className="flex gap-3">
                <span className="text-[#38b000]">✓</span>
                Ren Ito associé à la sélection japonaise fictive.
              </li>
              <li className="flex gap-3">
                <span className="text-[#38b000]">✓</span>
                Une histoire portant sur la sélection marocaine.
              </li>
              <li className="flex gap-3">
                <span className="text-[#38b000]">✓</span>
                Un record lié à un attaquant portugais fictif.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-[#e63946]/30 p-8 flex flex-col gap-6 shadow-sm">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
              JAMAIS AFFICHÉ
            </div>
            <ul className="flex flex-col gap-4 font-sans text-lg text-navy/70">
              <li className="flex gap-3">
                <span className="text-[#e63946]">✕</span>
                Adresse IP d'un éditeur.
              </li>
              <li className="flex gap-3">
                <span className="text-[#e63946]">✕</span>
                Localisation d'un contributeur.
              </li>
              <li className="flex gap-3">
                <span className="text-[#e63946]">✕</span>
                Origine supposée d'une modification.
              </li>
              <li className="flex gap-3">
                <span className="text-[#e63946]">✕</span>
                Une langue positionnée comme un pays.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-8 bg-navy text-white p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30"></div>

          <h3 className="font-display text-3xl md:text-5xl uppercase tracking-wide leading-snug z-10">
            LES SUJETS SE SITUENT.
            <br />
            LES ÉDITIONS SE COMPARENT.
            <br />
            LES CONTRIBUTEURS NE SONT PAS CARTOGRAPHIÉS.
          </h3>

          <div className="w-full max-w-sm h-32 relative mt-4 opacity-70 z-10">
            {/* Mini stylized map preview */}
            <div className="absolute inset-0 border border-white/20 bg-white/5 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-electric shadow-[0_0_10px_rgba(58,134,255,0.8)] relative">
                <div className="absolute -top-8 -left-8 bg-white text-navy font-mono text-[8px] uppercase font-bold px-2 py-1">
                  JAPON · REN ITO
                </div>
              </div>
              <div className="absolute top-4 left-4 font-mono text-[8px] text-white/30 tracking-widest">
                Sujet documenté
              </div>
            </div>
          </div>

          <a
            href="/explorer"
            className="mt-4 z-10 bg-blue-electric text-white px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-white hover:text-navy transition-colors flex items-center justify-center gap-2"
          >
            OUVRIR EXPLORER →
          </a>
        </div>
      </div>
    </section>
  );
}
