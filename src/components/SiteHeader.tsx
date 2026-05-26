import { motion } from "motion/react";
import { Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Lock body scroll when menu is open
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = menuOpen ? "hidden" : "";
    }
  }, [menuOpen]);

  // Handle local anchors carefully if not on home
  const getNavPath = (hash: string) => {
    return isHome ? hash : `/${hash}`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b-[0.5px] border-navy/10 transition-colors duration-300 text-navy">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          
          <div className="flex items-baseline gap-4">
            <Link to="/" className="font-display text-2xl md:text-3xl tracking-wide uppercase hover:text-blue-electric transition-colors">
              REVISION 90
            </Link>
            <span className="hidden md:inline font-mono text-xs text-navy/50">WIKIMATCH · WC26</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/search" aria-label="Recherche" className="hover:text-blue-electric transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <div className="hidden lg:flex gap-6 font-medium text-sm">
              <Link to="/stories" className="hover:text-blue-electric transition-colors uppercase font-mono tracking-widest text-[10px] font-bold">Histoires</Link>
              <Link to="/matches" className="hover:text-blue-electric transition-colors uppercase font-mono tracking-widest text-[10px] font-bold">Matchs</Link>
              <Link to="/explorer" className="hover:text-blue-electric transition-colors uppercase font-mono tracking-widest text-[10px] font-bold">Explorer</Link>
              <Link to="/observatoire" className="hover:text-blue-electric transition-colors uppercase font-mono tracking-widest text-[10px] font-bold">Observatoire</Link>
              <Link to="/methodology" className="hover:text-blue-electric transition-colors uppercase font-mono tracking-widest text-[10px] font-bold">Méthodologie</Link>
            </div>
            <button 
              aria-label="Menu" 
              className="lg:hidden hover:text-blue-electric transition-colors z-50"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu */}
      <motion.div 
        initial={{ y: "-100%" }}
        animate={{ y: menuOpen ? "0%" : "-100%" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-40 bg-navy text-cream flex flex-col pt-24 px-6 md:px-12 lg:hidden"
      >
        <nav className="flex flex-col gap-6 mt-12">
          {["Histoires", "Matchs", "Explorer", "Observatoire", "Méthodologie"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Link
                to={item === "Histoires" ? "/stories" : item === "Matchs" ? "/matches" : item === "Explorer" ? "/explorer" : item === "Observatoire" ? "/observatoire" : "/methodology"}
                onClick={() => setMenuOpen(false)}
                className="font-display text-5xl sm:text-6xl uppercase tracking-wider hover:text-blue-electric transition-colors"
              >
                {item}
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto mb-12 font-mono text-xs text-cream/50 max-w-xs">
          Un projet indépendant basé sur les modifications publiques de Wikipédia.
        </div>
      </motion.div>
    </>
  );
}
