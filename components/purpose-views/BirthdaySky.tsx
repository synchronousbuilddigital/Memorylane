"use client";

import { useEffect, useMemo, useRef } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   One night sky for the whole album. Fixed behind every chapter, so the same
   stars and moon show through each seam and the chapters read as one scroll
   through a single night rather than four separate rooms. Stars twinkle; the
   sky drifts very slowly with the scroll; the far horizon warms toward the
   golden room of Chapter II and cools again after it.
   ──────────────────────────────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function BirthdaySky({ scrollRoot }: { scrollRoot: React.RefObject<HTMLDivElement> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const warmth = useRef<HTMLDivElement>(null);
  const stars = useMemo(() => {
    const rnd = mulberry32(99);
    return Array.from({ length: 260 }, () => ({ x: rnd(), y: rnd() * 0.75, r: 0.5 + rnd() * 1.3, p: rnd() * Math.PI * 2, s: 0.4 + rnd() * 0.6 }));
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const draw = (t: number) => {
      const w = (c.width = c.clientWidth * Math.min(2, window.devicePixelRatio || 1));
      const h = (c.height = c.clientHeight * Math.min(2, window.devicePixelRatio || 1));
      ctx.clearRect(0, 0, w, h);
      // drift with the scroll so the sky is not a dead backdrop
      const root = scrollRoot.current;
      const drift = root ? Math.max(0, -root.getBoundingClientRect().top) * 0.04 : 0;
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 0.0012 * s.s + s.p);
        ctx.globalAlpha = tw * 0.9;
        ctx.fillStyle = "#fff4dc";
        ctx.beginPath(); ctx.arc(s.x * w, ((s.y * h) - drift * (0.5 + s.s)) % h, s.r * (w / 1600), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // warm the horizon while the golden room is in view (chapter II sits at 1–2 screens)
      if (warmth.current && root) {
        const vh = window.innerHeight;
        const p = -root.getBoundingClientRect().top / vh;      // screens scrolled
        const k = Math.min(1, Math.max(0, 1 - (Math.abs(p - 1) - 0.5) / 0.5)); // full across both seams of the room, gone by the neighbours' centres
        warmth.current.style.opacity = String(k * 0.85);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [stars, scrollRoot]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden style={{ background: "linear-gradient(180deg,#090503 0%,#140a05 55%,#2a170a 100%)" }}>
      {/* moon, top right, with its halo */}
      <div className="absolute" style={{ right: "9%", top: "12%", width: "min(9vw,110px)", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle at 42% 38%,#fbf3de,#e9dcc0 60%,#cdbf9f)", boxShadow: "0 0 60px 20px rgba(242,220,174,0.25), 0 0 140px 60px rgba(242,220,174,0.10)" }} />
      <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
      {/* golden warmth that rises as the room approaches */}
      <div ref={warmth} className="absolute inset-0 transition-opacity duration-300" style={{ opacity: 0, background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(150,95,40,0.55) 0%, rgba(90,52,24,0.35) 45%, transparent 75%)" }} />
    </div>
  );
}
