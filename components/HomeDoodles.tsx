"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useIntroReady } from "./HomeIntro";

/* Hand-drawn doodles behind the home page. Positioned in viewport terms so they scale with
   the screen, thinned out on phones, sketched on with a stroke animation, and drifting
   slowly at different speeds as the page scrolls. */

type Shape = { d: string; dash?: string; fill?: boolean; className?: string };
type Doodle = { className: string; shapes: Shape[]; circles?: [number, number, number][]; speed: number; delay: number; mobile?: boolean; width?: number };

const DOODLES: Doodle[] = [
  { className: "top-[14vh] left-[22vw] w-[clamp(3.5rem,6vw,6rem)] -rotate-12", speed: 0.3, delay: 0.2,
    shapes: [{ d: "M10,50 Q25,10 40,50 T70,50 T95,30" }] },
  { className: "top-[70vh] right-[3vw] md:top-[22vh] md:right-[2vw] w-[clamp(2.5rem,4vw,4rem)] rotate-12", speed: 0.5, delay: 0.5, mobile: true,
    shapes: [{ d: "M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z" }, { d: "M20,20 L25,30 L35,35 L25,40 L20,50 L15,40 L5,35 L15,30 Z", className: "scale-50 origin-center translate-x-8 -translate-y-8" }] },
  { className: "top-[72vh] left-[40vw] w-[clamp(3rem,5vw,5rem)] -rotate-12 opacity-80", speed: 0.4, delay: 0.9,
    shapes: [{ d: "M50,85 C50,85 15,55 15,35 C15,20 30,15 40,25 C50,35 50,35 50,35 C50,35 50,35 60,25 C70,15 85,20 85,35 C85,55 50,85 50,85 Z" }] },
  { className: "top-[30%] right-[30%] w-[clamp(3rem,5vw,5rem)] rotate-[15deg] opacity-70", speed: 0.6, delay: 1.1,
    shapes: [{ d: "M20,35 h60 a5,5 0 0 1 5,5 v35 a5,5 0 0 1 -5,5 h-60 a5,5 0 0 1 -5,-5 v-35 a5,5 0 0 1 5,-5 Z" }, { d: "M35,35 L40,25 L60,25 L65,35" }], circles: [[50, 57, 12]] },
  { className: "top-[65%] left-[20%] w-[clamp(3.5rem,6vw,6rem)] -rotate-[10deg] opacity-60", speed: 0.35, delay: 1.3,
    shapes: [{ d: "M20,15 h60 v70 h-60 Z" }, { d: "M28,23 h44 v44 h-44 Z" }, { d: "M28,60 L45,45 L55,55 L65,45 L72,55" }] },
  { className: "top-[75%] right-[5%] w-[clamp(4rem,7vw,7rem)] rotate-[5deg] opacity-80", speed: 0.5, delay: 0.7, mobile: true,
    shapes: [{ d: "M50,20 C35,20 25,30 25,45 C25,65 50,90 50,90 C50,90 75,65 75,45 C75,30 65,20 50,20 Z" }, { d: "M10,90 Q30,70 50,90 T90,80", dash: "4 4" }], circles: [[50, 42, 8]] },
  { className: "top-[55%] right-[2%] w-[clamp(3rem,5vw,5rem)] -rotate-[20deg] opacity-60", speed: 0.45, delay: 1.5,
    shapes: [{ d: "M15,30 h70 a3,3 0 0 1 3,3 v39 a3,3 0 0 1 -3,3 h-70 a3,3 0 0 1 -3,-3 v-39 a3,3 0 0 1 3,-3 Z" }, { d: "M15,30 L50,55 L85,30" }] },
  { className: "top-[20%] left-[45%] w-[clamp(2.5rem,4vw,4rem)] rotate-[10deg] opacity-50", speed: 0.7, delay: 0.4,
    shapes: [{ d: "M30,70 L30,20 L80,10 L80,60" }, { d: "M30,35 L80,25" }], circles: [[20, 70, 10], [70, 60, 10]] },
  { className: "top-[45%] left-[10%] w-[clamp(3rem,5vw,5rem)] -rotate-6 opacity-60", speed: 0.4, delay: 1.7,
    shapes: [{ d: "M20,30 L70,30 L65,70 C65,80 55,85 45,85 C35,85 25,80 25,70 Z" }, { d: "M70,40 C85,40 85,60 70,60" }, { d: "M35,20 C35,10 45,15 45,5" }, { d: "M55,20 C55,10 65,15 65,5" }] },
  { className: "top-[50%] right-[15%] w-[clamp(3.5rem,6vw,6rem)] rotate-[25deg] opacity-70", speed: 0.55, delay: 1.0, mobile: true,
    shapes: [{ d: "M10,50 L90,10 L50,90 L40,60 Z" }, { d: "M90,10 L40,60 L30,80" }, { d: "M10,80 Q20,70 30,80 T50,70", dash: "3 3" }] },
  { className: "top-[85%] left-[45%] w-[clamp(4rem,7vw,7rem)] -rotate-[15deg] opacity-60", speed: 0.3, delay: 1.9,
    shapes: [{ d: "M20,80 Q50,50 80,20" }, { d: "M40,60 C40,40 20,40 20,60 C20,80 40,80 40,60 Z" }, { d: "M60,40 C60,20 40,20 40,40 C40,60 60,60 60,40 Z" }, { d: "M50,70 C50,50 30,50 30,70 C30,90 50,90 50,70 Z" }, { d: "M70,50 C70,30 50,30 50,50 C50,70 70,70 70,50 Z" }] },
  { className: "top-[10%] left-[60%] w-[clamp(2.5rem,4vw,4rem)] rotate-[5deg] opacity-50", speed: 0.65, delay: 0.6,
    shapes: [{ d: "M30,10 L70,10 L70,20 L55,45 L70,70 L70,80 L30,80 L30,70 L45,45 L30,20 Z" }, { d: "M35,20 L65,20" }, { d: "M35,70 L65,70" }, { d: "M45,45 L50,80", dash: "2 2" }] },
  { className: "top-[40%] left-[55%] w-[clamp(3.5rem,6vw,6rem)] -rotate-[8deg] opacity-50", speed: 0.5, delay: 1.4,
    shapes: [{ d: "M20,30 L80,30 L80,70 L20,70 Z" }, { d: "M20,45 C30,45 30,55 20,55" }, { d: "M80,45 C70,45 70,55 80,55" }, { d: "M40,30 L40,70", dash: "4 4" }], circles: [[30, 50, 3], [50, 50, 3], [70, 50, 3]] },
  { className: "bottom-[10%] left-[3%] w-[clamp(4rem,8vw,8rem)] -rotate-6", speed: 0.35, delay: 2.0, width: 3,
    shapes: [{ d: "M10,50 C30,20 70,80 90,50", dash: "10 15" }] },
];

function Doodle({ doodle, reduce, ready }: { doodle: Doodle; reduce: boolean | null; ready: boolean }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 2400], [0, reduce ? 0 : -260 * doodle.speed]);
  return (
    <motion.div style={{ y }} className={`absolute text-[#cbb59c] ${doodle.className} ${doodle.mobile ? "" : "hidden md:block"}`}>
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={doodle.width ?? 2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-auto">
        {doodle.shapes.map((s, i) =>
          s.dash || reduce ? (
            <motion.path key={i} d={s.d} strokeDasharray={s.dash} className={s.className} initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : undefined} transition={{ duration: 0.8, delay: doodle.delay + i * 0.2 }} />
          ) : (
            <motion.path key={i} d={s.d} className={s.className} initial={{ pathLength: 0, opacity: 0 }} animate={ready ? { pathLength: 1, opacity: 1 } : undefined} transition={{ pathLength: { duration: 1.4, delay: doodle.delay + i * 0.25, ease: "easeInOut" }, opacity: { duration: 0.3, delay: doodle.delay + i * 0.25 } }} />
          ),
        )}
        {doodle.circles?.map(([cx, cy, r], i) => (
          <motion.circle key={`c${i}`} cx={cx} cy={cy} r={r} fill={r <= 3 || r >= 10 ? "currentColor" : "none"} opacity={r >= 10 ? 1 : undefined} initial={{ opacity: 0 }} animate={ready ? { opacity: r <= 3 ? 0.5 : 1 } : undefined} transition={{ duration: 0.6, delay: doodle.delay + 1.2 + i * 0.15 }} />
        ))}
      </svg>
    </motion.div>
  );
}

export default function HomeDoodles() {
  const reduce = useReducedMotion();
  const ready = useIntroReady();
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {DOODLES.map((d, i) => <Doodle key={i} doodle={d} reduce={reduce} ready={ready} />)}
    </div>
  );
}
