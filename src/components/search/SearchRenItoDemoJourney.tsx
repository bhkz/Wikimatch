import { Link } from "react-router-dom";
import { isLiveMode } from "../../data";

export default function SearchRenItoDemoJourney() {
  if (isLiveMode) return null;
  return (
    <div className="bg-[#111] border border-white/10 p-6 md:p-8 flex flex-col gap-8 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 opacity-5 font-display text-[200px] text-white">
        JA
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="font-display text-3xl uppercase tracking-wide text-white">
          UN SUJET.
          <br />
          PLUSIEURS PORTES D’ENTRÉE.
        </h3>
        <p className="font-sans text-sm text-white/70 leading-relaxed font-light">
          Chercher <strong>Ren Ito</strong> ne renvoie pas seulement un nom. La
          recherche relie le dossier du joueur, la trace publique observée et le
          match associé.
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        {/* Line connector */}
        <div className="absolute left-[15px] top-6 bottom-6 w-px bg-white/10"></div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-[#111] border border-white/20 flex items-center justify-center font-mono text-[10px] text-white/50 shrink-0 mt-1">
            01
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-blue-electric">
              DOSSIER JOUEUR
            </div>
            <div className="font-display text-xl uppercase text-white">
              Ren Ito
              <br />
              <span className="text-white/50">Sous le radar</span>
            </div>
            <p className="font-sans text-xs text-white/60 mb-2">
              L’édition japonaise contient des ajouts substantiels observés.
            </p>
            <Link
              to="/entity/demo-japan-goalkeeper"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] hover:text-white transition-colors"
            >
              [Ouvrir le dossier]
            </Link>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-[#111] border border-white/20 flex items-center justify-center font-mono text-[10px] text-white/50 shrink-0 mt-1">
            02
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-blue-electric">
              PREUVE PUBLIQUE
            </div>
            <div className="font-sans text-sm text-white">
              <span className="font-mono text-[10px] bg-white/10 px-1 py-0.5 mr-1">
                JA
              </span>{" "}
              Article du joueur
            </div>
            <p className="font-sans text-xs text-white/60 mb-2">
              Performance fictive ajoutée à 22:21.
            </p>
            <Link
              to="/observatoire"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] hover:text-white transition-colors"
            >
              [Voir dans l'Observatoire]
            </Link>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className="w-[30px] h-[30px] rounded-full bg-[#111] border border-white/20 flex items-center justify-center font-mono text-[10px] text-white/50 shrink-0 mt-1">
            03
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[9px] uppercase font-bold tracking-widest text-white/40">
              CONTEXTE DU TOURNOI
            </div>
            <div className="font-display text-xl uppercase text-white/50">
              Japon — Sénégal
            </div>
            <p className="font-sans text-xs text-white/40">
              Match fictif associé au dossier.
              <br />
              Dossier complet à venir dans la démonstration.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-6 border-t border-white/10 mt-2">
        <p className="font-sans text-xs text-white/40 italic">
          La recherche relie uniquement des contenus publics. Les observations
          non validées restent hors de l’index.
        </p>
      </div>
    </div>
  );
}
