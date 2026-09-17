"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/* A hairline of brass across the very top that fills as you read down the page */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60] pointer-events-none bg-gradient-to-r from-[#c9a24a] via-[#e6c56d] to-[#c9a24a]"
    />
  );
}
