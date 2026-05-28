import { motion } from "motion/react";
import { isLiveMode } from "../../data";
import DemoBadge from "../DemoBadge";

export default function ExplorerHero() {
  const scrollToAtlas = () => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
  const scrollToMatrix = () => document.getElementById("matrix")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-[85svh] md:min-h-screen w-full flex flex-col justify-end overflow-hidden pt-32 pb-16 px-4 md:px-8 bg-cream text-navy border-b border-navy/10 scroll-m-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0 bg-cream flex items-center justify-center opacity-30 select-none pointer-events-none"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center grayscale mix-blend-multiply opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/50 to-transparent z-10" />
      </motion.div>

      <div className="relative z-10 w-full max-w-screen-2xl mx-auto flex flex-col gap-8 md:gap-16">
        <div className="flex flex-col items-start gap-4">
          <DemoBadge text="DEMONSTRATION D'INTERFACE · VISUALISATIONS FICTIVES · AUCUNE DONNEE REELLE" />
          <div className="font-mono text-[10px] sm:text-xs text-navy/60 uppercase tracking-widest font-bold">
            EXPLORER · WIKIMATCH · WC26
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mt-8 md:mt-24">
          <div className="flex flex-col gap-6 md:w-2/3">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-wide leading-[0.85] text-navy">
              {["CE QUE LES", "WIKIPEDIAS", "RETIENNENT", "DU TOURNOI."].map((line, index) => (
                <span key={line} className="block overflow-hidden pb-1">
                  <motion.span
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    transition={{ delay: 0.1 + index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`block ${index >= 2 ? "text-navy/70" : ""}`}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white border border-navy/10 p-6 md:p-8 mt-6 max-w-xl shadow-sm"
            >
              <h2 className="font-mono text-sm uppercase font-bold tracking-widest text-navy mb-4">
                LA CARTE SITUE LES SUJETS FOOTBALLISTIQUES.
                <br />
                JAMAIS LES PERSONNES QUI ECRIVENT.
              </h2>
              <p className="font-sans text-sm md:text-base text-navy/70 leading-relaxed font-light">
                {isLiveMode
                  ? "Carte des sujets documentes, comparaison des editions linguistiques et chronologie des histoires publiees a partir des donnees Supabase live."
                  : "Carte des sujets documentes, comparaison des editions linguistiques et chronologie des histoires publiees : parcourez les recits fictifs de la demonstration WikiMatch."}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="flex flex-col gap-4 w-full md:w-auto"
          >
            <button onClick={scrollToAtlas} className="bg-navy text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric hover:text-white transition-colors w-full md:w-auto text-center shadow-lg">
              Ouvrir l'atlas
            </button>
            <button onClick={scrollToMatrix} className="border border-navy/20 text-navy px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-navy/5 transition-colors w-full md:w-auto text-center bg-white">
              Voir la matrice des editions
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap gap-4 mt-8 md:mt-16 font-mono text-[9px] uppercase font-bold tracking-widest"
        >
          <span className="text-[#e63946] border border-[#e63946]/20 bg-[#e63946]/5 px-3 py-1.5">DIVERGENCE</span>
          <span className="text-blue-electric border border-blue-electric/20 bg-blue-electric/5 px-3 py-1.5">MISE A JOUR CONVERGENTE</span>
          <span className="text-navy/50 border border-navy/20 bg-navy/5 px-3 py-1.5">ARTICLE INSTABLE</span>
        </motion.div>
      </div>
    </section>
  );
}
