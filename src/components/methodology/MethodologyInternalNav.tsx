import { useState, useEffect } from "react";

const navItems = [
  { id: "methodology-definitions", label: "Méthode" },
  { id: "methodology-pipeline", label: "Pipeline" },
  { id: "methodology-publication", label: "Publication" },
  { id: "methodology-comparison", label: "Comparaison" },
  { id: "methodology-ai", label: "IA" },
  { id: "methodology-privacy", label: "Vie privée" },
  { id: "methodology-limitations", label: "Limites" },
  { id: "methodology-faq", label: "FAQ" },
];

export default function MethodologyInternalNav() {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // offset

      let currentId = navItems[0].id;
      for (const item of navItems) {
        const element = document.getElementById(item.id);
        if (element && scrollPosition >= element.offsetTop) {
          currentId = item.id;
        }
      }
      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="sticky top-[73px] md:top-[85px] z-40 w-full bg-cream/90 backdrop-blur-md border-b border-navy/10 overflow-x-auto hide-scrollbar">
      <div className="w-full max-w-screen-xl mx-auto px-4 md:px-8">
        <nav className="flex items-center gap-2 md:gap-6 py-4 min-w-max">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`font-mono text-[10px] md:text-xs uppercase font-bold tracking-widest px-4 py-2 transition-colors whitespace-nowrap 
                ${
                  activeId === item.id
                    ? "bg-navy text-white"
                    : "text-navy/60 hover:text-navy hover:bg-navy/5"
                }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
