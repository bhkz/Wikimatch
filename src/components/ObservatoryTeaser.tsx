import { motion } from "motion/react";
import { Link } from "react-router-dom";
import DemoBadge from "./DemoBadge";
import type { ObservatoryTeaserType } from "../types";
import { isDemoMode } from "../data";

export default function ObservatoryTeaser({
  observatoryData,
}: {
  observatoryData: ObservatoryTeaserType;
}) {
  return (
    <section id="observatoire" className="py-24 px-4 md:px-8 bg-navy text-cream relative overflow-hidden bg-grid-pattern">
      
      {/* Background glow abstract */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-electric/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-screen-2xl mx-auto relative z-10 flex flex-col gap-16 lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
          <h2 className="font-display text-5xl sm:text-7xl uppercase leading-none text-cream">
            DERRIÈRE CHAQUE HISTOIRE,<br />
            <span className="text-blue-electric">UN OBSERVATOIRE.</span>
          </h2>
          <p className="font-sans text-lg md:text-xl text-cream/70 leading-relaxed font-light max-w-xl">
            WikiMatch conserve les modifications sources, compare les éditions linguistiques et sépare les changements substantiels du bruit éditorial. Le flux brut reste consultable. Les histoires publiques, elles, sont vérifiées avant publication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link to="/observatoire" className="border border-cream text-cream px-8 py-4 font-medium uppercase font-display tracking-widest hover:bg-cream hover:text-navy transition-colors text-center flex items-center justify-center">
              Ouvrir l’Observatoire
            </Link>
            <Link to="/methodology" className="border border-cream/20 text-cream/70 px-8 py-4 font-medium uppercase font-display tracking-widest hover:bg-cream/10 transition-colors text-center flex items-center justify-center">
              Lire la méthodologie
            </Link>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 flex flex-col gap-8 mt-8 lg:mt-0 lg:pl-12">
          <div className="flex justify-between items-center border-b border-cream/10 pb-4">
            <DemoBadge />
            <span className="font-mono text-xs text-cream/40 uppercase">Aperçu du système</span>
          </div>
          
          <div className="flex flex-col gap-4 bg-[#0B1021] border border-cream/10 p-6 rounded shadow-inner text-left">
            <div className="font-mono text-[10px] text-cream/40 uppercase tracking-widest">État du système</div>
            <div className="font-display text-2xl text-cream uppercase">
              Collecte dédiée en attente d'activation
            </div>
            <p className="font-sans text-sm text-cream/70 leading-relaxed font-light">
              Le périmètre du match test est préparé. Aucune observation issue de cette répétition n'est publiée à ce stade.
            </p>
          </div>

          {/* Flux brut récent : maquette uniquement en mode démo.
              Les vraies traces apparaissent sur /observatoire. */}
          {isDemoMode && (
            <div className="mt-8 bg-[#0B1021] border border-cream/10 p-4 md:p-6 overflow-x-auto rounded">
              <div className="font-mono text-[10px] text-cream/40 uppercase tracking-widest mb-4">Flux brut récent (démonstration)</div>
              <div className="flex flex-col gap-3 font-mono text-xs text-cream/80 whitespace-nowrap min-w-[500px]">
                <div className="flex hover:text-white transition-colors">
                  <span className="w-16 opacity-50">22:14</span>
                  <span className="w-12 text-blue-electric">EN</span>
                  <span className="w-32 opacity-70">Article joueur</span>
                  <span className="flex-grow">Section carrière modifiée</span>
                  <span className="w-32 text-right opacity-50 hover:opacity-100 cursor-pointer underline">Voir la source</span>
                </div>
                <div className="flex hover:text-white transition-colors">
                  <span className="w-16 opacity-50">22:18</span>
                  <span className="w-12 text-blue-electric">FR</span>
                  <span className="w-32 opacity-70">Article match</span>
                  <span className="flex-grow">Résultat ajouté</span>
                  <span className="w-32 text-right opacity-50 hover:opacity-100 cursor-pointer underline">Voir la source</span>
                </div>
                <div className="flex hover:text-white transition-colors">
                  <span className="w-16 opacity-50">22:23</span>
                  <span className="w-12 text-blue-electric">ES</span>
                  <span className="w-32 opacity-70">Article joueur</span>
                  <span className="flex-grow">Mention reformulée</span>
                  <span className="w-32 text-right opacity-50 hover:opacity-100 cursor-pointer underline">Voir la source</span>
                </div>
              </div>
            </div>
          )}

          <div className="font-mono text-[10px] text-cream/40 uppercase text-center mt-2">
            Une modification brute n’est jamais automatiquement une histoire.
          </div>
        </div>
      </div>
    </section>
  );
}
