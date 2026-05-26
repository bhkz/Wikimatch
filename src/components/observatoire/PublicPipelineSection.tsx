import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ObservatoryPipelineStep } from "../../types";

export default function PublicPipelineSection({ steps }: { steps: ObservatoryPipelineStep[] }) {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 relative">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide text-navy leading-[0.9]">
            DE LA MODIFICATION<br/><span className="text-navy/40">À L'HISTOIRE PUBLIÉE</span>
          </h2>
          <p className="font-sans text-xl text-navy/70 leading-relaxed font-light max-w-2xl mx-auto md:mx-0">
            Toutes les traces peuvent être observées.<br/>Seules certaines deviennent des récits publics.
          </p>
        </div>

        {/* Desktop Pipeline Pipeline */}
        <div className="hidden lg:flex relative mt-16 pb-12 w-full max-w-6xl mx-auto">
           <div className="absolute top-[20px] left-0 right-0 h-[1px] bg-navy/20" />
           
           <div className="flex w-full justify-between items-start z-10 gap-4">
              {steps.map((step, i) => (
                 <motion.div 
                   key={step.id}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                   className={`flex flex-col flex-1 relative`}
                 >
                    <div className="w-10 h-10 rounded-full border border-navy/20 bg-white flex items-center justify-center font-mono text-[10px] font-bold text-navy mb-8 mx-auto -mt-[19px]">
                      0{i + 1}
                    </div>
                    
                    <div className="flex flex-col text-center px-2">
                       <h4 className="font-mono text-xs uppercase font-bold tracking-widest text-navy mb-3 h-10 flex items-center justify-center">{step.label}</h4>
                       <p className="font-sans text-xs text-navy/70 font-light leading-relaxed min-h-[60px]">
                         {step.publicDescription}
                       </p>
                       <div className="mt-4 font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-1 mx-auto w-fit">
                          {getStatusBadge(step.publicStatus)}
                       </div>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>

        {/* Mobile Vertical Pipeline */}
        <div className="flex lg:hidden flex-col gap-8 relative pl-6">
           <div className="absolute top-0 bottom-0 left-[27px] w-[1px] bg-navy/20" />
           
           {steps.map((step, i) => (
              <motion.div 
                 key={step.id}
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="flex flex-col relative"
              >
                 <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full border border-navy/20 bg-white flex items-center justify-center font-mono text-[10px] font-bold text-navy z-10">
                   0{i + 1}
                 </div>
                 
                 <div className="bg-white p-6 border border-navy/10 shadow-sm ml-4 flex flex-col gap-2">
                    <h4 className="font-mono text-xs uppercase font-bold tracking-widest text-navy">{step.label}</h4>
                    <p className="font-sans text-sm text-navy/70 font-light leading-relaxed">
                      {step.publicDescription}
                    </p>
                    <div className="mt-2 font-mono text-[9px] uppercase font-bold tracking-widest w-fit">
                      {getStatusBadge(step.publicStatus)}
                    </div>
                 </div>
              </motion.div>
           ))}
        </div>

        <div className="flex justify-center mt-8">
           <Link to="/stories" className="bg-navy text-white px-8 py-4 font-bold uppercase font-mono tracking-widest text-[10px] hover:bg-blue-electric transition-colors w-full md:w-auto text-center shadow-md">
             Voir les histoires publiées
           </Link>
        </div>

      </div>
    </section>
  );
}

function getStatusBadge(status: 'shown_here' | 'published_elsewhere' | 'private_later') {
  switch (status) {
    case 'shown_here':
      return <span className="text-navy bg-navy/5 px-2 py-1">Visible ici</span>;
    case 'published_elsewhere':
      return <span className="text-blue-electric border border-blue-electric/20 px-2 py-1">Magazine public</span>;
    case 'private_later':
      return <span className="text-navy/40 border border-navy/10 px-2 py-1">Non exposé publiquement</span>;
  }
}
