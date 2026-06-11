import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="bg-navy text-cream pt-24 pb-12 px-4 md:px-8 overflow-hidden relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-24 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
            <div className="font-display text-4xl uppercase tracking-wide">L'ATLAS DU MONDIAL</div>
            <div className="font-mono text-xs text-cream/50 uppercase tracking-widest">
              MONDIAL 2026 · 11 JUIN → 19 JUILLET
            </div>
            <p className="font-sans font-light text-cream/70 leading-relaxed mt-4 max-w-sm">
              La Coupe du Monde racontée par une carte : chaque victoire réelle redessine les frontières du monde.
            </p>
          </div>

          <div className="col-span-6 md:col-span-4 flex flex-col gap-4 font-display text-2xl uppercase tracking-wider">
            <Link to="/" className="hover:text-blue-electric transition-colors">Carte</Link>
            <Link to="/nuit" className="hover:text-blue-electric transition-colors">La Nuit</Link>
            <Link to="/groupes" className="hover:text-blue-electric transition-colors">Groupes</Link>
            <Link to="/tableau" className="hover:text-blue-electric transition-colors">Tableau</Link>
            <Link to="/calendrier" className="hover:text-blue-electric transition-colors">Calendrier</Link>
            <Link to="/memorial" className="hover:text-blue-electric transition-colors">Memorial</Link>
          </div>

          <div className="col-span-6 md:col-span-4 flex flex-col gap-4 font-mono text-xs uppercase tracking-widest text-cream/60">
            <Link to="/methodo" className="hover:text-cream transition-colors">Comment ça marche</Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-cream/10 font-mono text-[10px] uppercase tracking-widest text-cream/40 text-center md:text-left">
          <span>
            Site indépendant de visualisation, non affilié à la FIFA ni à aucune fédération.
            <br className="hidden md:block" /> Données : football-data.org. Aucun pari, aucun argent réel.
          </span>
          <span>© 2026 · L'ATLAS DU MONDIAL</span>
        </div>
      </div>
      
      {/* Decorative large text */}
      <div className="absolute bottom-[-5%] left-0 right-0 font-display text-[20vw] uppercase text-cream/5 whitespace-nowrap overflow-hidden pointer-events-none select-none z-0">
        ATLAS 2026
      </div>
    </footer>
  );
}
