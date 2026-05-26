import { motion } from "motion/react";
import { MatchTimelineItem } from "../../types";

export default function MatchNarrativeTimeline({ timeline }: { timeline: MatchTimelineItem[] }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
            DU TERRAIN<br/>AUX ARTICLES
          </h2>
          <p className="font-sans text-lg text-navy/70 leading-relaxed font-light max-w-2xl">
            Les événements du match et les observations Wikipédia sont rapprochés dans le temps, sans affirmer automatiquement qu’un événement a causé une modification.
          </p>
        </div>

        <div className="mt-8 relative max-w-4xl mx-auto w-full">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 left-[27px] md:left-1/2 w-[2px] bg-navy/10 -translate-x-1/2" />

          <div className="flex flex-col gap-12">
            {timeline.map((item, i) => {
              const isEvent = item.type === "match_event";
              const isStory = item.type === "published_story";
              // Alternate sides for desktop
              const alignsRight = i % 2 !== 0;

              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5 }}
                  className={`relative flex flex-col md:flex-row items-start ${alignsRight ? "md:flex-row-reverse" : ""} gap-8 md:gap-16 w-full group pl-12 md:pl-0`}
                >
                  {/* Central Node */}
                  <div className="absolute left-[11px] md:left-1/2 md:-translate-x-1/2 flex items-center justify-center top-0">
                     <div className={`rounded-full border-4 border-cream shadow-sm z-10 transition-transform group-hover:scale-125
                        ${isEvent ? 'w-8 h-8 bg-navy' : 
                          isStory ? 'w-8 h-8 bg-blue-electric' : 
                          'w-5 h-5 bg-navy/30 translate-y-1'}`}
                     />
                  </div>

                  {/* Content Box */}
                  <div className="w-full md:w-1/2 flex flex-col">
                    <div className={`p-6 border relative transition-colors ${
                       isEvent ? "bg-navy text-cream border-navy shadow-lg" : 
                       isStory ? "bg-blue-electric border-blue-electric text-white shadow-xl" : 
                       "bg-white border-navy/10 hover:border-navy/30 shadow-sm"
                    }`}>
                       {/* Arrow indicator */}
                       <div className={`hidden md:block absolute top-4 w-4 h-4 rotate-45 border-b border-l 
                          ${alignsRight ? "-left-[8px] bg-white border-navy/10 border-t-0 border-r-0" : "-right-[8px] bg-white border-navy/10 border-b-0 border-l-0"}
                          ${isEvent && alignsRight ? "bg-navy border-navy" : isEvent && !alignsRight ? "bg-navy border-navy" : ""}
                          ${isStory && alignsRight ? "bg-blue-electric border-blue-electric" : isStory && !alignsRight ? "bg-blue-electric border-blue-electric" : ""}
                       `} />

                       <div className="flex items-center gap-3 mb-2">
                         <span className="font-display text-2xl tracking-wide opacity-90">{item.time}</span>
                         {item.languageCode && (
                           <span className="font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-navy/5 text-navy border border-navy/10">
                             {item.languageCode}
                           </span>
                         )}
                         <span className="ml-auto font-mono text-[10px] uppercase font-bold tracking-widest opacity-50">
                           {isEvent ? "Événement" : isStory ? "Histoire" : "Observation"}
                         </span>
                       </div>

                       <h4 className="font-mono text-sm uppercase font-bold tracking-widest mb-3 leading-snug">
                         {item.title}
                       </h4>
                       <p className={`font-sans text-sm font-light leading-relaxed opacity-80`}>
                         {item.description}
                       </p>
                    </div>
                  </div>

                  {/* Empty side for layout push */}
                  <div className="hidden md:block w-1/2" />
                </motion.div>
              );
            })}
          </div>
          
          <div className="mt-16 text-center font-mono text-xs uppercase text-navy/40 tracking-widest border border-navy/10 p-4 max-w-sm mx-auto">
            Observation effectuée après l'événement du match.
            <br className="mt-2" />
            Ne signifie pas causalité.
          </div>
        </div>
      </div>
    </section>
  );
}
