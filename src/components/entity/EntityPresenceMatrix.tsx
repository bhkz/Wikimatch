import { motion } from "motion/react";
import { EntityComparisonCase } from "../../types";

export default function EntityPresenceMatrix({ comparison }: { comparison: EntityComparisonCase }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        
        <div className="flex items-center gap-4">
           <h2 className="font-mono text-[10px] sm:text-xs uppercase font-bold tracking-widest text-navy bg-navy/5 px-4 py-2 border border-navy/10 w-fit">
             CE QUI APPARAÎT DANS CHAQUE ÉDITION
           </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
           <table className="w-full text-left font-mono uppercase tracking-widest">
             <thead>
               <tr className="border-b-2 border-navy/20 text-xs text-navy/50 font-bold">
                 <th className="pb-4 font-normal">Élément comparé</th>
                 <th className="pb-4 w-32">JA</th>
                 <th className="pb-4 w-40">EN</th>
                 <th className="pb-4 w-40">FR</th>
               </tr>
             </thead>
             <tbody>
               {comparison.rows.map((row, i) => (
                 <motion.tr 
                   key={i}
                   initial={{ opacity: 0, y: 10 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   className="border-b border-navy/10 group hover:bg-white transition-colors"
                 >
                   <td className="py-6 pr-4 font-bold text-xs text-navy">{row.claimLabel}</td>
                   <td className="py-6 text-xs font-bold text-[#e63946]">{row.JA}</td>
                   <td className="py-6 text-[10px] font-normal text-navy/40">{row.EN}</td>
                   <td className="py-6 text-[10px] font-normal text-navy/40">{row.FR}</td>
                 </motion.tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* Mobile Lines */}
        <div className="flex md:hidden flex-col gap-6">
           {comparison.rows.map((row, i) => (
              <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="flex flex-col gap-3 pb-6 border-b border-navy/10"
              >
                 <div className="font-mono text-xs font-bold uppercase tracking-widest text-navy">
                   {row.claimLabel}
                 </div>
                 <div className="flex justify-between font-mono text-[10px] uppercase font-bold tracking-widest">
                    <span className="text-navy flex gap-2"><span className="text-navy/50">JA</span> <span className="text-[#e63946]">{row.JA}</span></span>
                    <span className="text-navy flex gap-2"><span className="text-navy/50">EN</span> <span className="text-navy/40">{row.EN}</span></span>
                    <span className="text-navy flex gap-2"><span className="text-navy/50">FR</span> <span className="text-navy/40">{row.FR}</span></span>
                 </div>
              </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 bg-white p-6 md:p-8 border border-navy/10">
          <div className="flex flex-col gap-3">
             <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-navy/40">LECTURE</div>
             <p className="font-sans text-sm text-navy/80 leading-relaxed font-light">
               Dans le scénario observé, l’article japonais documente la performance du joueur avant les deux autres éditions comparées.
             </p>
          </div>
          <div className="flex flex-col gap-3">
             <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#e63946]/50">LIMITE</div>
             <p className="font-sans text-sm text-navy/80 leading-relaxed font-light">
               “Non détecté” signifie uniquement que l’élément n’apparaît pas dans la version observée à cet instant. Il peut être ajouté ultérieurement.
             </p>
          </div>
        </div>

      </div>
    </section>
  );
}
