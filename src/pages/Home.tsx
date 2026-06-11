import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

/**
 * Placeholder P0 — remplacé par la HexMap plein écran (spec §12).
 * État pré-tournoi : compte à rebours + pitch.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 bg-grid-pattern">
        <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric mb-4">
          Mondial 2026 · 11 juin → 19 juillet
        </div>
        <h1 className="font-display uppercase tracking-wide leading-[0.9] text-6xl md:text-[7rem] text-center">
          L'Atlas du Mondial
        </h1>
        <p className="font-sans font-light text-lg text-navy/70 max-w-md text-center mt-6">
          La Coupe du Monde, racontée par une carte : chaque victoire réelle
          redessine les frontières du monde.
        </p>
        <div className="font-mono text-xs uppercase tracking-widest text-navy/40 mt-12">
          Carte en construction
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
