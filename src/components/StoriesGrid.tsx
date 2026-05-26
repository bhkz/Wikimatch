import { motion } from "motion/react";
import { Link } from "react-router-dom";
import DemoBadge from "./DemoBadge";
import type { PublishedStory } from "../types";

export default function StoriesGrid({
  latestStories,
}: {
  latestStories: PublishedStory[];
}) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            DERNIÈRES HISTOIRES
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light max-w-2xl">
            Des changements compréhensibles, documentés et vérifiés. Jamais un simple compteur de modifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {latestStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
            <Link
              to={`/story/${story.slug}`}
              className="group flex flex-col border border-navy/10 bg-white hover:border-navy/30 transition-colors h-full"
            >
              <div className="p-4 border-b border-navy/10 flex justify-between items-start">
                <DemoBadge />
              </div>
              
              <div className="p-6 md:p-8 flex flex-col gap-4 flex-grow">
                <div className="font-mono text-[10px] text-blue-electric tracking-widest uppercase">
                  {story.label}
                </div>
                <h3 className="font-display text-3xl uppercase leading-none text-navy group-hover:text-blue-electric transition-colors">
                  {story.title}
                </h3>

                {/* Custom Micro-visuals based on type */}
                <div className="mt-8 flex-grow">
                  {story.type === "language_convergence" && (
                    <div className="flex flex-col gap-3 font-mono text-[10px] uppercase">
                      <div className="flex items-center gap-4"><span className="w-8">EN</span> <div className="h-[2px] bg-navy flex-grow max-w-[20%]" /><span className="text-navy/50">+03 min</span></div>
                      <div className="flex items-center gap-4"><span className="w-8">FR</span> <div className="h-[2px] bg-navy flex-grow max-w-[40%]" /><span className="text-navy/50">+06 min</span></div>
                      <div className="flex items-center gap-4"><span className="w-8">AR</span> <div className="h-[2px] bg-navy flex-grow max-w-[60%]" /><span className="text-navy/50">+11 min</span></div>
                      <div className="flex items-center gap-4"><span className="w-8">ES</span> <div className="h-[2px] bg-navy flex-grow max-w-[80%]" /><span className="text-navy/50">+15 min</span></div>
                    </div>
                  )}

                  {story.type === "article_instability" && (
                    <div className="flex flex-col gap-3 font-mono text-[10px] uppercase border-l border-navy/20 pl-4 py-2">
                       <div className="text-navy flex items-center gap-2"><span className="w-2 h-2 bg-navy rounded-full"/> AJOUTÉ</div>
                       <div className="text-red-signal flex items-center gap-2 line-through"><span className="w-2 h-2 border border-red-signal rounded-full"/> RETIRÉ</div>
                       <div className="text-navy flex items-center gap-2"><span className="w-2 h-2 bg-navy rounded-full"/> RESTAURÉ</div>
                       <div className="text-blue-electric flex items-center gap-2"><span className="w-2 h-2 bg-blue-electric rounded-full"/> SOURCÉ</div>
                    </div>
                  )}

                  {story.type === "under_radar" && (
                     <div className="flex flex-col gap-3 font-mono text-[10px] uppercase">
                     <div className="flex items-center gap-4 border border-navy/10 p-2"><span className="w-8 text-blue-electric font-bold">JA</span> <span>Changements substantiels</span></div>
                     <div className="flex items-center gap-4 border border-navy/5 p-2 text-navy/40"><span className="w-8">EN</span> <span>Aucun changement détecté</span></div>
                     <div className="flex items-center gap-4 border border-navy/5 p-2 text-navy/40"><span className="w-8">FR</span> <span>Aucun changement détecté</span></div>
                   </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-navy/10 flex justify-between items-center font-mono text-xs uppercase text-navy/50">
                <div className="flex gap-2">
                  {story.languages.map(l => (
                    <span key={l} className="bg-cream-dark px-1.5 py-0.5 rounded">{l}</span>
                  ))}
                </div>
                <span className="group-hover:text-navy transition-colors flex items-center gap-2">
                  Lire l&apos;histoire <span className="text-[14px]">→</span>
                </span>
              </div>
            </Link>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 flex justify-center">
           <Link to="/stories" className="bg-navy text-white px-8 py-4 font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-blue-electric transition-colors">
              Voir toutes les histoires (Archive)
           </Link>
        </div>
      </div>
    </section>
  );
}
