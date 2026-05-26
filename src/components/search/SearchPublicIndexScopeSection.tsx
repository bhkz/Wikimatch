import { Link } from "react-router-dom";

export default function SearchPublicIndexScopeSection() {
  return (
    <section className="py-24 px-4 md:px-8 border-t border-white/10 mt-16 bg-gradient-to-b from-transparent to-black/30">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide leading-tight max-w-2xl text-white">
            TOUT N’EST PAS
            <br />
            INDEXÉ PUBLIQUEMENT.
            <br />
            ET C’EST VOLONTAIRE.
          </h2>
          <p className="font-sans text-xl text-white/70 leading-relaxed font-light max-w-2xl">
            La recherche WikiMatch doit retrouver ce qui est public, lisible et
            vérifiable. Elle ne doit pas exposer les pistes de travail, les
            contenus non modérés ou les données permettant d’identifier des
            contributeurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000] border-b border-[#38b000]/30 pb-2">
              VISIBLE DANS LA RECHERCHE
            </div>
            <ul className="flex flex-col gap-3 font-sans text-white/80">
              <li className="flex gap-3 items-start">
                <span className="text-[#38b000] mt-1">✓</span> Histoires
                publiées.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#38b000] mt-1">✓</span> Dossiers de match
                publics.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#38b000] mt-1">✓</span> Sujets
                documentés.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#38b000] mt-1">✓</span> Traces publiques
                exposables.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#38b000] mt-1">✓</span> Règles de
                méthodologie.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946] border-b border-[#e63946]/30 pb-2">
              JAMAIS AFFICHÉ ICI
            </div>
            <ul className="flex flex-col gap-3 font-sans text-white/80 opacity-70">
              <li className="flex gap-3 items-start">
                <span className="text-[#e63946] mt-1">✕</span> Candidats
                automatiques.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#e63946] mt-1">✕</span> Traductions IA
                non vérifiées.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#e63946] mt-1">✕</span> Diffs bruts non
                modérés.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#e63946] mt-1">✕</span> Identité ou
                localisation de contributeurs.
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-[#e63946] mt-1">✕</span> Scores internes
                ou files de revue.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-8">
          <p className="font-display text-2xl md:text-3xl uppercase tracking-wide text-white max-w-3xl">
            CHERCHER PLUS FACILEMENT NE DOIT PAS EXPOSER DAVANTAGE QUE CE QUI
            PEUT ÊTRE PUBLIÉ RESPONSABLEMENT.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/methodology"
              className="bg-transparent border border-white/30 text-white px-8 py-4 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-white transition-colors w-fit"
            >
              LIRE LA MÉTHODOLOGIE
            </Link>
            <Link
              to="/observatoire"
              className="bg-transparent border border-white/30 text-[#e63946] px-8 py-4 font-mono text-[10px] uppercase font-bold tracking-widest hover:border-[#e63946] transition-colors w-fit"
            >
              INSPECTER L’OBSERVATOIRE
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
