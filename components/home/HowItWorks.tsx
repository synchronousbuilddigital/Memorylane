"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, animate, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { LayoutTemplate, ImagePlus, Share2, type LucideIcon } from "lucide-react";
import { EASE } from "../motion/Reveal";

/* ────────────────────────────────────────────────────────────────────────────
   How it works: a winding road with one stop per step. When the section
   scrolls into view a brass light sets off from the start of the road and
   travels every bend, then goes again, for as long as the section is on
   screen. The first time it reaches a stop the ring brightens and the step's
   words fade in beside it — and they stay, so the text is readable while the
   light keeps travelling; on later passes the ring gives a small pulse as the
   light goes by. Scrolling away resets it, so it replays on return.

   The road is built from a polyline with rounded corners, and the stops are
   placed by walking that same geometry in JS — so their positions are known
   at render time (no DOM measuring, no hydration mismatch) and line up
   exactly with the light, which framer drives as a fraction of path length.
   ──────────────────────────────────────────────────────────────────────────── */

const STEPS: { n: string; Icon: LucideIcon; title: string; body: string; accent: string }[] = [
  { n: "01", Icon: LayoutTemplate, title: "Pick a template", body: "Family, travel, a birthday, the whole clan — each one is a different world.", accent: "#c9a24a" },
  { n: "02", Icon: ImagePlus, title: "Fill the slots", body: "Drop your photos into each scene. Write the captions in your own words.", accent: "#b8892f" },
  { n: "03", Icon: Share2, title: "Share one link", body: "Send it to everyone. They scroll through it like a film, on any phone.", accent: "#8a6a1e" },
];

/* ── geometry ─────────────────────────────────────────────────────────────── */
type Pt = [number, number];
const K = 0.5523; // cubic approximation of a quarter circle

/* A polyline whose corners are rounded with quarter-circle cubics. Returns the
   path string plus a dense sample of points with cumulative length, so a
   fraction along the path can be turned into a point and vice versa. */
function roundedRoad(points: Pt[], r: number) {
  const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
  const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
  const mul = (a: Pt, s: number): Pt => [a[0] * s, a[1] * s];
  const unit = (a: Pt): Pt => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };

  let d = `M ${points[0][0]} ${points[0][1]}`;
  const samples: { x: number; y: number; len: number }[] = [{ x: points[0][0], y: points[0][1], len: 0 }];
  let cursor: Pt = points[0];
  let len = 0;

  const line = (to: Pt) => {
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const p: Pt = add(cursor, mul(sub(to, cursor), i / steps));
      len += Math.hypot(p[0] - samples[samples.length - 1].x, p[1] - samples[samples.length - 1].y);
      samples.push({ x: p[0], y: p[1], len });
    }
    d += ` L ${to[0]} ${to[1]}`;
    cursor = to;
  };
  const cubic = (c1: Pt, c2: Pt, to: Pt) => {
    const steps = 24;
    const p0 = cursor;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, mt = 1 - t;
      const x = mt ** 3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * to[0];
      const y = mt ** 3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * to[1];
      len += Math.hypot(x - samples[samples.length - 1].x, y - samples[samples.length - 1].y);
      samples.push({ x, y, len });
    }
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${to[0]} ${to[1]}`;
    cursor = to;
  };

  for (let i = 1; i < points.length - 1; i++) {
    const P = points[i];
    const uIn = unit(sub(P, points[i - 1]));
    const uOut = unit(sub(points[i + 1], P));
    const start = sub(P, mul(uIn, r));
    const end = add(P, mul(uOut, r));
    line(start);
    cubic(add(start, mul(uIn, r * K)), sub(end, mul(uOut, r * K)), end);
  }
  line(points[points.length - 1]);

  const total = len;
  /* fraction of the path nearest a target point, and the point itself */
  const stopAt = (target: Pt) => {
    let best = samples[0], bd = Infinity;
    for (const s of samples) {
      const dd = (s.x - target[0]) ** 2 + (s.y - target[1]) ** 2;
      if (dd < bd) { bd = dd; best = s; }
    }
    return { x: best.x, y: best.y, t: best.len / total };
  };
  return { d, stopAt };
}

type Geo = {
  vw: number; vh: number; road: number; radius: number;
  points: Pt[];
  stops: Pt[];                      // target coordinate of each stop, on a flat run
  side: ("above" | "below" | "left" | "right")[];
  ring: number;                     // ring diameter, px
  leader: number;                   // leader length, viewBox units
  duration: number;
};

/* Desktop: three flat runs joined by U-bends, reading left to right.
   Labels float above the high runs and below the low one. */
const DESKTOP: Geo = {
  vw: 1200, vh: 720, road: 64, radius: 80,
  points: [[40, 480], [170, 480], [170, 260], [450, 260], [450, 480], [730, 480], [730, 260], [1010, 260], [1010, 480], [1160, 480]],
  stops: [[310, 260], [590, 480], [870, 260]],
  side: ["above", "below", "above"],
  ring: 72, leader: 52, duration: 8,
};

/* Phone and tablet: the same road stood on end. Labels sit beside each stop,
   alternating sides so nothing ever crosses the road. */
const MOBILE: Geo = {
  vw: 360, vh: 880, road: 46, radius: 62,
  points: [[70, 30], [70, 250], [290, 250], [290, 570], [70, 570], [70, 850]],
  stops: [[70, 120], [290, 410], [70, 730]],
  side: ["right", "left", "right"],
  ring: 56, leader: 40, duration: 8.5,
};

const COMET = 0.11; // length of the travelling light, as a fraction of the road

/* ── the road ─────────────────────────────────────────────────────────────── */
function Road({ geo, className }: { geo: Geo; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = !!useReducedMotion();

  const { d, stops } = useMemo(() => {
    const r = roundedRoad(geo.points, geo.radius);
    return { d: r.d, stops: geo.stops.map((s) => r.stopAt(s)) };
  }, [geo]);

  // `progress` is where the light is on this trip: 0 at the start of the road,
  // 1 at the end, then back to 0 for the next trip. `reach` is the furthest it
  // has ever been since the section came into view — a latch, so the stops it
  // has passed stay lit while the light itself goes round again.
  const progress = useMotionValue(0);
  const reach = useMotionValue(0);
  useEffect(() => {
    if (!inView) { progress.set(0); reach.set(0); return; }
    if (reduce) { progress.set(1); reach.set(1); return; }
    const latch = progress.on("change", (p) => { if (p > reach.get()) reach.set(p); });
    const ctrl = animate(progress, [0, 1], {
      duration: geo.duration, delay: 0.4, ease: "easeInOut",
      repeat: Infinity, repeatDelay: 1.2,
    });
    return () => { latch(); ctrl.stop(); };
  }, [inView, reduce, progress, reach, geo.duration]);

  // the light's head sits at `progress`; its tail trails COMET behind it.
  // Every path value is a motion value on purpose: framer only routes a
  // path through its SVG dash builder when it sees one, so a plain number
  // here would leave the light painted along the whole road.
  const cometOffset = useTransform(progress, (p) => Math.max(0, p - COMET));
  const cometLength = useTransform(progress, (p) => Math.min(COMET, Math.max(0.0001, p)));
  // it fades in as it leaves the start and out as it arrives, so the jump
  // back to the start between trips is never seen
  const cometOpacity = useTransform(progress, [0, 0.05, 0.94, 1], [0, 1, 1, 0]);
  // the warmed stretch follows the latch, so it never snaps dark mid-loop
  const trailLength = useTransform(reach, (r) => Math.max(0.0001, r));

  const glowId = `road-glow-${geo.vw}`;
  const shadowId = `road-shadow-${geo.vw}`;

  return (
    <div ref={ref} className={`relative w-full ${className ?? ""}`} style={{ aspectRatio: `${geo.vw} / ${geo.vh}` }}>
      <svg viewBox={`0 0 ${geo.vw} ${geo.vh}`} className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
        <defs>
          {/* regions in user space, covering the whole viewBox plus a margin: the
              default region is fitted to the path's geometry WITHOUT its stroke,
              which clipped the top of the road on every top run */}
          <filter id={glowId} filterUnits="userSpaceOnUse" x={-geo.road * 2} y={-geo.road * 2} width={geo.vw + geo.road * 4} height={geo.vh + geo.road * 4}>
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id={shadowId} filterUnits="userSpaceOnUse" x={-geo.road * 2} y={-geo.road * 2} width={geo.vw + geo.road * 4} height={geo.vh + geo.road * 4}>
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#1c1917" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* the road: a dark ribbon with a slightly lighter crown so it reads as solid */}
        <g filter={`url(#${shadowId})`}>
          <path d={d} fill="none" stroke="#2a1a10" strokeWidth={geo.road} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <path d={d} fill="none" stroke="#3d2718" strokeWidth={geo.road - 14} strokeLinecap="round" strokeLinejoin="round" />
        {/* a faint lane line, as the reference's roads have */}
        <path d={d} fill="none" stroke="#c9a24a" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="3 10" strokeLinecap="round" />

        {/* the stretch the light has already covered stays warm */}
        <motion.path
          d={d} fill="none" stroke="#c9a24a" strokeOpacity="0.32" strokeWidth={geo.road - 22} strokeLinecap="round" strokeLinejoin="round"
          style={{ pathLength: trailLength }}
        />

        {/* the travelling light: a soft glow with a bright core */}
        <motion.path
          d={d} fill="none" stroke="#e6c56d" strokeOpacity="0.7" strokeWidth={geo.road - 12} strokeLinecap="round" strokeLinejoin="round"
          filter={`url(#${glowId})`}
          style={{ pathLength: cometLength, pathOffset: cometOffset, opacity: cometOpacity }}
        />
        <motion.path
          d={d} fill="none" stroke="#f6e29a" strokeWidth={geo.road - 40} strokeLinecap="round" strokeLinejoin="round"
          style={{ pathLength: cometLength, pathOffset: cometOffset, opacity: cometOpacity }}
        />

        {/* leader lines from each stop out to its words, each with a dot at the end */}
        {stops.map((s, i) => {
          const side = geo.side[i];
          const half = geo.road / 2 + 8;
          const [x1, y1, x2, y2] =
            side === "above" ? [s.x, s.y - half, s.x, s.y - half - geo.leader]
            : side === "below" ? [s.x, s.y + half, s.x, s.y + half + geo.leader]
            : side === "right" ? [s.x + half, s.y, s.x + half + geo.leader, s.y]
            : [s.x - half, s.y, s.x - half - geo.leader, s.y];
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={STEPS[i].accent} strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              <circle cx={x2} cy={y2} r="4" fill={STEPS[i].accent} />
            </g>
          );
        })}
      </svg>

      {/* rings on the road */}
      {stops.map((s, i) => (
        <Ring key={i} step={STEPS[i]} x={(s.x / geo.vw) * 100} y={(s.y / geo.vh) * 100} t={s.t} size={geo.ring} progress={progress} reach={reach} />
      ))}

      {/* the words, at the end of each leader */}
      <ol className="absolute inset-0 m-0 p-0 list-none">
        {stops.map((s, i) => {
          const side = geo.side[i];
          const half = geo.road / 2 + 8;
          const gap = 14;
          const ax = side === "right" ? s.x + half + geo.leader + gap : side === "left" ? s.x - half - geo.leader - gap : s.x;
          const ay = side === "above" ? s.y - half - geo.leader - gap : side === "below" ? s.y + half + geo.leader + gap : s.y;
          // anchors go through framer's own x/y: a CSS transform string would be
          // overwritten by the transform framer builds for the reveal
          const anchor =
            side === "above" ? { x: "-50%", y: "-100%" }
            : side === "below" ? { x: "-50%", y: "0%" }
            : side === "right" ? { x: "0%", y: "-50%" }
            : { x: "-100%", y: "-50%" };
          const align = side === "left" ? "text-right items-end" : side === "right" ? "text-left items-start" : "text-center items-center";
          return (
            <Label key={i} step={STEPS[i]} t={s.t} reach={reach}
              left={`${(ax / geo.vw) * 100}%`} top={`${(ay / geo.vh) * 100}%`} anchor={anchor}
              className={align}
              wide={side === "above" || side === "below"}
            />
          );
        })}
      </ol>
    </div>
  );
}

function Ring({ step, x, y, t, size, progress, reach }: { step: typeof STEPS[number]; x: number; y: number; t: number; size: number; progress: MotionValue<number>; reach: MotionValue<number> }) {
  // lights the first time the head of the light reaches this stop, and stays lit
  const lit = useTransform(reach, [t - 0.05, t + 0.01], [0, 1]);
  // and gives a small pulse every time the light passes it after that
  const pulse = useTransform(progress, [t - 0.07, t, t + 0.07], [0, 1, 0]);
  const border = useTransform(lit, [0, 1], ["#5c3616", "#e6c56d"]);
  const color = useTransform(lit, [0, 1], ["#8a755b", "#f6e29a"]);
  const scale = useTransform([lit, pulse], ([l, p]: number[]) => 1 + 0.08 * l + 0.07 * p);
  const shadow = useTransform([lit, pulse], ([l, p]: number[]) => {
    const g = Math.min(1, l + p * 0.9);
    return `0 0 0 4px rgba(248,246,243,0.9), 0 10px 26px rgba(28,25,23,0.35), 0 0 ${24 * g + 14 * p}px ${8 * g + 4 * p}px rgba(230,197,109,${0.55 * g})`;
  });
  return (
    <motion.div
      aria-hidden
      className="absolute rounded-full bg-[#1c1917] flex items-center justify-center"
      style={{ left: `${x}%`, top: `${y}%`, x: "-50%", y: "-50%", width: size, height: size, borderWidth: 2, borderStyle: "solid", borderColor: border, color, scale, boxShadow: shadow }}
    >
      <step.Icon size={Math.round(size * 0.36)} strokeWidth={1.75} />
    </motion.div>
  );
}

function Label({ step, t, reach, left, top, anchor, className, wide }: {
  step: typeof STEPS[number]; t: number; reach: MotionValue<number>;
  left: string; top: string; anchor: { x: string; y: string }; className: string; wide: boolean;
}) {
  // fades in the first time the light reaches this stop, and stays
  const lit = useTransform(reach, [t - 0.03, t + 0.06], [0, 1]);
  const rise = useTransform(lit, [0, 1], [10, 0]);
  return (
    // the outer element only anchors; the inner one rises, so the two transforms never fight
    <motion.li
      style={{ left, top, x: anchor.x, y: anchor.y, opacity: lit }}
      className={`absolute ${wide ? "w-[310px] xl:w-[350px]" : "w-[clamp(160px,52%,215px)]"}`}
    >
      <motion.div style={{ y: rise }} className={`flex flex-col ${className}`}>
        <span className="text-[11px] lg:text-xs font-bold uppercase tracking-[0.34em] mb-2" style={{ color: step.accent }}>Step {step.n}</span>
        <h3 className="font-serif font-bold text-[#1c1917] leading-tight" style={{ fontSize: wide ? "1.8rem" : "1.35rem" }}>{step.title}</h3>
        <p className="text-[#5a4d41] leading-relaxed mt-2" style={{ fontSize: wide ? "1.02rem" : "0.92rem" }}>{step.body}</p>
      </motion.div>
    </motion.li>
  );
}

/* ── the section ──────────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const reduce = !!useReducedMotion();
  return (
    <section id="how" className="scroll-mt-28 relative">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.5 }} className="text-center mb-6 md:mb-10">
        <motion.span variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }} className="block text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a755b] mb-3">How it works</motion.span>
        <h2 className="font-serif font-black text-[#1c1917] tracking-tight" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)" }}>
          <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
            <motion.span className="block" variants={{ hidden: { y: reduce ? 0 : "105%" }, show: { y: 0, transition: { duration: reduce ? 0.2 : 0.8, ease: EASE } } }}>Three steps. One link.</motion.span>
          </span>
        </h2>
      </motion.div>

      {/* only one road is ever laid out, so only one ever animates */}
      <Road geo={DESKTOP} className="hidden lg:block" />
      <Road geo={MOBILE} className="lg:hidden max-w-[420px] mx-auto" />
    </section>
  );
}
