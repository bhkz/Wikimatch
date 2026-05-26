import { motion } from "motion/react";
import { isDemoMode } from "../../data";

export default function MatchShareCardPreview() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden bg-grid-pattern-light">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        <div className="flex flex-col gap-6 lg:w-5/12 text-center lg:text-left">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            PARTAGER<br/>LE RÉCIT DU MATCH
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
            Une carte partageable ne résume pas le volume de modifications. Elle résume les histoires vérifiées issues du match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start hidden md:flex">
             <button className="bg-navy text-white px-6 py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-blue-electric transition-colors w-full sm:w-auto text-center cursor-not-allowed">
               Aperçu du partage
             </button>
             <button className="border border-navy/20 px-6 py-3 font-mono text-[10px] font-bold tracking-widest uppercase hover:bg-navy/5 transition-colors w-full sm:w-auto text-center cursor-not-allowed">
               Copier le lien
             </button>
          </div>
        </div>

        <div className="w-full lg:w-7/12 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-full max-w-md aspect-[4/5] bg-navy p-8 shadow-2xl flex flex-col justify-between relative border-8 border-white overflow-hidden group"
          >
            {/* BG Graphic */}
            <div className="absolute inset-0 bg-blue-electric/10 opacity-50 mix-blend-screen" />
            
            <div className="relative z-10 flex flex-col gap-6 items-center text-center mt-4">
               <div className="font-display text-2xl tracking-wide uppercase text-cream/70 border-b border-cream/20 pb-4 w-full">
                 REVISION 90 · WIKIMATCH
               </div>
               <div className="font-display text-4xl tracking-widest uppercase text-white leading-none mt-4">
                 APERÇU CARTE PARTAGE
               </div>
               <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-blue-electric bg-blue-electric/10 px-4 py-2 border border-blue-electric/20 rounded">
                 LE MATCH VU DEPUIS WIKIPÉDIA
               </div>
            </div>

            <div className="relative z-10 flex flex-col gap-4 font-sans text-lg font-light text-cream/90 mx-auto mt-8 border-l border-cream/30 pl-4 w-[240px]">
              <div className="leading-tight">1 fait entré dans<br/>plusieurs éditions</div>
              <div className="leading-tight">1 divergence<br/>documentée</div>
              <div className="leading-tight">1 article instable<br/>observé</div>
            </div>

            <div className="relative z-10 mt-auto flex flex-col gap-6 items-center">
              <div className="flex gap-2">
                <span className="font-mono text-xs font-bold text-navy bg-cream px-2 py-1 rounded-sm">EN</span>
                <span className="font-mono text-xs font-bold text-navy bg-cream px-2 py-1 rounded-sm">ES</span>
                <span className="font-mono text-xs font-bold text-navy bg-cream px-2 py-1 rounded-sm">FR</span>
              </div>
              {isDemoMode && (
              <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-cream/40 px-2 py-1 border border-cream/10">
                SCÉNARIO FICTIF · DÉMONSTRATION UI
              </div>
              )}
            </div>

            {/* Hover indication */}
             <div className="hidden absolute inset-0 bg-navy/80 md:flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                <div className="bg-cream text-navy px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest">Générateur désactivé</div>
             </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
