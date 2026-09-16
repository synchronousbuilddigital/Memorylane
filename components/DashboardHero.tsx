"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE } from "./motion/Reveal";
import { useIntroReady } from "./HomeIntro";

/* The polaroid composition is laid out once at a fixed design size and then scaled to
   whatever width it gets, so it holds together from a phone to a 4K screen. */
const STAGE_W = 640, STAGE_H = 560;

function useFitScale(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / designWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);
  return { ref, scale };
}

const HEADLINE = ["Your", "Memory", "Lanes"];

export default function DashboardHero({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const reduce = useReducedMotion();
  const ready = useIntroReady();      // the intro curtain has lifted (or there was none)
  const { ref, scale } = useFitScale(STAGE_W);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: reduce ? 0.25 : 0.7, delay, ease: EASE },
  });

  // A polaroid drops onto the desk and settles into its tilt
  const drop = (rot: number, delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : -90, rotate: reduce ? rot : rot - 10, scale: reduce ? 1 : 0.92 },
    animate: ready ? { opacity: 1, y: 0, rotate: rot, scale: 1 } : undefined,
    transition: reduce ? { duration: 0.3, delay } : { type: "spring" as const, stiffness: 110, damping: 15, mass: 1.1, delay },
    whileHover: reduce ? undefined : { y: -14, rotate: rot * 0.5, transition: { duration: 0.5, ease: EASE } },
  });

  void isLoggedIn;
  return (
    <section className="relative w-full pt-4 md:pt-12 pb-12 md:pb-24 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
      {/* Left: typography & CTA */}
      <div className="flex-1 w-full flex flex-col items-start z-10">
        <motion.span {...rise(0.05)} className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#8a755b] mb-4 md:mb-6">
          Welcome Back
        </motion.span>

        <h1 className="font-serif text-[clamp(3.4rem,10vw,7rem)] font-bold text-[#1c1917] leading-[0.9] tracking-tighter flex flex-col mb-5 md:mb-6">
          {HEADLINE.map((word, i) => (
            <span key={word} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
              <motion.span
                className="block"
                initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 0 : 1 }}
                animate={ready ? { y: 0, opacity: 1 } : undefined}
                transition={{ duration: reduce ? 0.25 : 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p {...rise(0.6)} className="font-handwriting text-[clamp(1.7rem,4.5vw,3rem)] text-[#2c241b] mb-6 md:mb-8 mt-1 -rotate-2 leading-tight">
          Collect moments. Relive emotions.<br />Forever yours.
        </motion.p>

        <motion.p {...rise(0.75)} className="text-[#5a4d41] text-[15px] md:text-base leading-relaxed max-w-md font-medium mb-8 md:mb-10">
          Turn your photos into beautiful stories with cinematic slideshows, interactive maps, and so much more.
        </motion.p>

        <motion.div {...rise(0.9)}>
          <Link
            href="#create"
            className="group relative overflow-hidden inline-flex items-center gap-3 bg-[#1c1917] hover:bg-[#3d3329] text-white px-7 md:px-8 py-4 rounded-full font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          >
            <span className="relative z-10">Start a New Memory Lane</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            {/* one shine sweep after the button lands */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]"
                initial={{ x: "-150%" }}
                animate={ready ? { x: "400%" } : undefined}
                transition={{ duration: 1.1, delay: 1.6, ease: "easeInOut" }}
              />
            )}
          </Link>
        </motion.div>
      </div>

      {/* Right: the polaroid stage, scaled to fit */}
      <div ref={ref} className="flex-1 w-full flex justify-center lg:justify-end">
        <div style={{ width: STAGE_W * scale, height: STAGE_H * scale }} className="relative">
          <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }} className="absolute top-0 left-0">

            {/* glow behind the pile */}
            <div className="absolute left-[170px] top-[130px] w-[300px] h-[300px] bg-[#d9cbb8]/30 blur-[100px] rounded-full" />

            {/* floral smudge */}
            <div className="absolute top-[300px] left-[30px] w-24 h-32 opacity-80 mix-blend-multiply rotate-[-15deg] z-0">
              <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/floral-pattern.png')] opacity-30 rounded-full blur-[2px]" />
            </div>

            {/* Polaroid 1 (back-left) */}
            <motion.div {...drop(-12, 0.35)} className="absolute left-0 top-[110px] w-[272px] bg-[#fdfbf7] p-4 pb-16 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm z-10 cursor-pointer">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-200">
                <Image src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800" alt="Family" fill sizes="272px" className="object-cover" />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-handwriting text-2xl text-[#2c241b]/80 whitespace-nowrap -rotate-2">Good Memories</div>
            </motion.div>

            {/* Polaroid 2 (front-centre) */}
            <motion.div {...drop(3, 0.55)} className="absolute left-[170px] top-[40px] w-[320px] bg-[#fdfbf7] p-4 pb-20 shadow-[0_30px_60px_rgba(0,0,0,0.2)] rounded-sm z-30 cursor-pointer">
              <motion.div
                initial={{ opacity: 0, scale: 1.3 }} animate={ready ? { opacity: 1, scale: 1 } : undefined} transition={{ delay: 1.05, duration: 0.35, ease: EASE }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/40 backdrop-blur-md rotate-2 shadow-sm border border-white/20 z-10"
              />
              <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
                <Image src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800" alt="Travel" fill sizes="320px" priority className="object-cover" />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-handwriting text-3xl text-[#2c241b]/90 whitespace-nowrap -rotate-3">Just Moments ♡</div>
            </motion.div>

            {/* Polaroid 3 (right) */}
            <motion.div {...drop(12, 0.75)} className="absolute left-[400px] top-[80px] w-[256px] bg-[#fdfbf7] p-4 pb-16 shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-sm z-20 cursor-pointer">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-200">
                <Image src="https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&q=80&w=800" alt="Landscape" fill sizes="256px" className="object-cover" />
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-handwriting text-2xl text-[#2c241b]/80 whitespace-nowrap text-center leading-tight">Same People<br />Brighter Days</div>
            </motion.div>

            {/* Torn-paper note */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 30, rotate: 10 }} animate={ready ? { opacity: 1, y: 0, rotate: 10 } : undefined} transition={{ delay: 1.0, duration: reduce ? 0.25 : 0.7, ease: EASE }}
              className="absolute left-[500px] top-[380px] w-32 h-40 bg-[#f4ebd8] shadow-sm border border-[#e5d5be] p-4 flex flex-col justify-center items-center z-40 pointer-events-none"
            >
              <div className="font-handwriting text-[#5a4d41] text-xl leading-snug text-center -rotate-[5deg]">New<br />Stories<br />Await ♡</div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
