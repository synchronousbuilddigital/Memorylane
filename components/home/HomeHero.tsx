"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { EASE } from "../motion/Reveal";
import { useIntroReady } from "../HomeIntro";

/* ────────────────────────────────────────────────────────────────────────────
   The hero: a headline that rises out of a mask, a marker line that draws
   itself under "Memory", a magnetic button, and a pile of polaroids that
   parallax with the cursor and shuffle to the front when clicked. The whole
   thing drifts and fades as you scroll into the page.
   ──────────────────────────────────────────────────────────────────────────── */

const STAGE_W = 640, STAGE_H = 560;
const HEADLINE = ["Your", "Memory", "Lanes"];

type Card = { id: string; src: string; alt: string; caption: string; rot: number; left: number; top: number; w: number; aspect: string; depth: number; tape?: boolean };
const CARDS: Card[] = [
  { id: "family", src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800", alt: "Family", caption: "Good Memories", rot: -12, left: 0, top: 110, w: 272, aspect: "aspect-[3/4]", depth: 0.55 },
  { id: "travel", src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800", alt: "Travel", caption: "Just Moments ♡", rot: 3, left: 170, top: 40, w: 320, aspect: "aspect-square", depth: 1, tape: true },
  { id: "sky", src: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&q=80&w=800", alt: "Landscape", caption: "Brighter Days", rot: 12, left: 400, top: 80, w: 256, aspect: "aspect-[4/5]", depth: 0.8 },
];

function useFitScale(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / designWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);
  return { ref, scale };
}

/* One print: entrance drop → cursor parallax → idle float, each on its own layer */
function Polaroid({ card, z, delay, ready, reduce, px, py, onFront }: {
  card: Card; z: number; delay: number; ready: boolean; reduce: boolean; px: MotionValue<number>; py: MotionValue<number>; onFront: () => void;
}) {
  const x = useTransform(px, (v) => v * 18 * card.depth);
  const y = useTransform(py, (v) => v * 12 * card.depth);
  return (
    <motion.div
      style={{ left: card.left, top: card.top, width: card.w, zIndex: z }}
      className="absolute"
      initial={{ opacity: 0, y: reduce ? 0 : -90, rotate: reduce ? card.rot : card.rot - 10, scale: reduce ? 1 : 0.92 }}
      animate={ready ? { opacity: 1, y: 0, rotate: card.rot, scale: 1 } : undefined}
      transition={reduce ? { duration: 0.3, delay } : { type: "spring", stiffness: 110, damping: 15, mass: 1.1, delay }}
      whileHover={reduce ? undefined : { rotate: card.rot * 0.4, y: -12, transition: { duration: 0.5, ease: EASE } }}
      whileTap={{ scale: 0.98 }}
      onClick={onFront}
    >
      <motion.div style={{ x, y }}>
        <motion.div
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 5 + card.depth * 2, repeat: Infinity, ease: "easeInOut", delay: card.depth }}
          className="relative bg-[#fdfbf7] p-4 pb-16 shadow-[0_24px_54px_rgba(28,25,23,0.18)] rounded-sm cursor-pointer select-none"
        >
          {card.tape && (
            <motion.div
              initial={{ opacity: 0, scale: 1.3 }} animate={ready ? { opacity: 1, scale: 1 } : undefined} transition={{ delay: delay + 0.5, duration: 0.35, ease: EASE }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-[#f4ead5]/85 backdrop-blur-md rotate-2 shadow-sm border border-white/30 z-10"
            />
          )}
          <div className={`relative ${card.aspect} w-full overflow-hidden bg-gray-200`}>
            <Image src={card.src} alt={card.alt} fill sizes={`${card.w}px`} priority={card.tape} className="object-cover" draggable={false} />
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-handwriting text-[1.7rem] text-[#2c241b]/85 whitespace-nowrap -rotate-2">{card.caption}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* A button that leans toward the cursor */
function MagneticLink({ href, children }: { href: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18 }), y = useSpring(my, { stiffness: 220, damping: 18 });
  const onMove = (e: MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.22);
  };
  return (
    <motion.div ref={ref} style={{ x, y }} onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }} className="inline-block">
      <Link
        href={href}
        className="group relative overflow-hidden inline-flex items-center gap-3 bg-[#1c1917] hover:bg-[#3d3329] text-white px-7 md:px-8 py-4 rounded-full font-medium transition-colors duration-300 shadow-[0_14px_34px_rgba(28,25,23,0.22)]"
      >
        <span className="relative z-10">{children}</span>
        <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
        {!reduce && (
          <motion.span aria-hidden className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" initial={{ x: "-150%" }} animate={{ x: "400%" }} transition={{ duration: 1.1, delay: 1.8, ease: "easeInOut" }} />
        )}
      </Link>
    </motion.div>
  );
}

export default function HomeHero({ templateCount, sceneCount }: { templateCount: number; sceneCount: number }) {
  const reduce = !!useReducedMotion();
  const ready = useIntroReady();
  const { ref: stageWrap, scale } = useFitScale(STAGE_W);
  const heroRef = useRef<HTMLElement>(null);

  // cursor parallax across the whole hero, springs so it glides
  const rawX = useMotionValue(0), rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 60, damping: 20 }), py = useSpring(rawY, { stiffness: 60, damping: 20 });
  const onMove = (e: MouseEvent) => {
    if (reduce || !heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    rawY.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  // scrolling away: words and prints drift up at different rates and fade
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0.15]);

  // click a print to bring it to the front
  const [order, setOrder] = useState(CARDS.map((c) => c.id));
  const toFront = (id: string) => setOrder((o) => [...o.filter((x) => x !== id), id]);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: reduce ? 0.25 : 0.7, delay, ease: EASE },
  });

  return (
    <section ref={heroRef} onMouseMove={onMove} className="relative w-full pt-4 md:pt-10 pb-10 md:pb-16 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8 min-h-[50vh] md:min-h-[78vh]">
      <motion.div style={{ y: textY, opacity: fade }} className="flex-1 w-full flex flex-col items-start z-10">

        <h1 className="font-serif text-[clamp(3.4rem,10vw,7rem)] font-bold text-[#1c1917] leading-[0.9] tracking-tighter flex flex-col mb-5 md:mb-6">
          {HEADLINE.map((word, i) => (
            <span key={word} className="relative block overflow-visible pb-[0.06em] -mb-[0.06em]">
              <span className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 0 : 1 }}
                  animate={ready ? { y: 0, opacity: 1 } : undefined}
                  transition={{ duration: reduce ? 0.25 : 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
                >
                  {word}
                </motion.span>
              </span>
              {word === "Memory" && (
                // a marker stroke that draws itself under the word
                <svg aria-hidden viewBox="0 0 320 24" className="absolute left-0 -bottom-[0.02em] w-[92%] h-[0.22em] pointer-events-none" preserveAspectRatio="none">
                  <motion.path
                    d="M4 16 C 60 6, 120 20, 180 12 S 290 8, 316 14"
                    fill="none" stroke="#c9a24a" strokeWidth="7" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={ready ? { pathLength: 1, opacity: 0.85 } : undefined}
                    transition={{ pathLength: { duration: reduce ? 0.2 : 0.9, delay: 1.0, ease: "easeInOut" }, opacity: { duration: 0.2, delay: 1.0 } }}
                  />
                </svg>
              )}
            </span>
          ))}
        </h1>

        <motion.p {...rise(0.6)} className="font-handwriting text-[clamp(1.7rem,4.5vw,3rem)] text-[#2c241b] mb-6 md:mb-8 mt-2 -rotate-2 leading-tight">
          Collect moments. Relive emotions.<br />Forever yours.
        </motion.p>

        <motion.p {...rise(0.75)} className="text-[#5a4d41] text-[15px] md:text-base leading-relaxed max-w-md font-medium mb-8 md:mb-10">
          Turn your photos into cinematic albums — a suitcase that unlocks, a ferris wheel of memories, a scrapbook that breathes — then share one link.
        </motion.p>

        <motion.div {...rise(0.9)} className="flex flex-wrap items-center gap-4">
          <MagneticLink href="#create">Start a New Memory Lane</MagneticLink>
          <Link href="#templates" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors py-4">
            See the templates <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>

      {/* the polaroid stage, scaled to fit whatever width it gets */}
      <motion.div ref={stageWrap} style={{ y: stageY, opacity: fade }} className="absolute md:relative right-[-20%] md:right-0 top-[2%] md:top-0 w-[85%] md:w-full flex-1 flex justify-end lg:justify-end mt-10 lg:mt-0 pointer-events-none md:pointer-events-auto z-0 md:z-auto">
        <div style={{ width: STAGE_W * scale, height: STAGE_H * scale }} className="relative scale-110 md:scale-100 origin-center pointer-events-auto opacity-25 md:opacity-100 transition-opacity">
          <div style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }} className="absolute top-0 left-0">
            <div className="absolute left-[170px] top-[130px] w-[300px] h-[300px] bg-[#d9cbb8]/30 blur-[100px] rounded-full" />
            {CARDS.map((c, i) => (
              <Polaroid key={c.id} card={c} z={10 + order.indexOf(c.id)} delay={0.35 + i * 0.2} ready={ready} reduce={reduce} px={px} py={py} onFront={() => toFront(c.id)} />
            ))}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 30, rotate: -9 }} animate={ready ? { opacity: 1, y: 0, rotate: -9 } : undefined} transition={{ delay: 1.0, duration: reduce ? 0.25 : 0.7, ease: EASE }}
              className="absolute left-[34px] top-[6px] w-32 h-40 bg-[#f4ebd8] shadow-sm border border-[#e5d5be] p-4 flex flex-col justify-center items-center z-[5] pointer-events-none"
            >
              <div className="font-handwriting text-[#5a4d41] text-xl leading-snug text-center -rotate-[5deg]">New<br />Stories<br />Await ♡</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div {...rise(1.4)} className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-2 flex-col items-center gap-2 text-[#a3907a] pointer-events-none">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Scroll</span>
        <span className="w-[1px] h-9 bg-[#d9cbb8] relative overflow-hidden">
          <motion.span className="absolute left-0 top-0 w-full h-3 bg-[#8a755b]" animate={reduce ? undefined : { y: [-12, 40] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
        </span>
      </motion.div>
    </section>
  );
}
