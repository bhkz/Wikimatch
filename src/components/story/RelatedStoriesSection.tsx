import { motion } from "motion/react";
import StoryDemoBadge from "./StoryDemoBadge";

export default function RelatedStoriesSection() {
  const related = [
    {
      label: "UN FAIT ENTRE DANS WIKIPÉDIA",
      title: "La qualification d’une sélection apparaît dans quatre éditions en quinze minutes.",
      type: "language_convergence"
    },
    {
      label: "ARTICLE INSTABLE",
      title: "Une mention retirée puis réintroduite trois fois sur le même article.",
      type: "article_instability"
    }
  ];

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        <h2 className="font-display text-3xl sm:text-4xl text-center md:text-left uppercase text-navy">
          AUTRES HISTOIRES À EXPLORER
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {related.map((story, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group flex flex-col border border-navy/10 bg-white hover:border-navy/30 transition-colors overflow-hidden"
            >
              <div className="p-4 border-b border-navy/10 flex justify-between items-start bg-navy/5">
                <StoryDemoBadge />
              </div>

              <div className="p-8 flex flex-col gap-6 flex-grow relative">
                {/* Subtle abstraction image on hover */}
                <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-navy/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="font-mono text-[10px] text-blue-electric tracking-widest uppercase font-bold">
                  {story.label}
                </div>
                <h3 className="font-display text-2xl uppercase leading-tight text-navy group-hover:text-blue-electric transition-colors z-10">
                  {story.title}
                </h3>
              </div>

              <div className="px-8 py-4 border-t border-navy/10 flex justify-between items-center font-mono text-xs uppercase cursor-pointer hover:bg-navy hover:text-white transition-colors text-navy font-bold">
                Lire l'histoire <span className="text-[14px]">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
