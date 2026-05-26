import { useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AnimatedTextReveal from "../components/AnimatedTextReveal";
import { Link } from "react-router-dom";

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-navy text-white selection:bg-white selection:text-navy flex flex-col">
      <SiteHeader />

      <main className="flex-grow pt-32 pb-24 px-4 md:px-8">
        <div className="w-full max-w-screen-md mx-auto flex flex-col gap-12">
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-wide leading-tight">
            <AnimatedTextReveal text="POLITIQUE DE" />
            <AnimatedTextReveal text="CONFIDENTIALITÉ." delay={0.1} />
          </h1>

          <div className="flex flex-col gap-8 font-sans text-xl text-white/80 leading-relaxed font-light">
            <section className="flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                01 — AUCUN COOKIE D'APPROCHE
              </div>
              <p>
                WikiMatch ne dépose{" "}
                <strong>aucun cookie publicitaire ni traceur commercial</strong>{" "}
                sur votre navigateur. Nous ne cherchons pas à vous identifier,
                ni à revendre des informations vous concernant.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                02 — STATISTIQUES LÉGÈRES
              </div>
              <p>
                Nous utilisons une solution analytique respectueuse de la vie
                privée (sans cookies et anonymisée) uniquement pour mesurer la
                charge des serveurs et comprendre quelles enquêtes ou matchs
                attirent l'attention globale.
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                03 — NOTRE APPROCHE DES DONNÉES WIKIPÉDIA
              </div>
              <p>
                Toutes les données affichées dans l'Observatoire ou les
                Histoires proviennent de données publiquement publiées par la
                Wikimedia Foundation. WikiMatch n'accède pas, ne traite pas et
                ne stocke pas les adresses IP privées des contributeurs
                Wikipédia (celles-ci sont gérées selon la propre{" "}
                <a
                  href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/30 hover:text-white transition-colors"
                >
                  politique de confidentialité de Wikimedia
                </a>
                ).
              </p>
              <p>
                Nous ne citons le nom d'un contributeur que lorsque celui-ci est
                public, structurant pour une guerre d'édition ou pertinent d'un
                point de vue journalistique pour nos enquêtes, conformément à
                notre{" "}
                <Link
                  to="/methodology"
                  className="underline decoration-white/30 hover:text-white transition-colors"
                >
                  méthodologie publique
                </Link>
                .
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#38b000]">
                04 — HÉBERGEMENT
              </div>
              <p>
                Le prototype est actuellement hébergé dans des infrastructures
                Cloud isolées. Aucun partenaire tiers n'a accès aux logs de
                navigation.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
