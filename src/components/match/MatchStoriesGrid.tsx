import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { MatchPublishedStory } from "../../types";
import MatchDemoBadge from "./MatchDemoBadge";

export default function MatchStoriesGrid({ stories }: { stories: MatchPublishedStory[] }) {
  const featured = stories.find(s => s.featured);
  const others = stories.filter(s => !s.featured);

  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            LES HISTOIRES DU MATCH
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
            Des changements comparés et validés.<br/>Jamais un simple volume de modifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Featured Story */}
          {featured && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 flex flex-col"
            >
              <Link to={`/story/${featured.slug}`} className="group flex flex-col border border-navy/10 bg-white hover:border-navy/30 transition-colors h-full shadow-sm">
                <div className="p-4 border-b border-navy/10 flex justify-between items-start bg-navy/5">
                  <MatchDemoBadge />
                </div>
                
                <div className="p-8 md:p-12 flex flex-col gap-6 flex-grow relative overflow-hidden">
                   {/* Abstract graphic */}
                   <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-electric/5 to-transparent pointer-events-none group-hover:from-blue-electric/10 transition-colors" />

                   <div className="font-mono text-xs text-blue-electric tracking-widest uppercase font-bold">
                     {featured.categoryLabel}
                   </div>
                   <h3 className="font-display text-4xl md:text-5xl uppercase leading-none text-navy group-hover:text-blue-electric transition-colors z-10 w-4/5">
                     {featured.title}
                   </h3>
                   <p className="font-sans text-lg text-navy/80 font-light leading-relaxed z-10">
                     {featured.excerpt}
                   </p>
                   
                   <div className="flex gap-2 mt-auto z-10 pt-4">
                     {featured.languages.map(l => (
                       <span key={l} className="px-2 py-1 bg-cream-dark font-mono text-[10px] rounded text-navy/70 uppercase">
                         {l}
                       </span>
                     ))}
                   </div>
                </div>

                <div className="px-8 py-4 border-t border-navy/10 flex justify-between items-center font-mono text-xs uppercase cursor-pointer bg-navy text-white hover:bg-blue-electric transition-colors font-bold">
                   Lire l'histoire complète <span className="text-[14px]">→</span>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Secondary Stories */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {others.map((story, i) => (
              <motion.div 
                key={story.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex-grow flex flex-col"
              >
                <Link to={story.slug.includes("demo-divergence") ? `/story/${story.slug}` : `#`} className="group flex flex-col border border-navy/10 bg-white hover:border-navy/30 transition-colors h-full shadow-sm">
                  <div className="p-4 border-b border-navy/10">
                    <MatchDemoBadge />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col gap-4 flex-grow relative">
                    <div className="font-mono text-[10px] text-navy/50 tracking-widest uppercase font-bold">
                      {story.categoryLabel}
                    </div>
                    <h3 className="font-display text-3xl uppercase leading-tight text-navy group-hover:text-blue-electric transition-colors z-10">
                      {story.title}
                    </h3>
                    <p className="font-sans text-sm text-navy/70 font-light leading-relaxed mb-4">
                      {story.excerpt}
                    </p>
                    <div className="flex gap-2 mt-auto z-10">
                       {story.languages.map(l => (
                         <span key={l} className="px-2 py-1 bg-cream-dark font-mono text-[10px] rounded text-navy/70 uppercase">
                           {l}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-navy/10 flex justify-between items-center font-mono text-[10px] uppercase cursor-pointer hover:bg-navy/5 transition-colors font-bold text-navy">
                    Lire l'histoire <span className="text-lg leading-none group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
