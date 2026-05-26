import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import SectionLabel from "../SectionLabel";
import type { MethodologyFAQItem } from "../../types";

export default function MethodologyFAQ({
  methodologyFaq,
}: {
  methodologyFaq: MethodologyFAQItem[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-24 px-4 md:px-8 bg-white border-b border-navy/10 min-h-screen flex flex-col justify-center">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        <div className="lg:w-1/3 flex flex-col gap-6 sticky top-[160px] self-start">
          <SectionLabel label="13 — FAQ" />
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-navy leading-tight">
            QUESTIONS
            <br />
            LÉGITIMES.
            <br />
            RÉPONSES
            <br />
            CLAIRES.
          </h2>
        </div>

        <div className="lg:w-2/3 flex flex-col">
          {methodologyFaq.map((item) => (
            <div
              key={item.id}
              className="border-b border-navy/10 overflow-hidden"
            >
              <button
                onClick={() => toggleOpen(item.id)}
                aria-expanded={openId === item.id}
                className="w-full py-6 flex justify-between items-center text-left hover:bg-cream/50 transition-colors px-2 md:px-4"
              >
                <span className="font-sans text-xl font-bold text-navy pr-8">
                  {item.question}
                </span>
                <span
                  className={`text-2xl text-blue-electric transition-transform duration-300 ${openId === item.id ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
              <AnimatePresence>
                {openId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 md:px-4 pb-6"
                  >
                    <p className="font-sans text-lg text-navy/70 leading-relaxed font-light">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
