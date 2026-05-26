import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AnimatedTextReveal from "../components/AnimatedTextReveal";
import { Link } from "react-router-dom";

export default function SourceCode() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleExternalLink = () => {
    alert(
      "Le dépôt GitHub principal de WikiMatch sera rendu public dès la mise en ligne de la V1 et l'audit de sécurité des API de connexion.",
    );
  };

  return (
    <div className="min-h-screen bg-cream text-navy selection:bg-blue-electric selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-32 pb-24 px-4 md:px-8">
        <div className="w-full max-w-screen-md mx-auto flex flex-col gap-12">
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-tight">
            <AnimatedTextReveal text="CODE SOURCE." />
          </h1>

          <div className="flex flex-col gap-6 font-sans text-xl text-navy/80 leading-relaxed font-light">
            <p className="text-2xl text-navy font-normal">
              WikiMatch est un outil d'intérêt général. Son infrastructure sera
              open-source afin que n'importe quel chercheur, journaliste ou
              curieux puisse auditer la façon dont nous calculons nos
              indicateurs.
            </p>
            <p>
              L'opacité est l'ennemi de l'analyse journalistique des données
              algorithmiques. Si nous affirmons qu'un match a subi une "guerre
              d'édition", vous devez pouvoir vérifier quelles règles
              mathématiques et textuelles ont déclenché cette alerte.
            </p>
            <p>
              Notre architecture repose sur trois piliers qui seront entièrement
              disponibles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white border border-navy/10 p-8 shadow-sm flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]">
                FRONT-END & VISUALISATION
              </div>
              <h3 className="font-sans font-bold text-xl text-navy">
                Interface Utilisateur
              </h3>
              <p className="font-sans text-sm text-navy/70 leading-relaxed font-light">
                L'intégralité de l'interface qui vous permet de lire et de
                filtrer les données est construite en React et Tailwind CSS.
                Rien n'est masqué dans la restitution visuelle.
              </p>
            </div>

            <div className="bg-white border border-navy/10 p-8 shadow-sm flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">
                BACK-END & PIPELINE
              </div>
              <h3 className="font-sans font-bold text-xl text-navy">
                Le Scraper (V2)
              </h3>
              <p className="font-sans text-sm text-navy/70 leading-relaxed font-light">
                Les scripts qui écoutent le flux Wikimedia EventStreams en temps
                réel et qui nettoient le bruit (suppression du redressement
                syntaxique mineur) pour ne garder que la substance.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 border-t border-navy/10 pt-12 mt-4">
            <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
              Nous inviterons la communauté open-source à forker notre outil
              pour l'adapter à d'autres événements globaux (tels que des
              élections majeures, ou des compétitions comme les Jeux
              Olympiques).
            </p>
            <button
              onClick={handleExternalLink}
              className="bg-navy text-white px-8 py-4 font-mono text-[11px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors w-fit"
            >
              ACCÉDER AU RÉFÉRENTIEL GITHUB →
            </button>
            <Link
              to="/methodology"
              className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/50 hover:text-navy transition-colors underline decoration-navy/20 w-fit"
            >
              GOUVERNANCE DES DONNÉES ET IA
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
