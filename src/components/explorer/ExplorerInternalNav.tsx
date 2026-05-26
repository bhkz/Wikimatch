import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function ExplorerInternalNav() {
  const [activeMenu, setActiveMenu] = useState("map");

  useEffect(() => {
    const handleScroll = () => {
      const mapEl = document.getElementById('map');
      const matrixEl = document.getElementById('matrix');
      const timelineEl = document.getElementById('timeline');
      
      const scrollPos = window.scrollY + 200;

      if (timelineEl && scrollPos >= timelineEl.offsetTop) {
        setActiveMenu("timeline");
      } else if (matrixEl && scrollPos >= matrixEl.offsetTop) {
        setActiveMenu("matrix");
      } else if (mapEl && scrollPos >= mapEl.offsetTop) {
        setActiveMenu("map");
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveMenu(id);
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-white border-b border-navy/10 relative z-30">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        <h2 className="font-display text-4xl uppercase tracking-wide text-navy text-center md:text-left">CHOISIR UN ANGLE D'EXPLORATION</h2>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center md:sticky top-[72px] bg-white py-4">
           
           <NavCard 
             id="map" 
             title="CARTE DES SUJETS" 
             desc="Où se situent les entités liées aux histoires publiées." 
             isActive={activeMenu === "map"} 
             onClick={() => scrollToSection("map")} 
           />
           
           <NavCard 
             id="matrix" 
             title="MATRICE DES ÉDITIONS" 
             desc="Ce que les différents articles retiennent ou non." 
             isActive={activeMenu === "matrix"} 
             onClick={() => scrollToSection("matrix")} 
           />
           
           <NavCard 
             id="timeline" 
             title="CHRONOLOGIE DU TOURNOI" 
             desc="Quand les histoires apparaissent au fil des matchs." 
             isActive={activeMenu === "timeline"} 
             onClick={() => scrollToSection("timeline")} 
           />

        </div>
      </div>
    </section>
  );
}

function NavCard({ id, title, desc, isActive, onClick }: { id: string, title: string, desc: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center md:items-start text-center md:text-left p-6 border transition-all duration-300
        ${isActive ? 'border-navy shadow-md bg-navy/5' : 'border-navy/10 hover:border-navy/40 bg-white hover:bg-cream/50'}
      `}
    >
       <div className={`font-mono text-sm uppercase font-bold tracking-widest mb-2 transition-colors
         ${isActive ? 'text-navy' : 'text-navy/60'}
       `}>
         {title}
       </div>
       <div className="font-sans text-xs text-navy/70 font-light leading-relaxed">
         {desc}
       </div>
    </button>
  );
}
