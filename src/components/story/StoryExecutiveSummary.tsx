import { motion } from "motion/react";
import { PublishedStoryDetail } from "../../types";

export default function StoryExecutiveSummary({ story }: { story: PublishedStoryDetail }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10">
      <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        
        {/* Main Observation */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
          <div className="font-mono text-xs tracking-widest uppercase text-blue-electric font-medium">
            CE QUE NOUS OBSERVONS
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="font-sans text-2xl md:text-3xl lg:text-4xl text-navy leading-snug font-light"
          >
            {story.observedSummary}
          </motion.p>
        </div>

        {/* Side panels (Lecture & Limite) */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-8 pt-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4 border-l-2 border-blue-electric pl-6"
          >
            <h3 className="font-mono text-xs tracking-widest uppercase text-navy/50">LECTURE</h3>
            <p className="font-sans text-lg text-navy/90 leading-relaxed">
              {story.interpretationSummary}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col gap-4 border-l-2 border-navy/20 pl-6 lg:mt-8"
          >
            <h3 className="font-mono text-xs tracking-widest uppercase text-navy/50">LIMITE</h3>
            <p className="font-sans text-base text-navy/70 leading-relaxed font-light">
              {story.limitationSummary}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
