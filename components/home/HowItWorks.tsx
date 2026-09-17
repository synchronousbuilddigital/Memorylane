"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LayoutTemplate, ImagePlus, Share2 } from "lucide-react";
import { EASE } from "../motion/Reveal";

/* Three steps joined by a hand-drawn dashed path that draws itself as the row scrolls in */
const STEPS = [
  { n: "1", Icon: LayoutTemplate, title: "Pick a template", body: "Family, travel, a birthday, the whole clan — each one is a different world." },
  { n: "2", Icon: ImagePlus, title: "Fill the slots", body: "Drop your photos into each scene. Write the captions in your own words." },
  { n: "3", Icon: Share2, title: "Share one link", body: "Send it to everyone. They scroll through it like a film, on any phone." },
];

export default function HowItWorks() {
  const reduce = !!useReducedMotion();
  return (
    <section id="how" className="scroll-mt-28 relative">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.5 }} className="text-center mb-10 md:mb-14">
        <motion.span variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }} className="block text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a755b] mb-3">How it works</motion.span>
        <h2 className="font-serif font-black text-[#1c1917] tracking-tight" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
          <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
            <motion.span className="block" variants={{ hidden: { y: reduce ? 0 : "105%" }, show: { y: 0, transition: { duration: reduce ? 0.2 : 0.8, ease: EASE } } }}>Three steps. One link.</motion.span>
          </span>
        </h2>
      </motion.div>

      <div className="relative">
        {/* a dashed thread from badge to badge, drawing itself as the row arrives */}
        <svg aria-hidden viewBox="0 0 1200 120" preserveAspectRatio="none" className="hidden md:block absolute left-0 right-0 -top-[60px] w-full h-[120px] pointer-events-none">
          <motion.path
            d="M200 60 C 330 38, 470 82, 600 60 S 870 38, 1000 60"
            fill="none" stroke="#c9a24a" strokeWidth="2" strokeDasharray="7 9" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 0.7 }} viewport={{ once: false, amount: 0.6 }}
            transition={{ pathLength: { duration: reduce ? 0.2 : 1.6, ease: "easeInOut", delay: 0.4 }, opacity: { duration: 0.3, delay: 0.4 } }}
          />
        </svg>
        {/* Mobile Auto-Scrolling Marquee */}
        <div className="md:hidden overflow-hidden relative pb-10 pt-6 -mx-4 px-4 w-[calc(100%+2rem)]">
          <motion.div
            className="flex w-max gap-4 relative"
            animate={reduce ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            {/* The traveling dashed line connecting all mobile steps */}
            <svg aria-hidden className="absolute top-0 left-[140px] right-[140px] h-[2px] w-[calc(100%-280px)] z-[-1] overflow-visible">
              <motion.line
                x1="0" y1="0" x2="100%" y2="0"
                stroke="#c9a24a" strokeWidth="2" strokeDasharray="6 8"
                animate={reduce ? undefined : { strokeDashoffset: [0, -14] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="opacity-50"
              />
            </svg>

            {[...STEPS, ...STEPS].map((s, i) => (
              <div
                key={`${s.n}-${i}`}
                className="relative bg-gradient-to-b from-[#ffffff] to-[#fdfbf7] border border-[#e8e0d5] shadow-[0_14px_30px_rgba(28,25,23,0.06)] rounded-[1.5rem] p-7 text-center shrink-0 w-[280px]"
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1c1917] text-[#e6c56d] font-serif font-black text-base flex items-center justify-center shadow-lg ring-4 ring-[#f8f6f3]">
                  {s.n}
                </span>
                <span className="mx-auto mt-3 w-14 h-14 rounded-2xl bg-[#f4eee6] shadow-inner flex items-center justify-center text-[#8a6a1e]">
                  <s.Icon size={22} />
                </span>
                <h3 className="font-serif font-bold text-[#1c1917] text-xl mt-5">{s.title}</h3>
                <p className="text-sm text-[#5a4d41] leading-relaxed mt-2">{s.body}</p>
              </div>
            ))}
          </motion.div>
          {/* Faded edges to make the marquee look seamless */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#f8f6f3] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#f8f6f3] to-transparent pointer-events-none" />
        </div>

        {/* Desktop Grid */}
        <ol className="hidden md:grid relative md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.3 }}
              variants={{ hidden: { opacity: 0, y: reduce ? 0 : 26 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.7, delay: 0.15 + i * 0.18, ease: EASE } } }}
              className="relative bg-[#fdfbf7] border border-[#e8e0d5] rounded-[1.5rem] p-8 text-center"
            >
              <motion.span
                variants={{ hidden: { scale: reduce ? 1 : 0, rotate: reduce ? 0 : -90 }, show: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 18, delay: 0.35 + i * 0.18 } } }}
                className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#1c1917] text-[#e6c56d] font-serif font-black text-base flex items-center justify-center shadow-[0_10px_24px_rgba(28,25,23,0.25)] ring-4 ring-[#f8f6f3]"
              >
                {s.n}
              </motion.span>
              <span className="mx-auto mt-3 w-14 h-14 rounded-2xl bg-[#f4eee6] flex items-center justify-center text-[#8a6a1e]">
                <s.Icon size={22} />
              </span>
              <h3 className="font-serif font-bold text-[#1c1917] text-xl mt-5">{s.title}</h3>
              <p className="text-sm text-[#5a4d41] leading-relaxed mt-2 max-w-xs mx-auto">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
