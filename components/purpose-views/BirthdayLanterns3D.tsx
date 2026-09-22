"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mouse } from "lucide-react";
import InlineEditableText from "@/components/InlineEditableText";

/* ────────────────────────────────────────────────────────────────────────────
   Birthday Skies — floating paper lanterns (WebGL)
   Each lantern is a translucent paper body on bamboo ribs with a flame in its
   mouth and a photograph printed on the front. They rise through the night in
   their own time, swaying and flickering; a caption rides beneath each one.
   Click a lantern to open its photo. The page scrolls normally over the scene.
   ──────────────────────────────────────────────────────────────────────────── */

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1511795409834-ef04bbd61622",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1609220136736-443140cffec6",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1469474968028-56623f02e42e",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1501785888041-af3ef285b470",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1464349095431-e9a21285b5f3",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1502086223501-7ea6ecd79368",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1609234656388-0ff363383899",
];
export const DEFAULT_LANTERN_CAPTIONS = ["Some Madness ♡", "Good Friends ♡", "Next Stop More Life ♡", "Unforgettable ♡", "Cheers ♡", "Another Year ♡", "Forever Young ♡", "Best People ♡"];

const MAX_LANTERNS = 12;
const Y_MIN = -4, SPAN = 21;   // lanterns climb from below the frame to above it, then start again

/* ───────────── Deterministic random ───────────── */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────── Procedural textures ───────────── */
const texOnce = new Map<string, THREE.Texture>();
function canvasTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void) {
  const hit = texOnce.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, mulberry32(key.length * 7919 + w));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texOnce.set(key, t);
  return t;
}
const getGlowTex = () => canvasTex("glow", 64, 64, (ctx) => {
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,235,200,0.5)"); g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
});
const getPaperTex = () => canvasTex("paper", 512, 512, (ctx, rnd) => {
  ctx.fillStyle = "#f3dcb4"; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(120,70,20,${rnd() * 0.08})`; ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 2, 1); }
  for (let i = 0; i < 40; i++) { ctx.strokeStyle = `rgba(120,70,20,${0.03 + rnd() * 0.05})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(rnd() * 512, 0); ctx.lineTo(rnd() * 512, 512); ctx.stroke(); }
});
const getHillsTex = () => canvasTex("hills", 2048, 512, (ctx) => {
  ctx.clearRect(0, 0, 2048, 512);
  const ridge = (base: number, amp: number, color: string, seed: number) => {
    const r = mulberry32(seed);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 512);
    let y = base;
    for (let x = 0; x <= 2048; x += 28) { y += (r() - 0.5) * amp; y = Math.max(base - 110, Math.min(base + 50, y)); ctx.lineTo(x, y); }
    ctx.lineTo(2048, 512); ctx.closePath(); ctx.fill();
  };
  ridge(250, 34, "#1c110a", 2); ridge(320, 30, "#130b06", 4); ridge(380, 22, "#0d0704", 6);
});

/* ───────────── Photo textures ───────────── */
function sizedUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_800,c_limit,q_auto,f_auto/");
}
const PANEL_W = 0.78, PANEL_H = 1.02, PANEL_ASPECT = PANEL_W / PANEL_H;
function makePlaceholderTex(idx: number) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  const warm = ["#c4a882", "#b89a72", "#d4b896", "#a08060", "#c8aa80", "#b8986e"];
  ctx.fillStyle = warm[idx % warm.length]; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function coverTo(t: THREE.Texture, aspect: number) {
  const img = t.image as { width?: number; height?: number };
  if (!img?.width || !img?.height) return;
  const a = img.width / img.height;
  if (a > aspect) { t.repeat.set(aspect / a, 1); t.offset.set((1 - aspect / a) / 2, 0); }
  else { t.repeat.set(1, a / aspect); t.offset.set(0, (1 - a / aspect) / 2); }
  t.needsUpdate = true;
}
type PhotoEntry = { tex: THREE.Texture; loaded: boolean; listeners: Set<() => void> };
const photoCache = new Map<string, PhotoEntry>();
function getPhoto(url: string, idx: number): PhotoEntry {
  const key = `lantern:${url}`;
  const hit = photoCache.get(key);
  if (hit) return hit;
  const entry: PhotoEntry = { tex: makePlaceholderTex(idx), loaded: false, listeners: new Set() };
  photoCache.set(key, entry);
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(sizedUrl(url), (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; coverTo(t, PANEL_ASPECT);
    entry.tex = t; entry.loaded = true; entry.listeners.forEach((l) => l());
  }, undefined, () => { /* keep placeholder */ });
  return entry;
}
function usePhoto(url: string, idx: number) {
  const [tex, setTex] = useState(() => getPhoto(url, idx).tex);
  useEffect(() => {
    const e = getPhoto(url, idx);
    setTex(e.tex);
    if (e.loaded) return;
    const l = () => setTex(e.tex);
    e.listeners.add(l);
    return () => { e.listeners.delete(l); };
  }, [url, idx]);
  return tex;
}

/* ───────────── One lantern ───────────── */
type Drift = { x: number; z: number; speed: number; phase: number; sway: number; tilt: number; scale: number };
const BODY = [[0, 0], [0.5, 0], [0.6, 0.35], [0.62, 0.9], [0.55, 1.45], [0.4, 1.75], [0.36, 1.8]].map(([x, y]) => new THREE.Vector2(x, y));

function Lantern({ url, idx, caption, drift, editable, onCaptionChange, onOpen, onHover }: {
  url: string; idx: number; caption: string; drift: Drift; editable: boolean;
  onCaptionChange?: (v: string) => void; onOpen: () => void; onHover: (on: boolean) => void;
}) {
  const tex = usePhoto(url, idx);
  const paper = getPaperTex(), glow = getGlowTex();
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.MeshStandardMaterial>(null);
  const flame = useRef<THREE.Sprite>(null);
  const halo = useRef<THREE.Sprite>(null);
  const hovered = useRef(false);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    // climb, wrap, sway
    const y = Y_MIN + ((t * drift.speed + drift.phase) % SPAN);
    g.position.set(drift.x + Math.sin(t * 0.32 + drift.phase) * drift.sway, y, drift.z);
    g.rotation.z = Math.sin(t * 0.45 + drift.phase) * drift.tilt;
    g.rotation.y = Math.sin(t * 0.2 + drift.phase * 2) * 0.35;
    // candle flicker
    const f = 0.85 + 0.12 * Math.sin(t * 9 + idx * 1.7) + 0.06 * Math.sin(t * 23 + idx * 3.1);
    const boost = hovered.current ? 1.35 : 1;
    if (body.current) body.current.emissiveIntensity = 0.9 * f * boost;
    if (flame.current) flame.current.scale.setScalar(0.5 * f);
    if (halo.current) (halo.current.material as THREE.SpriteMaterial).opacity = 0.32 * f * boost;
  });

  return (
    <group ref={group} scale={drift.scale}>
      <group
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); hovered.current = true; onHover(true); }}
        onPointerOut={() => { hovered.current = false; onHover(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(); }}
      >
        {/* paper body, lit from inside */}
        <mesh>
          <latheGeometry args={[BODY, 28]} />
          <meshStandardMaterial ref={body} map={paper} color="#f6dfb7" emissive="#ffb15e" emissiveIntensity={0.9} transparent opacity={0.9} side={THREE.DoubleSide} roughness={1} />
        </mesh>
        {/* bamboo ribs and rings */}
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[Math.cos((k / 4) * Math.PI * 2) * 0.6, 0.9, Math.sin((k / 4) * Math.PI * 2) * 0.6]}>
            <cylinderGeometry args={[0.012, 0.012, 1.8, 6]} /><meshStandardMaterial color="#5c3616" roughness={0.8} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><torusGeometry args={[0.5, 0.025, 8, 32]} /><meshStandardMaterial color="#3b1f0c" roughness={0.8} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.79, 0]}><torusGeometry args={[0.36, 0.02, 8, 32]} /><meshStandardMaterial color="#3b1f0c" roughness={0.8} /></mesh>
        {/* the photograph on the front, on a cream mat */}
        <group position={[0, 0.9, 0.615]}>
          <mesh><planeGeometry args={[PANEL_W + 0.08, PANEL_H + 0.08]} /><meshStandardMaterial color="#efe6d3" roughness={1} transparent opacity={0.96} /></mesh>
          <mesh position={[0, 0, 0.004]}><planeGeometry args={[PANEL_W, PANEL_H]} /><meshStandardMaterial map={tex} roughness={0.55} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} /></mesh>
        </group>
        {/* flame in the mouth, and the halo the lantern throws */}
        <sprite ref={flame} position={[0, 0.12, 0]} scale={[0.5, 0.5, 1]}><spriteMaterial map={glow} color="#ffb15e" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        <sprite ref={halo} position={[0, 0.9, 0]} scale={[4.2, 4.2, 1]}><spriteMaterial map={glow} color="#ffb15e" transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      </group>
      {/* caption riding beneath */}
      <Html position={[0, -0.45, 0]} center distanceFactor={11} zIndexRange={[20, 0]} style={{ pointerEvents: editable ? "auto" : "none" }}>
        <div className="font-handwriting text-[#f4eee6] whitespace-nowrap text-center rounded-md px-4 py-1.5 text-[15px] border border-[#c9a24a]/60 shadow-[0_0_14px_rgba(255,177,94,0.35),0_4px_12px_rgba(0,0,0,0.6)]" style={{ background: "rgba(20,10,4,0.82)", backdropFilter: "blur(6px)" }}>
          {editable && onCaptionChange ? <InlineEditableText value={caption} onChange={onCaptionChange} /> : caption}
        </div>
      </Html>
    </group>
  );
}

/* ───────────── The sky ───────────── */
function LanternScene({ urls, captions, editable, onCaptionChange, onOpen, onHover }: {
  urls: string[]; captions: string[]; editable: boolean; onCaptionChange?: (i: number, v: string) => void; onOpen: (i: number) => void; onHover: (on: boolean) => void;
}) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const glow = getGlowTex(), hills = getHillsTex();

  // each lantern's own path through the sky; the words live on the left, so most rise on the right
  const drifts = useMemo<Drift[]>(() => {
    const rnd = mulberry32(31);
    const wide = aspect > 1.3;
    return urls.map((_, i) => ({
      x: (wide ? 1.5 : 0) + (rnd() - 0.4) * (wide ? 15 : 9),
      z: -6 + rnd() * 7,
      speed: 0.28 + rnd() * 0.22,
      phase: (i / urls.length) * SPAN + rnd() * 2,
      sway: 0.4 + rnd() * 0.6,
      tilt: 0.04 + rnd() * 0.05,
      scale: 0.85 + rnd() * 0.35,
    }));
  }, [urls, aspect]);

  // faraway lanterns as points, for depth
  const far = useMemo(() => {
    const rnd = mulberry32(17), n = 140, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(rnd() - 0.5) * 70, rnd() * 26 - 2, -22 - rnd() * 30], i * 3);
    return p;
  }, []);
  const farRef = useRef<THREE.Points>(null);

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime;
    if (farRef.current) farRef.current.position.y = (t * 0.25) % 6;
    camera.position.x += ((pointer.x * 0.8) - camera.position.x) * 0.03;
    camera.position.y += ((4.5 + pointer.y * 0.5) - camera.position.y) * 0.03;
    camera.lookAt(0.5, 4.6, -2);
  });

  return (
    <group>
      <fog attach="fog" args={["#120a05", 24, 80]} />
      <ambientLight intensity={0.35} color="#ffd9b0" />
      <hemisphereLight args={["#3a2a20", "#1a0e07", 0.6]} />
      <points ref={farRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[far, 3]} /></bufferGeometry>
        <pointsMaterial map={glow} size={1.4} sizeAttenuation color="#ffb15e" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh position={[0, 3, -50]}><planeGeometry args={[220, 34]} /><meshBasicMaterial map={hills} transparent fog={false} /></mesh>
      {/* warm haze along the horizon */}
      <sprite position={[4, -2, -40]} scale={[120, 18, 1]}><spriteMaterial map={glow} color="#7a4a20" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></sprite>

      {urls.map((u, i) => (
        <Lantern key={i} url={u} idx={i} caption={captions[i]} drift={drifts[i]} editable={editable}
          onCaptionChange={onCaptionChange ? (v) => onCaptionChange(i, v) : undefined}
          onOpen={() => onOpen(i)} onHover={onHover} />
      ))}
    </group>
  );
}

/* ───────────── Lightbox ───────────── */
function PhotoLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {url && (
        <motion.div key="lantern-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0503]/90 backdrop-blur-md" onClick={onClose}>
          <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={22} /></button>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="relative p-3 bg-[#efe6d3] shadow-[0_40px_80px_rgba(0,0,0,0.7)] rounded-sm" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Memory" className="max-w-[88vw] max-h-[78vh] object-contain block" />
            <div className="absolute -inset-[3px] border border-[#c9a24a]/60 pointer-events-none rounded-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ───────────── Section ───────────── */
type Img = { id: string; displayUrl?: string; url?: string };
interface Props {
  images: Img[]; title: string; description: string; content?: Record<string, unknown>;
  onTitleChange?: (v: string) => void; onDescriptionChange?: (v: string) => void; onContentChange?: (key: string, v: string) => void;
}

export default function BirthdayLanterns3D({ images, title, description, content, onTitleChange, onDescriptionChange, onContentChange }: Props) {
  const urls = useMemo(() => {
    const own = images.map((i) => i.displayUrl || i.url || "").filter(Boolean);
    return (own.length ? own : PLACEHOLDERS).slice(0, MAX_LANTERNS);
  }, [images]);
  const captions = useMemo(() => urls.map((_, i) => {
    const v = content?.[`caption_${i}`];
    return typeof v === "string" && v.trim() ? v : DEFAULT_LANTERN_CAPTIONS[i % DEFAULT_LANTERN_CAPTIONS.length];
  }), [urls, content]);
  const editable = !!onContentChange;
  const [open, setOpen] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const close = useCallback(() => setOpen(null), []);
  const onOpen = useCallback((i: number) => setOpen(urls[i]), [urls]);
  const onCaptionChange = useMemo(() => onContentChange ? (i: number, v: string) => onContentChange(`caption_${i}`, v) : undefined, [onContentChange]);

  return (
    <section className="relative w-full h-screen overflow-hidden font-serif text-[#f4eee6]">
      <Canvas dpr={[1, 1.75]} camera={{ fov: 42, position: [0, 4.5, 15], near: 0.1, far: 220 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }} style={{ cursor: hovering ? "pointer" : "default" }}>
        <Suspense fallback={null}>
          <LanternScene urls={urls} captions={captions} editable={editable} onCaptionChange={onCaptionChange} onOpen={onOpen} onHover={setHovering} />
        </Suspense>
      </Canvas>

      {/* Hero words */}
      <div className="absolute left-4 sm:left-8 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ width: "clamp(180px, 40vw, 480px)" }}>
        <div className="pointer-events-auto">
          <p className="flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold mb-4 text-[#e6c56d]/85 font-sans"><span className="w-8 h-[1px] bg-[#c9a24a]" /> Chapter I · Floating lanterns</p>
          <h1 className="font-serif font-black tracking-tight leading-[0.92] text-[#f4eee6] whitespace-pre-wrap" style={{ fontSize: "clamp(2.5rem, 9vw, 9rem)", textShadow: "0 4px 32px rgba(0,0,0,0.9), 0 0 60px rgba(255,177,94,0.2)" }}>
            {onTitleChange ? <InlineEditableText value={title} onChange={onTitleChange} /> : title}
          </h1>
          <p className="font-serif italic text-[#d9cbb8]/85 whitespace-pre-wrap mt-4 leading-relaxed" style={{ fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)" }}>
            {onDescriptionChange ? <InlineEditableText value={description} onChange={onDescriptionChange} /> : description}
          </p>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[22vh] z-20" style={{ background: "linear-gradient(180deg, rgba(20,10,5,0) 0%, rgba(20,10,5,0.9) 100%)" }} />

      {/* Bottom decorations */}
      <div className="absolute bottom-10 left-8 text-[#d9cbb8]/60 font-serif uppercase tracking-[0.2em] text-[0.6rem] leading-loose z-30 pointer-events-none hidden sm:block">Some<br />Memories<br />Never<br />Fade</div>
      <div className="absolute bottom-14 right-10 text-[#e6c56d] font-handwriting text-2xl md:text-3xl z-30 rotate-[-5deg] pointer-events-none">High<br />on<br />Moments ♡</div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-30 text-[#d9cbb8]/60 pointer-events-none">
        <Mouse size={20} className="mb-2" />
        <span className="text-[9px] tracking-[0.3em] uppercase font-sans">Scroll Down</span>
        <div className="mt-3 w-[1px] h-10 bg-gradient-to-b from-[#d9cbb8]/40 to-transparent" />
      </div>
      <div className="pointer-events-none absolute bottom-6 right-6 md:bottom-8 md:right-10 z-30 hidden md:flex items-center gap-2 text-white/40 text-[9px] tracking-[0.3em] uppercase font-bold font-sans translate-y-16">
        <span>Click a lantern to view</span><div className="w-8 h-[1px] bg-white/30" />
      </div>

      <PhotoLightbox url={open} onClose={close} />
    </section>
  );
}
