import { motion } from "motion/react";
import { Link } from "react-router-dom";
import DemoBadge from "./DemoBadge";
import type { PublishedStory } from "../types";

export default function FeaturedStoryCard({
  featuredStory,
}: {
  featuredStory: PublishedStory;
}) {
  return (
    <section id="stories" className="py-24 px-4 md:px-8 bg-cream w-full overflow-hidden border-b border-navy/10 relative z-30">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-12 lg:gap-16">
        
        {/* Header */}
        <div className="flex flex-col gap-6">
          <DemoBadge />
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              <div className="font-mono text-xs text-blue-electric tracking-widest uppercase">
                {featuredStory.label}
              </div>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-none text-navy">
                {featuredStory.title}
              </h2>
              <p className="text-lg md:text-xl text-navy/70 leading-relaxed font-light">
                {featuredStory.excerpt}
              </p>
              
              <div className="bg-navy/5 p-4 rounded border-l-2 border-navy/20 font-mono text-xs text-navy/70 leading-relaxed mt-4">
                <strong>Observation :</strong> les articles comparés diffèrent actuellement.<br/>
                <strong>Limite :</strong> cette différence ne permet pas de déduire l’opinion des publics ou des contributeurs.
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <Link to={`/story/${featuredStory.slug}`} className="bg-navy text-cream px-6 py-3 font-medium hover:bg-blue-electric transition-colors text-center">
                  Comparer les versions
                </Link>
                <Link to={`/story/${featuredStory.slug}`} className="border border-navy/20 px-6 py-3 font-medium hover:bg-navy/5 transition-colors text-center">
                  Voir les modifications sources
                </Link>
              </div>
            </div>

            {/* Comparison Columns */}
            <div className="col-span-12 lg:col-span-7">
              <div className="flex flex-col sm:flex-row gap-4 h-full relative">
                {/* Horizontal / Vertical connecting line (decorative) */}
                <div className="absolute top-8 left-0 right-0 h-[1px] bg-navy/10 hidden sm:block" />
                
                {featuredStory.comparison?.map((col, index) => (
                  <motion.div 
                    key={col.language}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex-1 bg-white border border-navy/10 p-6 flex flex-col gap-4 relative md:hover:-translate-y-1 transition-transform group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-4xl text-navy/20 group-hover:text-blue-electric transition-colors">
                        {col.language}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-navy/20 group-hover:bg-blue-electric transition-colors" />
                    </div>
                    
                    <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50">
                      {col.shortLabel}
                    </div>

                    <div className="mt-8 font-medium text-navy text-sm md:text-base leading-relaxed h-[80px]">
                      {col.observation}
                    </div>

                    <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-navy/5 font-mono text-[10px] uppercase">
                      <div className="flex justify-between">
                        <span className="text-navy/50">Source</span>
                        <span className={col.status === "present" ? "text-navy" : "text-navy/40"}>
                          {col.status === "present" ? "PRÉSENTE" : "ABSENTE"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-navy/50">État</span>
                        <span className={col.status === "absent" ? "text-navy/40" : "text-navy"}>
                          {col.status === "absent" ? "NON OBSERVÉ" : "STABLE"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
