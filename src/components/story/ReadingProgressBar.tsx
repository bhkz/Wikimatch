import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Share2, ArrowLeft } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";

export default function ReadingProgressBar({ category }: { category: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`fixed top-[72px] left-0 right-0 z-40 bg-cream border-b-[0.5px] border-navy/10 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-blue-electric origin-left z-50"
        style={{ scaleX }}
      />
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between text-navy">
        <Link to="/" className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:text-blue-electric transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">Retour aux histoires</span>
          <span className="md:hidden">Histoires</span>
        </Link>
        <div className="text-xs font-mono uppercase tracking-widest text-navy/60 hidden sm:block">
          {category}
        </div>
        <button className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:text-blue-electric transition-colors">
          <span className="hidden sm:inline">Partager</span>
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
