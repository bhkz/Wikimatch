import { motion } from "motion/react";
import { Link } from "react-router-dom";

export default function MatchesFinalCTA() {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center py-32 px-4 md:px-8 text-cream overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-navy">
        <motion.img 
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1518605368461-1e96a4abcb32?q=80&w=2600&auto=format&fit=crop"
          alt="Stadium lights"
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-12">
        <h2 className="font-display text-5xl sm:text-6xl md:text-8xl uppercase tracking-wide leading-[0.85] text-white">
          <span className="block mb-2">LE TOURNOI COMMENCERA</span>
          <span className="block mb-2 text-cream/70">SUR LE TERRAIN.</span>
          <span className="block text-blue-electric">IL CONTINUERA</span>
          <span className="block text-blue-electric">DANS LES ARTICLES.</span>
        </h2>

        <p className="font-sans text-xl md:text-2xl font-light leading-relaxed max-w-2xl text-cream/80">
          Revenez pendant la Coupe du monde pour découvrir les matchs qui auront réellement laissé une trace intéressante dans Wikipédia.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <Link to="/stories" className="bg-blue-electric text-white px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-blue-electric transition-colors w-full sm:w-auto text-center shadow-lg">
            Explorer les histoires
          </Link>
          <button className="bg-transparent border border-cream/20 text-cream px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-cream/10 transition-colors w-full sm:w-auto text-center cursor-not-allowed hidden md:block">
            Être averti des nouveaux dossiers
          </button>
        </div>

        <Link to="/" className="font-mono text-[10px] font-bold uppercase tracking-widest text-cream/40 hover:text-cream transition-colors mt-8 underline decoration-cream/20">
          Retour à l'accueil
        </Link>
      </div>
    </section>
  );
}
