"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue, type Variants } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import type { ShowcaseTemplate } from "@/lib/templatesShowcase";
import { EASE } from "../motion/Reveal";
import { setNavHidden } from "@/lib/navHidden";

/* ────────────────────────────────────────────────────────────────────────────
   Our templates: one full-width chapter per template, sides alternating. The
   real template is shown in a framed print that parallaxes and straightens as
   you scroll past; the words and scene chips stagger in beside it. Dark
   templates get a dark panel, the cream one a paper panel — each panel wears
   its template's own world.

   Every reveal is driven by the panel, not by the element being revealed: a
   masked word or a clipped print has no visible area until it animates, so it
   can never be "in view" on its own. The panel is observed; its children follow.
   ──────────────────────────────────────────────────────────────────────────── */

const mk = (reduce: boolean) => {
  const d = (s: number) => (reduce ? 0.2 : s);
  const v: Record<string, Variants> = {
    panel: { hidden: { opacity: 0, y: reduce ? 0 : 40 }, show: { opacity: 1, y: 0, transition: { duration: d(0.8), ease: EASE } } },
    kicker: { hidden: { opacity: 0, x: reduce ? 0 : -16 }, show: { opacity: 1, x: 0, transition: { duration: d(0.6), delay: 0.1, ease: EASE } } },
    word: { hidden: { y: reduce ? 0 : "105%" }, show: (i: number) => ({ y: 0, transition: { duration: d(0.8), delay: 0.15 + i * 0.1, ease: EASE } }) },
    tagline: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: d(0.6), delay: 0.35 } } },
    body: { hidden: { opacity: 0, y: reduce ? 0 : 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.6), delay: 0.45, ease: EASE } } },
    chip: { hidden: { opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.95 }, show: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: d(0.45), delay: 0.55 + i * 0.08, ease: EASE } }) },
    ctas: { hidden: { opacity: 0, y: reduce ? 0 : 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.6), delay: 0.85, ease: EASE } } },
    print: { hidden: { clipPath: "inset(0% 0% 100% 0%)", scale: reduce ? 1 : 1.06 }, show: { clipPath: "inset(0% 0% 0% 0%)", scale: 1, transition: { duration: d(1.1), delay: 0.2, ease: EASE } } },
    note: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: d(0.7), delay: 0.9 } } },
    line: { hidden: { y: reduce ? 0 : "105%" }, show: (i: number) => ({ y: 0, transition: { duration: d(0.8), delay: i * 0.1, ease: EASE } }) },
    fade: { hidden: { opacity: 0, y: reduce ? 0 : 10 }, show: { opacity: 1, y: 0, transition: { duration: d(0.6), delay: 0.3, ease: EASE } } },
  };
  return v;
};

/* The still is the poster and always renders; the recorded loop of the real template
   fades in on top, and only while the panel is on screen — four animations never run
   at once, and nothing loads until you are near it. Reduced motion keeps the still. */
function LivePreview({ t, dark, play }: { t: ShowcaseTemplate; dark: boolean; play?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: "200px 0px" });
  // in the horizontal stage every slide is technically on screen, so `play` decides instead
  const playing = (play ?? near) && !reduce;
  return (
    <div ref={ref} className="relative aspect-video bg-[#1c1917]">
      <Image src={t.image} alt={`${t.name} template preview`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      {playing && (
        <motion.img
          key={t.loop}
          src={t.loop}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {dark && <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#140a05]/40 via-transparent to-transparent" />}
    </div>
  );
}

function Panel({ t, index }: { t: ShowcaseTemplate; index: number }) {
  const reduce = !!useReducedMotion();
  const V = mk(reduce);
  const ref = useRef<HTMLElement>(null);
  const flip = index % 2 === 1;
  const dark = t.tone === "dark";

  // scroll-linked: the print rises through the panel and un-tilts as it passes centre
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 70, reduce ? 0 : -70]);
  const tilt = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [0, 0, 0] : [flip ? -7 : 7, 0, flip ? 5 : -5]);
  const noteY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 30, reduce ? 0 : -50]);

  const ink = dark ? "text-[#f4eee6]" : "text-[#1c1917]";
  const soft = dark ? "text-[#d9cbb8]/80" : "text-[#5a4d41]";
  const chip = dark ? "bg-white/[0.06] border-white/10 text-[#e6c56d]" : "bg-[#f4eee6] border-[#e8e0d5] text-[#5a4d41]";

  return (
    <motion.section
      ref={ref}
      variants={V.panel}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.2 }}
      className={`relative overflow-hidden rounded-[1.75rem] md:rounded-[2.5rem] ${dark ? "bg-[#140a05]" : "bg-[#fdfbf7] border border-[#e8e0d5]"} px-6 sm:px-10 md:px-14 lg:px-16 py-12 md:py-16 lg:py-20`}
      style={{ perspective: 1400 }}
    >
      {/* the chapter numeral, set huge and faint behind everything */}
      <span aria-hidden className={`absolute -top-6 md:-top-10 ${flip ? "right-6 md:right-10" : "left-6 md:left-10"} font-serif font-black text-[8rem] md:text-[12rem] leading-none select-none ${dark ? "text-white/[0.04]" : "text-[#1c1917]/[0.04]"}`}>
        {t.chapter}
      </span>
      {dark && <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(201,162,74,0.10), transparent 70%)" }} />}

      <div className={`relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
        {/* words */}
        <div className="min-w-0">
          <motion.p variants={V.kicker} className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.42em] mb-5 ${dark ? "text-[#e6c56d]/85" : "text-[#8a6a1e]"}`}>
            <span className="w-8 h-[1px] bg-[#c9a24a]" /> Template {t.chapter} · {t.kicker}
          </motion.p>

          <h3 className={`font-serif font-black tracking-tight leading-[0.95] ${ink}`} style={{ fontSize: "clamp(2.4rem, 5.2vw, 4.6rem)" }}>
            {t.name.split(" ").map((w, i) => (
              <span key={w} className="inline-block overflow-hidden mr-[0.25em] align-top pb-[0.08em] -mb-[0.08em]">
                <motion.span className="inline-block" variants={V.word} custom={i}>{w}</motion.span>
              </span>
            ))}
          </h3>

          <motion.p variants={V.tagline} className={`font-handwriting text-2xl md:text-3xl mt-3 -rotate-1 ${dark ? "text-[#e6c56d]" : "text-[#8a6a1e]"}`}>
            {t.tagline}
          </motion.p>

          <motion.p variants={V.body} className={`mt-5 text-[15px] md:text-base leading-relaxed max-w-lg ${soft}`}>
            {t.description}
          </motion.p>



          <motion.div variants={V.ctas} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/purpose/${t.id}`} className={`group inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${dark ? "bg-[#f4eee6] text-[#1c1917] hover:bg-white" : "bg-[#1c1917] text-white hover:bg-[#3d3329]"}`}>
              <Play size={14} className="fill-current" /> Preview the template
            </Link>
            <Link href={`/purpose/${t.id}`} className={`group inline-flex items-center gap-2 text-sm font-semibold transition-colors ${dark ? "text-[#d9cbb8] hover:text-white" : "text-[#5a4d41] hover:text-[#1c1917]"}`}>
              Start with it <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* the print */}
        <div className="relative">
          <motion.div style={{ y: imgY, rotateY: tilt, transformStyle: "preserve-3d" }} className="relative">
            <motion.div
              variants={V.print}
              className={`relative rounded-[18px] overflow-hidden ${dark ? "shadow-[0_40px_90px_-20px_rgba(0,0,0,0.8)] ring-1 ring-[#c9a24a]/40" : "shadow-[0_34px_80px_-24px_rgba(28,25,23,0.35)] ring-1 ring-[#e8e0d5]"}`}
            >
              {/* a slim browser bar so it reads as a real page, not a picture of one */}
              <div className={`flex items-center gap-1.5 px-3.5 h-8 ${dark ? "bg-[#1f120a]" : "bg-[#f4eee6]"}`}>
                {[0, 1, 2].map((k) => <span key={k} className={`w-2.5 h-2.5 rounded-full ${dark ? "bg-white/15" : "bg-[#d9cbb8]"}`} />)}
                <span className={`ml-3 h-4 flex-1 max-w-[220px] rounded-full ${dark ? "bg-white/[0.06]" : "bg-[#e8e0d5]/70"}`} />
              </div>
              <LivePreview t={t} dark={dark} />
            </motion.div>
          </motion.div>

          {/* a handwritten note drifting at a different speed */}
          <motion.div
            variants={V.note}
            style={{ y: noteY, rotate: flip ? 6 : -6 }}
            className={`absolute ${flip ? "-left-3 md:-left-8" : "-right-3 md:-right-8"} -bottom-5 md:-bottom-7 bg-[#f4ebd8] border border-[#e5d5be] shadow-[0_14px_30px_rgba(28,25,23,0.18)] px-5 py-3 font-handwriting text-[#2c241b] text-xl md:text-2xl whitespace-nowrap pointer-events-none`}
          >
            {t.note} ♡
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════ The pinned horizontal stage ═══════════════════════════
   The section is four screens tall. Its inner stage sticks to the viewport while the
   track slides sideways, so scrolling *down* walks you *across* the templates. The
   page scrollbar, wheel, trackpad and keys all behave normally — nothing is hijacked. */
function Slide({ t, i, n, progress }: { t: ShowcaseTemplate; i: number; n: number; progress: MotionValue<number> }) {
  const reduce = !!useReducedMotion();
  const dark = t.tone === "dark";

  // how far this slide is from centre: 0 centred, +1 one slide behind, -1 one ahead
  const d = useTransform(progress, (p) => p * (n - 1) - i);
  // the depth transform rides on the CONTENT, never the panel, so the backdrops
  // stay edge to edge and no seam of stage colour ever opens between two slides
  const scale = useTransform(d, [-1, 0, 1], [0.9, 1, 0.9]);
  const opacity = useTransform(d, [-1, 0, 1], [0.5, 1, 0.5]);
  const rotateY = useTransform(d, [-1, 0, 1], [11, 0, -11]);
  // the panel recedes by dimming instead, which costs no geometry. A cream panel
  // veiled with a neutral goes muddy grey, so each tone gets its own warm veil.
  const dim = useTransform(d, [-1, 0, 1], dark ? [0.58, 0, 0.58] : [0.5, 0, 0.5]);
  const bgScale = useTransform(d, [-1, 0, 1], [1.06, 1, 1.06]);
  // layers separate as a slide crosses: the print lags behind, the words run slightly ahead
  const printX = useTransform(d, [-1, 0, 1], ["-14%", "0%", "14%"]);
  const wordsX = useTransform(d, [-1, 0, 1], ["9%", "0%", "-9%"]);

  const [active, setActive] = useState(i === 0);
  useMotionValueEvent(d, "change", (v) => {
    const isCentre = Math.abs(v) < 0.55;
    setActive((was) => (was === isCentre ? was : isCentre));
  });

  const ink = dark ? "text-[#f4eee6]" : "text-[#1c1917]";
  const soft = dark ? "text-[#d9cbb8]/80" : "text-[#5a4d41]";
  const chip = dark ? "bg-white/[0.06] border-white/10 text-[#e6c56d]" : "bg-[#f4eee6] border-[#e8e0d5] text-[#5a4d41]";
  const show = active ? "show" : "hidden";
  const t0 = (delay: number) => ({ duration: reduce ? 0.2 : 0.7, delay, ease: EASE });

  return (
    <article
      data-stage-slide={i}
      className={`relative w-screen h-screen shrink-0 overflow-hidden flex items-center ${dark ? "bg-[#140a05]" : "bg-[#fdfbf7]"}`}
    >
      <motion.span
        aria-hidden
        style={reduce ? undefined : { scale: bgScale }}
        className={`absolute -top-10 right-10 font-serif font-black text-[22vw] leading-none select-none origin-top-right ${dark ? "text-white/[0.035]" : "text-[#1c1917]/[0.035]"}`}
      >
        {t.chapter}
      </motion.span>
      {dark && <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 65% 55% at 50% 100%, rgba(201,162,74,0.12), transparent 70%)" }} />}

      {/* recede-by-dimming: covers the whole panel, so neighbours read as "further away"
          without shrinking away from their neighbour and exposing the stage behind */}
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ opacity: dim }}
          className={`absolute inset-0 z-[1] pointer-events-none ${dark ? "bg-[#0b0603]" : "bg-[#4a2a10]"}`}
        />
      )}

      <motion.div
        style={reduce ? undefined : { scale, opacity, rotateY }}
        className="relative z-[2] w-full max-w-[1800px] mx-auto px-6 sm:px-8 xl:px-12 2xl:px-16 flex flex-col lg:grid lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] gap-6 sm:gap-8 xl:gap-14 items-center justify-center h-full max-h-[100dvh] pt-20 pb-28 lg:py-0"
      >
        <motion.div style={reduce ? undefined : { x: wordsX }} className="w-full lg:w-auto min-w-0">
          <motion.p
            animate={show} initial="hidden"
            variants={{ hidden: { opacity: 0, x: reduce ? 0 : -14 }, show: { opacity: 1, x: 0, transition: t0(0.05) } }}
            className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.42em] mb-5 ${dark ? "text-[#e6c56d]/85" : "text-[#8a6a1e]"}`}
          >
            <span className="w-8 h-[1px] bg-[#c9a24a]" /> Template {t.chapter} · {t.kicker}
          </motion.p>

          <h3 className={`font-serif font-black tracking-tight leading-[0.92] ${ink}`} style={{ fontSize: "clamp(2.5rem, 5vw, 5.5rem)" }}>
            {t.name.split(" ").map((w, k) => (
              <span key={w} className="inline-block overflow-hidden mr-[0.25em] align-top pb-[0.08em] -mb-[0.08em]">
                <motion.span
                  className="inline-block" animate={show} initial="hidden"
                  variants={{ hidden: { y: reduce ? 0 : "105%" }, show: { y: 0, transition: t0(0.12 + k * 0.08) } }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h3>

          <motion.p
            animate={show} initial="hidden"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: t0(0.3) } }}
            className={`font-handwriting text-2xl lg:text-[2.1rem] mt-3 -rotate-1 ${dark ? "text-[#e6c56d]" : "text-[#8a6a1e]"}`}
          >
            {t.tagline}
          </motion.p>

          <motion.p
            animate={show} initial="hidden"
            variants={{ hidden: { opacity: 0, y: reduce ? 0 : 12 }, show: { opacity: 1, y: 0, transition: t0(0.38) } }}
            className={`mt-2 lg:mt-5 text-[15px] lg:text-[17px] leading-relaxed max-w-xl ${soft}`}
          >
            {t.description}
          </motion.p>



          <motion.div
            animate={show} initial="hidden"
            variants={{ hidden: { opacity: 0, y: reduce ? 0 : 12 }, show: { opacity: 1, y: 0, transition: t0(0.74) } }}
            className="mt-4 lg:mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href={`/purpose/${t.id}`} className={`group inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${dark ? "bg-[#f4eee6] text-[#1c1917] hover:bg-white" : "bg-[#1c1917] text-white hover:bg-[#3d3329]"}`}>
              <Play size={14} className="fill-current" /> Preview
            </Link>
            <Link href={`/purpose/${t.id}`} className={`group inline-flex items-center gap-2 text-sm font-semibold transition-colors ${dark ? "text-[#d9cbb8] hover:text-white" : "text-[#5a4d41] hover:text-[#1c1917]"}`}>
              Start <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div style={reduce ? undefined : { x: printX }} className="relative w-full lg:w-auto">
          <motion.div
            animate={show} initial="hidden"
            variants={{ hidden: { opacity: 0, scale: reduce ? 1 : 0.96 }, show: { opacity: 1, scale: 1, transition: { duration: reduce ? 0.2 : 0.9, delay: 0.1, ease: EASE } } }}
            /* 16:9 plus the 44px chrome bar: this cap keeps the print inside a short
               viewport while letting it grow to fill a tall one */
            style={{ maxWidth: "min(100%, calc(122vh - 78px))" }}
            className={`relative mx-auto lg:ml-auto w-full lg:w-auto rounded-[18px] lg:rounded-[22px] overflow-hidden ${dark ? "shadow-[0_40px_90px_-20px_rgba(0,0,0,0.85)] ring-1 ring-[#c9a24a]/40" : "shadow-[0_40px_90px_-20px_rgba(28,25,23,0.45)] ring-1 ring-[#e8e0d5]"}`}
          >
            <div className={`flex items-center gap-2 px-4 h-11 ${dark ? "bg-[#1f120a]" : "bg-[#f4eee6]"}`}>
              {[0, 1, 2].map((k) => <span key={k} className={`w-3 h-3 rounded-full ${dark ? "bg-white/15" : "bg-[#d9cbb8]"}`} />)}
              <span className={`ml-3 h-5 flex-1 max-w-[320px] rounded-full ${dark ? "bg-white/[0.06]" : "bg-[#e8e0d5]/70"}`} />
            </div>
            <LivePreview t={t} dark={dark} play={active} />
          </motion.div>

          <motion.div
            animate={show} initial="hidden"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: t0(0.8) } }}
            style={{ rotate: -5 }}
            className="absolute -right-2 lg:-right-6 -bottom-4 lg:-bottom-7 bg-[#f4ebd8] border border-[#e5d5be] shadow-[0_16px_34px_rgba(28,25,23,0.2)] px-4 py-2 lg:px-5 lg:py-3 font-handwriting text-[#2c241b] text-xl lg:text-2xl whitespace-nowrap pointer-events-none"
          >
            {t.note} ♡
          </motion.div>
        </motion.div>
      </motion.div>
    </article>
  );
}

/* The section is taller than the travel it drives, and the extra height is spent
   holding still at each end. Without the tail hold the track reached its last
   slide at the very instant the sticky container released, so the spring was
   still catching up as the panel scrolled away and slide 4 never landed. */
const HOLD_IN_VH = 50;
const HOLD_OUT_VH = 100;

function HorizontalStage({ templates }: { templates: ShowcaseTemplate[] }) {
  const n = templates.length;
  const outer = useRef<HTMLDivElement>(null);
  // travel (n-1 screens) + one screen of sticky + the two holds
  const outerVh = (n - 1) * 100 + 100 + HOLD_IN_VH + HOLD_OUT_VH;
  const rangeVh = outerVh - 100; // the scrollable part, over which scrollYProgress runs 0 -> 1
  const holdIn = HOLD_IN_VH / rangeVh;
  const holdOut = 1 - HOLD_OUT_VH / rangeVh;

  // the stage owns the whole screen while it is stuck, so the floating bar steps
  // aside for exactly that stretch and comes back as the section lets go
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      // a display:none stage (below lg) reports a zero box and never matches
      setNavHidden(r.top <= 1 && r.bottom >= window.innerHeight - 1);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      setNavHidden(false);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  // flat, then linear, then flat: slide 1 sits still as you arrive and slide n sits
  // still long enough to settle before the section lets go
  const held = useTransform(scrollYProgress, [0, holdIn, holdOut, 1], [0, 0, 1, 1]);
  // a spring between scroll and travel: the track glides and settles instead of snapping to wheel ticks
  const progress = useSpring(held, { stiffness: 90, damping: 26, mass: 0.35 });
  const x = useTransform(progress, [0, 1], ["0%", `-${((n - 1) / n) * 100}%`]);
  const railFill = useTransform(progress, [0, 1], ["0%", "100%"]);
  const [index, setIndex] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    const i = Math.max(0, Math.min(n - 1, Math.round(p * (n - 1))));
    setIndex((was) => (was === i ? was : i));
  });

  return (
    <div ref={outer} data-stage-outer style={{ height: `${outerVh}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-[#120a05]" style={{ perspective: 1800 }}>
        <motion.div style={{ x, width: `${n * 100}vw` }} className="flex h-full will-change-transform">
          {templates.map((t, i) => <Slide key={t.id} t={t} i={i} n={n} progress={progress} />)}
        </motion.div>

        {/* where you are in the set */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-5 pointer-events-none">
          <span className={`font-serif font-black text-sm tabular-nums transition-colors duration-500 ${templates[index].tone === "dark" ? "text-[#e6c56d]" : "text-[#8a6a1e]"}`}>
            {templates[index].chapter}
          </span>
          <span className={`relative block h-[2px] w-52 rounded-full overflow-hidden ${templates[index].tone === "dark" ? "bg-white/15" : "bg-[#1c1917]/10"}`}>
            <motion.span style={{ width: railFill }} className="absolute inset-y-0 left-0 bg-[#c9a24a] rounded-full" />
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${templates[index].tone === "dark" ? "text-[#d9cbb8]/70" : "text-[#8a755b]"}`}>
            {templates[index].name}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TemplateShowcase({ templates }: { templates: ShowcaseTemplate[] }) {
  const reduce = !!useReducedMotion();
  const V = mk(reduce);
  return (
    <section id="templates" className="scroll-mt-28 space-y-6 md:space-y-8">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 md:mb-4">
        <div>
          <motion.span variants={V.tagline} className="block text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a755b] mb-3">Our templates</motion.span>
          <h2 className="font-serif font-black text-[#1c1917] tracking-tight leading-[0.95]" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>
            {["Four worlds", "for your photographs."].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
                <motion.span className="block" variants={V.line} custom={i}>{line}</motion.span>
              </span>
            ))}
          </h2>
        </div>
        <motion.p variants={V.fade} className="text-[#5a4d41] text-sm md:text-base max-w-sm md:text-right">
          Each one is a set of scenes built in real 3D. Upload your photos into the slots and the whole thing comes alive.
        </motion.p>
      </motion.div>

      {/* phones, tablets and reduced motion keep the stack */}
      <div className={reduce ? "space-y-6 md:space-y-8" : "hidden"}>
        {templates.map((t, i) => <Panel key={t.id} t={t} index={i} />)}
      </div>
    </section>
  );
}

/* The stage is a sibling of the section so it can run full-bleed, outside the page gutter */
export function TemplateStage({ templates }: { templates: ShowcaseTemplate[] }) {
  const reduce = !!useReducedMotion();
  if (reduce) return null;
  return (
    <div className={reduce ? "hidden" : "block"}>
      <HorizontalStage templates={templates} />
    </div>
  );
}
