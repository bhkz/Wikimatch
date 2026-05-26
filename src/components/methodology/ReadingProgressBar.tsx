import { motion, useScroll } from "motion/react";

export default function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-electric z-[100]"
      style={{ scaleX: scrollYProgress, transformOrigin: "0% 50%" }}
    />
  );
}
