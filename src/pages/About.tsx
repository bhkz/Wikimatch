import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AnimatedTextReveal from "../components/AnimatedTextReveal";

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cream selection:bg-navy selection:text-white flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-32 pb-24 px-4 md:px-8">
        <div className="w-full max-w-screen-md mx-auto flex flex-col gap-12">
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-tight">
            <AnimatedTextReveal text="RÉVISION 90." />
            <AnimatedTextReveal text="UN PROJET" delay={0.1} />
            <AnimatedTextReveal text="D'OBSERVATION." delay={0.2} />
          </h1>

          <div className="flex flex-col gap-6 font-sans text-xl text-navy/80 leading-relaxed font-light">
            <p>
              <strong>WikiMatch</strong> (projet interne de nom de code{" "}
              <em>Révision 90</em>) est un observatoire indépendant créé pour
              scruter, documenter et analyser la manière dont Wikipédia raconte
              la Coupe du Monde de la FIFA 2026 en temps réel.
            </p>
            <p>
              L'encyclopédie mondiale n'est pas seulement un miroir des
              événements, c'est un champ de bataille narratif. Ce que l'on lit
              sur un joueur, un match ou une équipe ne tombe pas du ciel : c'est
              le résultat de centaines de petites modifications, d'annulations,
              de débats et parfois de guerres d'édition.
            </p>
            <p>
              Notre but est de rendre ce processus visible. En isolant les
              signaux pertinents du bruit de fond éditorial, WikiMatch tente de
              raconter "comment l'histoire s'écrit" à travers le prisme de la
              plus grande compétition sportive du monde.
            </p>
          </div>

          <div className="border-t border-navy/10 pt-12 mt-12">
            <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mb-6">
              L'ÉQUIPE (SIMULÉE)
            </div>
            <p className="font-sans text-lg text-navy/70 leading-relaxed mb-6 font-light">
              Ce projet est un prototype d'architecture, conçu dans le cadre
              d'un test de faisabilité technique et journalistique. Les données
              affichées actuellement dans les "Histoires" ou "L'Observatoire"
              sont des simulations afin d'illustrer la mécanique de notre
              méthodologie.
            </p>
            <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
              Il n'y a pour l'instant ni affiliation avec la Wikimedia
              Foundation, ni connexion en direct aux serveurs ou à EventStreams.
              La V2 prévue pour mai 2026 activera les flux réels.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
