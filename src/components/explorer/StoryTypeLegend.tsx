import { motion } from "motion/react";
import { ExplorerLegendItem } from "../../types";

export default function StoryTypeLegend({ legend }: { legend: ExplorerLegendItem[] }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-white border-b border-navy/10 relative">
       <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
          
          <h2 className="font-display text-4xl uppercase tracking-wide text-navy text-center md:text-left border-b border-navy/10 pb-6">
            TYPOLOGIE DES HISTOIRES WIKIMATCH
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {legend.map((item, i) => (
                <motion.div 
                  key={item.type}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-4 border border-navy/10 p-6"
                >
                   <div className={`font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-1 w-fit border ${getTypeBadgeClass(item.type)}`}>
                     {item.label}
                   </div>
                   <p className="font-sans text-sm text-navy/70 leading-relaxed font-light">
                     {item.description}
                   </p>
                </motion.div>
             ))}
          </div>

       </div>
    </section>
  );
}

function getTypeBadgeClass(type: string) {
  switch(type) {
    case 'fact_entry': return 'text-yellow-600 border-yellow-600 bg-yellow-50';
    case 'language_convergence': return 'text-blue-electric border-blue-electric bg-blue-electric/5';
    case 'language_divergence': return 'text-[#e63946] border-[#e63946] bg-[#e63946]/5';
    case 'article_instability': return 'text-[#780000] border-[#780000] bg-[#780000]/5';
    case 'under_radar': return 'text-[#2a9d8f] border-[#2a9d8f] bg-[#2a9d8f]/5';
    case 'match_recap': return 'text-navy border-navy bg-navy/5';
    default: return 'text-navy border-navy bg-white';
  }
}
