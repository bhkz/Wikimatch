import { motion } from "motion/react";
import { PublishedStoryDetail } from "../../types";

export default function StoryTimeline({ story }: { story: PublishedStoryDetail }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            COMMENT LE RÉCIT APPARAÎT
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
            Une chronologie fictive des observations comparées<br className="hidden md:block"/> autour du même épisode de match.
          </p>
        </div>

        <div className="relative mt-8 md:mt-16 w-full pb-8">
          {/* Main timeline axis - Desktop horizontal, Mobile vertical */}
          <div className="absolute top-0 bottom-0 md:bottom-auto md:top-6 left-[27px] md:left-0 md:right-0 w-[2px] md:w-full md:h-[2px] bg-navy/10" />

          {/* Timeline Items */}
          <div className="flex flex-col md:flex-row gap-12 md:gap-6 lg:gap-8 justify-between relative pl-16 md:pl-0">
            {story.timeline.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative flex flex-col gap-4 md:w-1/4 group"
              >
                {/* Node */}
                <div className="absolute -left-16 top-0 md:static md:mb-4 flex flex-col md:items-center">
                  <div className={`w-4 h-4 rounded-full border-2 border-cream z-10 
                    ${item.kind === 'match_event' ? 'bg-navy w-6 h-6 -translate-x-1 md:-translate-x-0' : 
                      item.languageCode === 'EN' ? 'bg-blue-electric' : 
                      item.languageCode === 'ES' ? 'bg-[#A8B227]' : 'bg-navy/30'}`} 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-3xl md:text-4xl text-navy">
                      {item.time}
                    </span>
                    {item.languageCode && (
                      <span className="font-mono text-[10px] font-bold bg-navy/10 px-2 py-0.5 rounded text-navy tracking-widest">
                        {item.languageCode}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-white border text-left border-navy/10 p-5 shadow-sm relative group-hover:border-navy/30 transition-colors">
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-navy/80 mb-2">
                      {item.title}
                    </h4>
                    <p className="font-sans text-sm text-navy/70 leading-relaxed font-light">
                      {item.description}
                    </p>
                    
                    {/* Speech bubble arrow taking direction based on device */}
                    <div className="absolute w-3 h-3 bg-white border-t border-l border-navy/10 
                      -left-[7px] top-4 md:top-[-7px] md:left-6 rotate-[-45deg] md:rotate-[45deg] 
                      group-hover:border-navy/30 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
