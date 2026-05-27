import { motion } from "motion/react";
import { isLiveMode } from "../../data";

export default function EntityEditorialSummary() {
  // Cette section explicative est intégralement écrite autour du cas
  // Ren Ito / Japon-Sénégal. En mode live, elle n'a aucun sens — masquée.
  if (isLiveMode) return null;
  return (
    <section className="py-24 px-4 md:px-8 bg-cream relative z-10 border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <div className="flex items-center gap-4">
           <h2 className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy bg-navy/5 px-4 py-2 border border-navy/10 w-fit">
             POURQUOI CE JOUEUR APPARAÎT ICI
           </h2>
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide text-navy leading-[1.2] max-w-4xl"
        >
          Dans ce scénario fictif, Ren Ito n’est pas mis en avant parce que son article reçoit beaucoup de modifications. Il apparaît parce qu’un changement substantiel est observable : <span className="text-blue-electric">son article japonais documente une performance de match qui n’apparaît pas encore dans les articles anglais et français comparés au même moment.</span>
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl md:text-7xl uppercase tracking-wide text-navy my-8 border-l-4 border-[#e63946] pl-6 md:pl-10"
        >
          L'INTÉRÊT N'EST PAS LE VOLUME.
          <br />C'EST LE DÉCALAGE DE DOCUMENTATION.
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative">
          <div className="hidden md:block absolute top-[20px] bottom-[20px] left-1/2 w-[1px] bg-navy/10" />
          
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.4 }}
             className="flex flex-col gap-4"
          >
             <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest text-blue-electric">OBSERVATION</h3>
             <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
               L'édition japonaise contient trois ajouts substantiels liés au match fictif Japon — Sénégal.
             </p>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.5 }}
             className="flex flex-col gap-4"
          >
             <h3 className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/40">LIMITE</h3>
             <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
               L'absence de ces ajouts dans d'autres éditions ne permet pas d'en expliquer la cause ni de conclure à un manque d'intérêt durable.
             </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
