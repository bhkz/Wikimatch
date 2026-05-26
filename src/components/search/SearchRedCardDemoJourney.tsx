import { Link } from "react-router-dom";

export default function SearchRedCardDemoJourney() {
  return (
    <div className="bg-navy border border-blue-electric/30 p-6 md:p-8 flex flex-col gap-8 relative overflow-hidden mt-8 lg:mt-0 shadow-[0_0_30px_rgba(0,102,255,0.05)]">
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="font-display text-3xl uppercase tracking-wide text-white">
          UN ÉPISODE.
          <br />
          UNE STORY.
          <br />
          DES SOURCES.
          <br />
          UNE LIMITE.
        </h3>
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        {/* Line connector */}
        <div className="absolute left-[15px] top-6 bottom-6 w-px bg-blue-electric/20"></div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-navy border border-blue-electric/50 flex items-center justify-center font-mono text-[10px] text-blue-electric shrink-0 mt-1">
            1
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-blue-electric">
              HISTOIRE PUBLIÉE
            </div>
            <div className="font-sans text-sm text-white">
              Un même carton rouge. Trois traitements Wikipédia.
            </div>
            <Link
              to="/story/demo-divergence"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] hover:text-white transition-colors mt-1"
            >
              [Lire la story]
            </Link>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-navy border border-white/20 flex items-center justify-center font-mono text-[10px] text-white/50 shrink-0 mt-1">
            2
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-white/50">
              DOSSIER MATCH
            </div>
            <div className="font-sans text-sm text-white">
              France — Belgique
            </div>
            <Link
              to="/match/demo-france-belgique"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-white transition-colors mt-1"
            >
              [Ouvrir le dossier]
            </Link>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-navy border border-white/20 flex items-center justify-center font-mono text-[10px] text-white/50 shrink-0 mt-1">
            3
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-white/50">
              TRACE PUBLIQUE
            </div>
            <div className="font-sans text-sm text-white">
              <span className="font-mono text-[10px] bg-white/10 px-1 py-0.5 mr-1">
                EN
              </span>{" "}
              Mention de l’altercation ajoutée.
            </div>
            <Link
              to="/observatoire"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric hover:text-white transition-colors mt-1"
            >
              [Inspecter la trace]
            </Link>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-navy border border-[#e63946]/50 flex items-center justify-center font-mono text-[10px] text-[#e63946] shrink-0 mt-1">
            4
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#e63946]">
              LIMITE DE LECTURE
            </div>
            <div className="font-sans text-sm text-white/70">
              Une différence entre articles ne représente pas l’opinion de pays.
            </div>
            <Link
              to="/methodology"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-white hover:text-blue-electric transition-colors mt-1"
            >
              [Comprendre la méthode]
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
