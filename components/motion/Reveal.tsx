"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Fades and rises a block into view as it scrolls in (a plain fade when the user prefers reduced motion) */
export function Reveal({
  children, delay = 0, y = 28, className, once = true, amount = 0.2, id,
}: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean; amount?: number; id?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: reduce ? 0.25 : 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Variants for a grid whose children appear one after another */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const staggerChild = (reduce: boolean | null): Variants => ({
  hidden: { opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: reduce ? 0.25 : 0.6, ease: EASE } },
});
