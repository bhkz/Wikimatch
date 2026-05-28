import { motion } from "motion/react";

const steps = [
  {
    num: "01",
    title: "UN FAIT ENTRE",
    text: "Un but, une qualification ou un record apparaît dans une ou plusieurs éditions de Wikipédia.",
    visual: (
      <div className="flex items-center gap-2 mt-6 h-12">
        <span className="w-8 font-mono text-xs">EN</span>
        <div className="h-1 bg-navy flex-grow relative overflow-hidden">
          <motion.div 
             animate={{ x: ["-100%", "200%"] }} 
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
             className="absolute top-0 bottom-0 w-1/3 bg-blue-electric" 
          />
        </div>
      </div>
    )
  },
  {
    num: "02",
    title: "LES VERSIONS DIFFÈRENT",
    text: "Plusieurs éditions linguistiques peuvent retenir des éléments différents du même événement.",
    visual: (
      <div className="flex items-end justify-between gap-2 mt-6 h-12 w-3/4">
        {["EN", "FR", "ES"].map((l, i) => (
          <div key={l} className="flex flex-col items-center gap-2 flex-1">
             <motion.div 
               animate={{ height: i === 1 ? "12px" : "32px", opacity: i === 1 ? 0.3 : 1 }}
               className="w-full bg-navy"
             />
             <span className="font-mono text-[10px]">{l}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    num: "03",
    title: "UNE PAGE HÉSITE",
    text: "Sur un même article, une phrase peut être ajoutée, supprimée puis restaurée : c’est une instabilité éditoriale observable.",
    visual: (
      <div className="flex flex-col gap-2 mt-6 h-12 overflow-hidden justify-center items-start">
        <motion.div 
          animate={{ opacity: [1, 0, 1] }} 
          transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.5, 1] }}
          className="h-2 w-full max-w-[80%] bg-navy rounded-sm"
        />
        <motion.div 
          animate={{ opacity: [0, 1, 0], textDecoration: "line-through" }} 
          transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.5, 1] }}
          className="h-2 w-full max-w-[60%] bg-red-signal rounded-sm absolute"
        />
      </div>
    )
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-4 md:px-8 bg-cream border-b border-navy/10 overflow-hidden">
      <div className="w-full max-w-screen-2xl mx-auto flex flex-col gap-16">
        <h2 className="font-display text-4xl sm:text-5xl uppercase text-navy">
          TROIS MANIÈRES DE VOIR L’HISTOIRE S’ÉCRIRE
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-12 relative group h-full">
          {/* Connecting line desktop */}
          <div className="hidden md:block absolute top-[28px] left-8 right-8 h-[1px] bg-navy/10 z-0" />

          {steps.map((step, index) => (
            <motion.div 
              key={step.num}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 bg-cream-dark p-6 md:p-8 flex flex-col gap-6 md:hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="font-display text-5xl text-blue-electric h-12 flex items-center">
                {step.num}
              </div>
              <div className="flex flex-col gap-3 flex-grow">
                <h3 className="font-mono text-sm md:text-base font-bold uppercase tracking-widest text-navy">
                  {step.title}
                </h3>
                <p className="font-sans text-sm md:text-base text-navy/70 leading-relaxed font-light">
                  {step.text}
                </p>
              </div>
              {step.visual}
            </motion.div>
          ))}
        </div>

        <div className="mx-auto max-w-2xl text-center bg-white border border-navy/10 p-6 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-navy/60 leading-relaxed">
            Une édition linguistique n’est pas un pays.<br/>
            WikiMatch compare des articles Wikipédia, jamais les opinions de populations.
          </p>
        </div>
      </div>
    </section>
  );
}
