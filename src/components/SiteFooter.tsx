import { Link, useLocation } from "react-router-dom";

export default function SiteFooter() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const getNavPath = (hash: string) => {
    return isHome ? hash : `/${hash}`;
  };

  return (
    <footer className="bg-navy text-cream pt-24 pb-12 px-4 md:px-8 overflow-hidden relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-24 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
            <div className="font-display text-4xl uppercase tracking-wide">REVISION 90</div>
            <div className="font-mono text-xs text-cream/50 uppercase tracking-widest">
              WIKIMATCH · WC26
            </div>
            <p className="font-sans font-light text-cream/70 leading-relaxed mt-4 max-w-sm">
              Un projet indépendant d’observation des récits Wikipédia autour de la Coupe du monde 2026.
            </p>
          </div>

          <div className="col-span-6 md:col-span-4 flex flex-col gap-4 font-display text-2xl uppercase tracking-wider">
            <Link to="/stories" className="hover:text-blue-electric transition-colors">Histoires</Link>
            <Link to="/matches" className="hover:text-blue-electric transition-colors">Matchs</Link>
            <Link to="/explorer" className="hover:text-blue-electric transition-colors">Explorer</Link>
            <Link to="/observatoire" className="hover:text-blue-electric transition-colors">Observatoire</Link>
            <Link to="/methodology" className="hover:text-blue-electric transition-colors">Méthodologie</Link>
            <Link to={getNavPath("#search")} className="hover:text-blue-electric transition-colors">Recherche</Link>
          </div>

          <div className="col-span-6 md:col-span-4 flex flex-col gap-4 font-mono text-xs uppercase tracking-widest text-cream/60">
            <Link to="/about" className="hover:text-cream transition-colors">À propos</Link>
            <Link to="/privacy" className="hover:text-cream transition-colors">Confidentialité</Link>
            <Link to="/source" className="hover:text-cream transition-colors">Code source</Link>
            <Link to="/contact" className="hover:text-cream transition-colors">Contact</Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-cream/10 font-mono text-[10px] uppercase tracking-widest text-cream/40 text-center md:text-left">
          <span>
            WikiMatch n’est affilié ni à Wikipédia, ni à la Wikimedia Foundation, ni à la FIFA.
            <br className="hidden md:block" /> Les marques citées appartiennent à leurs détenteurs respectifs.
          </span>
          <span>© 2026 — REVISION 90</span>
        </div>
      </div>
      
      {/* Decorative large text */}
      <div className="absolute bottom-[-5%] left-0 right-0 font-display text-[20vw] uppercase text-cream/5 whitespace-nowrap overflow-hidden pointer-events-none select-none z-0">
        REVISION 90
      </div>
    </footer>
  );
}
