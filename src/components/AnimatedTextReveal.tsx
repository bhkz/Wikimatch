import { motion } from "motion/react";

export default function AnimatedTextReveal({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="block pb-1"
      >
        {text}
      </motion.span>
    </span>
  );
}
