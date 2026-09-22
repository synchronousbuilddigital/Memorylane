"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Hallway Gallery
   A walnut-panelled corridor hung with the family's photographs. Scrolling or
   dragging over the 3D pane walks the camera down the hall; the text panel
   beside it scrolls the page as normal.
   Only the eight lights nearest the camera are real; the rest are emissive
   fixtures with glow sprites, so the hall can be as long as the album needs.
   ──────────────────────────────────────────────────────────────────────────── */

const scrollState = { progress: 0, targetProgress: 0 };

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_900/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_900/memory_lane/stock/photo-1502086223501-7ea6ecd79368",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_900/memory_lane/stock/photo-1542037104857-ffbb0b9155fb",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_900/memory_lane/stock/photo-1609220136736-443140cffec6",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_900/memory_lane/stock/photo-1609234656388-0ff363383899",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_900/memory_lane/stock/photo-1475503572774-15a45e5d60b9",
];

/* ───────────── Hall dimensions ───────────── */
const HALL_W = 5.6, HALL_H = 5.4, WAIN_H = 1.4, HALL_START = 10;
const WALL_X = HALL_W / 2;
const FRAME_Y = 2.05, FRAME_H = 1.35, FRAME_SPACING = 5.0, FIRST_FRAME_Z = 4;
const PENDANT_Y = HALL_H - 0.95;
const CAM_START_Z = 6, CAM_Y = 1.8;

type FrameSlot = { side: -1 | 1; z: number; idx: number };

// The hall grows with the album: frames alternate sides, staggered so you meet one at a time
function hallLayout(count: number) {
  const perSide = Math.max(4, Math.ceil(count / 2));
  const frames: FrameSlot[] = [];
  for (let i = 0; i < perSide; i++) {
    const z = FIRST_FRAME_Z - i * FRAME_SPACING;
    frames.push({ side: -1, z, idx: i * 2 });
    frames.push({ side: 1, z: z - FRAME_SPACING / 2, idx: i * 2 + 1 });
  }
  const used = frames.filter((f) => f.idx < Math.max(count, 8));
  const lastZ = Math.min(...used.map((f) => f.z));
  const camEnd = lastZ - 3;
  const hallEnd = camEnd - 9;
  const pendants: number[] = [];
  for (let z = HALL_START - 2.5; z > hallEnd + 2; z -= 5) pendants.push(z);
  const beams: number[] = [];
  for (let z = HALL_START; z > hallEnd; z -= 5) beams.push(z);
  const pilasters: number[] = [];
  for (let z = HALL_START - 5; z > hallEnd + 4; z -= 10) pilasters.push(z);
  return { frames: used, camEnd, hallEnd, length: HALL_START - hallEnd, mid: (HALL_START + hallEnd) / 2, pendants, beams, pilasters };
}

/* ───────────── Deterministic random ───────────── */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────── Procedural textures (generated once, client-side) ───────────── */
const texCache = new Map<string, THREE.Texture>();
function roomTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, mulberry32(key.length * 7919 + w));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache.set(key, t);
  return t;
}

function grainLines(ctx: CanvasRenderingContext2D, rnd: () => number, w: number, h: number, lines: number, vertical: boolean, alpha: number) {
  for (let i = 0; i < lines; i++) {
    const base = rnd() * (vertical ? w : h);
    const amp = 2 + rnd() * 8, freq = 0.004 + rnd() * 0.012, ph = rnd() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${10 + (rnd() * 30) | 0}, ${4 + (rnd() * 10) | 0}, 0, ${alpha * (0.4 + rnd())})`;
    ctx.lineWidth = 0.5 + rnd() * 1.6;
    ctx.beginPath();
    const len = vertical ? h : w;
    for (let s = 0; s <= len; s += 6) {
      const off = base + Math.sin(s * freq + ph) * amp;
      const x = vertical ? off : s, y = vertical ? s : off;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// Walnut planks (vertical): wainscot, pilasters, and — darkened — the floorboards
const getPanelTex = () => roomTex("panel", 1024, 1024, (ctx, rnd) => {
  const pw = 128;
  for (let p = 0; p < 8; p++) {
    const l = 0.86 + rnd() * 0.28;
    ctx.fillStyle = `rgb(${(80 * l) | 0}, ${(44 * l) | 0}, ${(20 * l) | 0})`;
    ctx.fillRect(p * pw, 0, pw, 1024);
  }
  grainLines(ctx, rnd, 1024, 1024, 260, true, 0.16);
  for (let p = 0; p < 8; p++) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(p * pw, 0, 3, 1024);
    ctx.fillStyle = "rgba(255,225,190,0.10)"; ctx.fillRect(p * pw + 3, 0, 2, 1024);
  }
});

const getPlasterTex = () => roomTex("plaster", 512, 512, (ctx, rnd) => {
  ctx.fillStyle = "#3a2c22"; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 8 + rnd() * 50;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rnd() < 0.5 ? "rgba(0,0,0,0.10)" : "rgba(255,225,190,0.07)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let i = 0; i < 6000; i++) ctx.fillRect(rnd() * 512, rnd() * 512, 1, 1);
});

// Woven runner: gold borders along the long edges, a lattice field, repeats down the hall
const getRunnerTex = () => roomTex("runner", 512, 1024, (ctx, rnd) => {
  const W = 512, H = 1024;
  ctx.fillStyle = "#5c1f1f"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(0,0,0,0.10)"; ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 3) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  const band = (x: number, w: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x, 0, w, H); ctx.fillRect(W - x - w, 0, w, H); };
  band(0, 14, "#2b0f0f"); band(20, 6, "#c39a4a"); band(32, 28, "#3a1414"); band(66, 4, "#c39a4a");
  const dia = (cx: number, cy: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
  };
  ctx.fillStyle = "#a8763a";
  for (let y = 24; y < H; y += 48) { dia(46, y, 8); ctx.fill(); dia(W - 46, y, 8); ctx.fill(); }
  ctx.strokeStyle = "rgba(195,154,74,0.35)"; ctx.lineWidth = 2;
  for (let x = 128; x <= W - 128; x += 64) for (let y = 32; y < H; y += 64) { dia(x, y, 22); ctx.stroke(); }
  ctx.fillStyle = "#c39a4a";
  for (let y = 0; y < H; y += 128) { dia(W / 2, y + 64, 34); ctx.fill(); ctx.fillStyle = "#3a1414"; dia(W / 2, y + 64, 18); ctx.fill(); ctx.fillStyle = "#c39a4a"; }
  void rnd;
});

const getGlowTex = () => {
  const hit = texCache.get("glow");
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,235,200,0.5)"); g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set("glow", t);
  return t;
};

function useRepeat(get: () => THREE.Texture, rx: number, ry: number, rotation = 0) {
  return useMemo(() => {
    const t = get().clone();
    t.repeat.set(rx, ry);
    t.rotation = rotation;
    t.needsUpdate = true;
    return t;
  }, [get, rx, ry, rotation]);
}

/* ───────────── Photo textures: once per URL, sized for the GPU, aspect kept ───────────── */
function sizedUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_1200,c_limit,q_auto,f_auto/");
}

function makePlaceholderTex(idx: number) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 192;
  const ctx = c.getContext("2d")!;
  const warm = ["#c4a882", "#b89a72", "#d4b896", "#a08060", "#c8aa80", "#b8986e"];
  ctx.fillStyle = warm[idx % warm.length]; ctx.fillRect(0, 0, 256, 192);
  const g = ctx.createRadialGradient(128, 96, 30, 128, 96, 140);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 192);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type PhotoEntry = { tex: THREE.Texture; aspect: number; loaded: boolean; listeners: Set<() => void> };
const photoCache = new Map<string, PhotoEntry>();

function getPhoto(url: string, idx: number): PhotoEntry {
  const hit = photoCache.get(url);
  if (hit) return hit;
  const entry: PhotoEntry = { tex: makePlaceholderTex(idx), aspect: 4 / 3, loaded: false, listeners: new Set() };
  photoCache.set(url, entry);
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(sizedUrl(url), (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const img = t.image as { width?: number; height?: number };
    entry.aspect = img?.width && img?.height ? img.width / img.height : 4 / 3;
    entry.tex = t;
    entry.loaded = true;
    entry.listeners.forEach((l) => l());
  }, undefined, () => { /* keep the warm placeholder */ });
  return entry;
}

function usePhoto(url: string, idx: number) {
  const [state, setState] = useState(() => { const e = getPhoto(url, idx); return { tex: e.tex, aspect: e.aspect }; });
  useEffect(() => {
    const e = getPhoto(url, idx);
    setState({ tex: e.tex, aspect: e.aspect });
    if (e.loaded) return;
    const l = () => setState({ tex: e.tex, aspect: e.aspect });
    e.listeners.add(l);
    return () => { e.listeners.delete(l); };
  }, [url, idx]);
  return state;
}

/* ───────────── Materials ───────────── */
const BRASS = { color: "#c9a24a", metalness: 0.85, roughness: 0.35 } as const;
const TRIM = { color: "#2a160a", roughness: 0.55 } as const;

/* ───────────── Hover state shared with the light pool ───────────── */
const hoverState = { idx: -1 };

/* ───────────── Brass caption plaque (canvas texture, cached per caption) ───────────── */
const plaqueCache = new Map<string, THREE.Texture>();
function getPlaqueTex(text: string) {
  const hit = plaqueCache.get(text);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 512; c.height = 112;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 112);
  g.addColorStop(0, "#e6c56d"); g.addColorStop(0.5, "#c9a24a"); g.addColorStop(1, "#d9b453");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 112);
  ctx.strokeStyle = "rgba(60,40,10,0.7)"; ctx.lineWidth = 4; ctx.strokeRect(6, 6, 500, 100);
  ctx.strokeStyle = "rgba(255,240,190,0.5)"; ctx.lineWidth = 2; ctx.strokeRect(11, 11, 490, 90);
  ctx.font = 'bold 44px Georgia, "Times New Roman", serif';
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,240,190,0.7)"; ctx.fillText(text, 255, 55);
  ctx.fillStyle = "#3b2609"; ctx.fillText(text, 256, 57);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  plaqueCache.set(text, t);
  return t;
}

/* ───────────── A framed print with its picture light and caption ───────────── */
function GalleryFrame({ url, caption, idx, side, z, onOpen }: {
  url: string; caption: string; idx: number; side: -1 | 1; z: number; onOpen: (url: string) => void;
}) {
  const { tex, aspect } = usePhoto(url, idx);
  const h = FRAME_H, w = THREE.MathUtils.clamp(h * aspect, 0.95, 2.1);
  const rotY = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const inner = useRef<THREE.Group>(null);
  const tube = useRef<THREE.MeshStandardMaterial>(null);

  // Hover: the frame eases off the wall a touch and its picture light warms up
  useFrame(() => {
    if (inner.current) inner.current.position.z += ((hovered ? 0.07 : 0) - inner.current.position.z) * 0.12;
    if (tube.current) tube.current.emissiveIntensity += ((hovered ? 3.2 : 1.6) - tube.current.emissiveIntensity) * 0.12;
  });

  return (
    <group position={[side * (WALL_X - 0.05), FRAME_Y, z]} rotation={[0, rotY, 0]}>
      <group
        ref={inner}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); hoverState.idx = idx; }}
        onPointerOut={() => { setHovered(false); if (hoverState.idx === idx) hoverState.idx = -1; }}
        onClick={(e) => { e.stopPropagation(); onOpen(url); }}
      >
        {/* brass frame, cream mat, the print */}
        <mesh castShadow><boxGeometry args={[w + 0.22, h + 0.22, 0.08]} /><meshStandardMaterial {...BRASS} /></mesh>
        <mesh position={[0, 0, 0.041]}><planeGeometry args={[w + 0.14, h + 0.14]} /><meshStandardMaterial color="#efe6d3" roughness={1} /></mesh>
        <mesh position={[0, 0, 0.046]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.5} /></mesh>

        {/* caption plaque */}
        <group position={[0, -h / 2 - 0.2, 0.02]}>
          <mesh><boxGeometry args={[0.72, 0.16, 0.02]} /><meshStandardMaterial {...BRASS} /></mesh>
          <mesh position={[0, 0, 0.011]}>
            <planeGeometry args={[0.7, 0.14]} />
            <meshStandardMaterial map={getPlaqueTex(caption)} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* picture light: back plate, arm, brass hood, glowing tube */}
      <group position={[0, h / 2 + 0.3, 0.05]}>
        <mesh position={[0, 0, -0.03]}><boxGeometry args={[0.14, 0.18, 0.04]} /><meshStandardMaterial {...BRASS} /></mesh>
        <mesh position={[0, 0.02, 0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.016, 0.016, 0.22, 8]} /><meshStandardMaterial {...BRASS} /></mesh>
        <mesh position={[0, 0.04, 0.2]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, w * 0.6, 12]} /><meshStandardMaterial {...BRASS} /></mesh>
        <mesh position={[0, 0.0, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.028, 0.028, w * 0.58, 10, 1, true]} />
          <meshStandardMaterial ref={tube} color="#fff0d0" emissive="#ffcf8a" emissiveIntensity={1.6} side={THREE.DoubleSide} />
        </mesh>
        <sprite position={[0, -0.05, 0.2]} scale={[0.5, 0.25, 1]}>
          <spriteMaterial map={getGlowTex()} color="#ffd9a8" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </group>
  );
}

/* ───────────── Brass lantern hanging in a ceiling coffer ───────────── */
function Lantern({ z }: { z: number }) {
  return (
    <group position={[0, PENDANT_Y, z]}>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.012, 0.012, 0.7, 6]} /><meshStandardMaterial color="#2a2018" metalness={0.6} roughness={0.5} /></mesh>
      <mesh position={[0, 0.24, 0]}><coneGeometry args={[0.24, 0.16, 4]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.32, 0.4, 0.32]} />
        <meshStandardMaterial color="#ffe0b0" emissive="#ffb870" emissiveIntensity={1.2} transparent opacity={0.6} roughness={0.4} />
      </mesh>
      {[[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].map(([x, zz], i) => (
        <mesh key={i} position={[x, 0, zz]}><boxGeometry args={[0.025, 0.42, 0.025]} /><meshStandardMaterial {...BRASS} /></mesh>
      ))}
      <mesh position={[0, -0.23, 0]}><boxGeometry args={[0.36, 0.05, 0.36]} /><meshStandardMaterial {...BRASS} /></mesh>
      <sprite scale={[1.1, 1.1, 1]}>
        <spriteMaterial map={getGlowTex()} color="#ffc98a" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ───────────── Light pools: a few real lights that jump to the fixtures nearest the camera ───────────── */
function PendantLights({ pendants }: { pendants: number[] }) {
  const refs = useRef<(THREE.PointLight | null)[]>([]);
  const N = 4;
  useFrame(({ camera }) => {
    const nearest = [...pendants].sort((a, b) => Math.abs(a - camera.position.z) - Math.abs(b - camera.position.z)).slice(0, N);
    refs.current.forEach((l, i) => {
      if (!l) return;
      const z = nearest[i];
      if (z === undefined) { l.intensity = 0; return; }
      l.position.set(0, PENDANT_Y - 0.25, z);
      l.intensity = 22;
    });
  });
  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <pointLight key={i} ref={(el) => { refs.current[i] = el; }} color="#ffc27a" intensity={0} distance={14} decay={2} />
      ))}
    </>
  );
}

function PictureLights({ frames }: { frames: FrameSlot[] }) {
  const N = 4;
  const lights = useRef<(THREE.SpotLight | null)[]>([]);
  const targets = useMemo(() => Array.from({ length: N }, () => new THREE.Object3D()), []);
  useFrame(({ camera }) => {
    const nearest = [...frames].sort((a, b) => Math.abs(a.z - camera.position.z) - Math.abs(b.z - camera.position.z)).slice(0, N);
    lights.current.forEach((l, i) => {
      if (!l) return;
      const f = nearest[i];
      if (!f) { l.intensity = 0; return; }
      l.position.set(f.side * (WALL_X - 0.25), FRAME_Y + FRAME_H / 2 + 0.34, f.z);
      targets[i].position.set(f.side * WALL_X, FRAME_Y - 0.25, f.z);
      l.intensity = hoverState.idx === f.idx ? 9 : 5;
    });
  });
  return (
    <>
      {targets.map((t, i) => (
        <React.Fragment key={i}>
          <primitive object={t} />
          <spotLight
            ref={(el) => { lights.current[i] = el; }}
            target={t}
            color="#ffd9a8"
            intensity={0}
            angle={0.75}
            penumbra={0.7}
            distance={5}
            decay={2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
            shadow-camera-near={0.2}
            shadow-camera-far={6}
          />
        </React.Fragment>
      ))}
    </>
  );
}

/* ───────────── The corridor ───────────── */
function Hall({ items, onOpen }: { items: Item[]; onOpen: (url: string) => void }) {
  const L = useMemo(() => hallLayout(items.length), [items.length]);
  const len = L.length, mid = L.mid;

  const plaster = useRepeat(getPlasterTex, len / 4.4, 1.2);
  const wain = useRepeat(getPanelTex, len / 4.4, 1);
  const floor = useRepeat(getPanelTex, HALL_W / 2.2, len / 4.4);
  const ceiling = useRepeat(getPlasterTex, HALL_W / 4.4, len / 4.4);
  const runner = useRepeat(getRunnerTex, 1, len / 4);
  const panelSpots = useMemo(() => {
    const out: number[] = [];
    for (let z = HALL_START - 1.6; z > L.hallEnd + 1; z -= 2.2) if (!L.pilasters.some((p) => Math.abs(p - z) < 1.2)) out.push(z);
    return out;
  }, [L]);

  return (
    <group>
      <color attach="background" args={["#140a05"]} />
      <fog attach="fog" args={["#140a05", 12, 44]} />
      <ambientLight intensity={0.25} color="#ffe3c4" />
      <hemisphereLight args={["#ffdcb8", "#2a1208", 0.25]} />

      {/* Floorboards and the runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, mid]} receiveShadow>
        <planeGeometry args={[HALL_W, len]} />
        <meshStandardMaterial map={floor} color="#8a6a4e" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, mid]} receiveShadow>
        <planeGeometry args={[2.4, len]} />
        <meshStandardMaterial map={runner} roughness={0.95} />
      </mesh>

      {/* Coffered ceiling with beams */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL_H, mid]}>
        <planeGeometry args={[HALL_W, len]} />
        <meshStandardMaterial map={ceiling} color="#c9b8a0" roughness={0.95} />
      </mesh>
      {L.beams.map((z) => (
        <mesh key={`beam-${z}`} position={[0, HALL_H - 0.14, z]} castShadow>
          <boxGeometry args={[HALL_W, 0.28, 0.3]} />
          <meshStandardMaterial map={wain} color="#8f7358" roughness={0.5} metalness={0.08} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`rail-${s}`} position={[s * (WALL_X - 0.2), HALL_H - 0.14, mid]}>
          <boxGeometry args={[0.4, 0.28, len]} />
          <meshStandardMaterial map={wain} color="#8f7358" roughness={0.5} metalness={0.08} />
        </mesh>
      ))}
      {L.pendants.map((z) => <Lantern key={`lantern-${z}`} z={z} />)}

      {/* Walls: plaster above, walnut wainscot below, brass rail, skirting, raised panels, pilasters */}
      {[-1, 1].map((s) => {
        const rotY = s < 0 ? Math.PI / 2 : -Math.PI / 2;
        return (
          <group key={`wall-${s}`}>
            <mesh position={[s * WALL_X, WAIN_H + (HALL_H - WAIN_H) / 2, mid]} rotation={[0, rotY, 0]} receiveShadow>
              <planeGeometry args={[len, HALL_H - WAIN_H]} />
              <meshStandardMaterial map={plaster} roughness={0.92} />
            </mesh>
            <mesh position={[s * (WALL_X - 0.01), WAIN_H / 2, mid]} rotation={[0, rotY, 0]} receiveShadow>
              <planeGeometry args={[len, WAIN_H]} />
              <meshStandardMaterial map={wain} color="#8f7358" roughness={0.5} metalness={0.08} />
            </mesh>
            {panelSpots.map((z) => (
              <mesh key={`panel-${s}-${z}`} position={[s * (WALL_X - 0.03), WAIN_H / 2 + 0.02, z]} rotation={[0, rotY, 0]} receiveShadow>
                <boxGeometry args={[1.5, WAIN_H - 0.4, 0.03]} />
                <meshStandardMaterial map={wain} color="#a58462" roughness={0.45} metalness={0.08} />
              </mesh>
            ))}
            <mesh position={[s * (WALL_X - 0.04), WAIN_H, mid]}>
              <boxGeometry args={[0.08, 0.09, len]} />
              <meshStandardMaterial {...BRASS} />
            </mesh>
            <mesh position={[s * (WALL_X - 0.03), 0.08, mid]}>
              <boxGeometry args={[0.06, 0.16, len]} />
              <meshStandardMaterial {...TRIM} />
            </mesh>
            {L.pilasters.map((z) => (
              <group key={`pilaster-${s}-${z}`} position={[s * (WALL_X - 0.15), 0, z]}>
                <mesh position={[0, HALL_H / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.3, HALL_H, 0.55]} />
                  <meshStandardMaterial map={wain} color="#8f7358" roughness={0.5} metalness={0.08} />
                </mesh>
                <mesh position={[0, HALL_H - 0.45, 0]}><boxGeometry args={[0.36, 0.12, 0.62]} /><meshStandardMaterial {...BRASS} /></mesh>
                <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.36, 0.24, 0.62]} /><meshStandardMaterial {...TRIM} /></mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* The photographs */}
      {L.frames.map((f) => {
        const it = items[f.idx % items.length];
        return <GalleryFrame key={`frame-${f.idx}`} url={it.url} caption={it.caption} idx={f.idx} side={f.side} z={f.z} onOpen={onOpen} />;
      })}

      {/* A place to sit, and something green, by the arch */}
      <Bench position={[-(WALL_X - 0.4), 0, L.hallEnd + 3.2]} rotation={[0, Math.PI / 2, 0]} />
      <Plant position={[WALL_X - 0.5, 0, L.hallEnd + 3.0]} />

      {/* Far end: a warm-lit archway */}
      <group position={[0, 0, L.hallEnd]}>
        <mesh position={[0, HALL_H / 2, 0]} receiveShadow>
          <planeGeometry args={[HALL_W, HALL_H]} />
          <meshStandardMaterial map={plaster} roughness={0.92} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.35, 1.6, 0.12]} castShadow>
            <boxGeometry args={[0.5, 3.2, 0.24]} />
            <meshStandardMaterial map={wain} color="#8f7358" roughness={0.5} metalness={0.08} />
          </mesh>
        ))}
        <mesh position={[0, 3.2, 0.12]} castShadow>
          <torusGeometry args={[1.35, 0.25, 8, 24, Math.PI]} />
          <meshStandardMaterial map={wain} color="#8f7358" roughness={0.5} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.6, 0.02]}>
          <planeGeometry args={[2.2, 3.2]} />
          <meshBasicMaterial color="#ffb877" />
        </mesh>
        <mesh position={[0, 3.2, 0.02]} rotation={[0, 0, 0]}>
          <circleGeometry args={[1.1, 24, 0, Math.PI]} />
          <meshBasicMaterial color="#ffb877" />
        </mesh>
        <pointLight position={[0, 2.2, 1.2]} color="#ffb877" intensity={40} distance={22} decay={2} />
        <sprite position={[0, 2.2, 0.3]} scale={[4, 4, 1]}>
          <spriteMaterial map={getGlowTex()} color="#ffb877" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>

      <PendantLights pendants={L.pendants} />
      <PictureLights frames={L.frames} />
      <WalkCamera frames={L.frames} camEnd={L.camEnd} />
    </group>
  );
}

/* Walk the hall: ease up a little as each picture comes into view, glance at it, then move on.
   The glance is sized to the pane: a narrow pane looks at pictures from further away so they fit. */
const FOCUS_AHEAD = 2.4;                                // how far ahead a picture is when we look at it
const YAW_MAX = THREE.MathUtils.degToRad(42);
const FRAME_HALF_W = 1.25;

function WalkCamera({ frames, camEnd }: { frames: FrameSlot[]; camEnd: number }) {
  // Scroll → z lookup with the camera spending more scroll around each glance
  const table = useMemo(() => {
    const N = 400;
    const zs: number[] = [], cum: number[] = [];
    let acc = 0;
    for (let i = 0; i <= N; i++) {
      const z = THREE.MathUtils.lerp(CAM_START_Z, camEnd, i / N);
      const d = Math.min(...frames.map((f) => Math.abs((z - f.z) - FOCUS_AHEAD)));
      const speed = THREE.MathUtils.lerp(0.55, 1, THREE.MathUtils.smoothstep(d, 0.5, 1.5));
      zs.push(z); cum.push(acc);
      acc += 1 / speed;
    }
    return { zs, cum: cum.map((c) => c / acc) };
  }, [frames, camEnd]);

  const zAt = (p: number) => {
    const { zs, cum } = table;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= p) lo = m; else hi = m; }
    const span = cum[hi] - cum[lo] || 1;
    return THREE.MathUtils.lerp(zs[lo], zs[hi], (p - cum[lo]) / span);
  };

  const look = useRef(new THREE.Vector3(0, CAM_Y - 0.05, CAM_START_Z - 10));
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, clock }) => {
    scrollState.progress += (scrollState.targetProgress - scrollState.progress) * 0.08;
    const z = zAt(scrollState.progress);
    const t = clock.elapsedTime;
    camera.position.set(Math.sin(t * 0.4) * 0.04, CAM_Y + Math.sin(z * 1.6) * 0.012 + Math.sin(t * 0.7) * 0.01, z);

    // How wide is the view? A narrow pane has to look at pictures from further away for them to fit.
    const cam = camera as THREE.PerspectiveCamera;
    const hfovHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect);
    const margin = THREE.MathUtils.degToRad(3);
    const minDist = FRAME_HALF_W / Math.tan(Math.max(hfovHalf - margin, 0.15));
    const focusAhead = Math.max(FOCUS_AHEAD, Math.sqrt(Math.max(0, minDist * minDist - WALL_X * WALL_X)) + 0.6);

    // The picture closest to its glance moment: attention fades in as it approaches, out once we pass it
    let best: FrameSlot | null = null, bw = 0;
    for (const f of frames) {
      const a = z - f.z;                                  // how far ahead of us the picture is
      const w = (1 - THREE.MathUtils.smoothstep(a, focusAhead + 0.8, focusAhead + 3.2))
              * THREE.MathUtils.smoothstep(a, focusAhead - 1.2, focusAhead - 0.4);
      if (w > bw) { bw = w; best = f; }
    }
    let yaw = 0, side = 1;
    if (best && bw > 0) {
      side = best.side;
      const a = Math.max(0.5, z - best.z);
      const bearing = Math.atan2(WALL_X, a);              // where the picture is, relative to straight ahead
      const frameHalf = Math.atan(FRAME_HALF_W / Math.hypot(a, WALL_X));
      const room = Math.max(0, hfovHalf - frameHalf - margin);
      // turn towards it, leaving it a little off-centre so the hall stays in view and it never clips
      yaw = Math.min(YAW_MAX, Math.max(0, bearing - room * 0.5)) * bw;
    }
    target.set(
      camera.position.x + Math.sin(yaw) * side * 10 + Math.sin(t * 0.3 + 1) * 0.06,
      CAM_Y - 0.05 + bw * 0.7,
      z - Math.cos(yaw) * 10,
    );
    look.current.lerp(target, 0.06);
    camera.lookAt(look.current);
  });
  return null;
}

/* ───────────── Furniture by the archway ───────────── */
function Bench({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const wood = { color: "#3b1f0c", roughness: 0.55 } as const;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.08, 0.46]} /><meshStandardMaterial {...wood} /></mesh>
      <mesh position={[0, 0.53, 0]} castShadow><boxGeometry args={[1.4, 0.09, 0.4]} /><meshStandardMaterial color="#4a2626" roughness={0.9} /></mesh>
      {[-0.66, 0.66].map((x) => (
        <mesh key={x} position={[x, 0.225, 0]} castShadow><boxGeometry args={[0.08, 0.45, 0.42]} /><meshStandardMaterial {...wood} /></mesh>
      ))}
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[1.3, 0.05, 0.06]} /><meshStandardMaterial {...wood} /></mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  const leaves = useMemo(() => {
    const rnd = mulberry32(21);
    return Array.from({ length: 11 }, (_, i) => ({
      yaw: (i / 11) * Math.PI * 2 + rnd() * 0.5,
      tilt: 0.55 + rnd() * 0.6,
      len: 0.7 + rnd() * 0.5,
      shade: rnd() < 0.5 ? "#3f6b2a" : "#4f7d33",
    }));
  }, []);
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.24, 0.18, 0.4, 20]} /><meshStandardMaterial color="#8b4a2b" roughness={0.9} /></mesh>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.26, 0.26, 0.03, 20]} /><meshStandardMaterial color="#a05a35" roughness={0.9} /></mesh>
      <mesh position={[0, 0.41, 0]}><cylinderGeometry args={[0.2, 0.2, 0.02, 20]} /><meshStandardMaterial color="#2a1a0c" roughness={1} /></mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.42, 0]} rotation={[0, l.yaw, 0]}>
          <mesh position={[0, l.len * 0.45, 0]} rotation={[l.tilt, 0, 0]}>
            <planeGeometry args={[0.18, l.len, 1, 4]} />
            <meshStandardMaterial color={l.shade} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
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
        <motion.div
          key="hall-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0503]/90 backdrop-blur-md"
          onClick={onClose}
        >
          <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={22} />
          </button>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative p-3 bg-[#efe6d3] shadow-[0_40px_80px_rgba(0,0,0,0.7)] rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
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
type ImageLike = string | { displayUrl?: string; url?: string; takenAt?: string | Date | null };
type Item = { url: string; caption: string };

function captionFor(img: ImageLike, k: number) {
  const taken = typeof img === "string" ? null : img?.takenAt;
  if (taken) {
    const d = new Date(taken);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  return `No. ${k + 1}`;
}

export default function FamilyFunctionHallwayGallery({ images = [] }: { images?: ImageLike[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = useMemo<Item[]>(() => {
    const out = images
      .map((i, k) => ({ url: typeof i === "string" ? i : i?.displayUrl || i?.url || "", caption: captionFor(i, k) }))
      .filter((it) => it.url.length > 0);
    return out.length ? out : PLACEHOLDERS.map((url, k) => ({ url, caption: `No. ${k + 1}` }));
  }, [images]);

  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);

  // Wheel or touch-drag over the 3D pane walks the hall. At either end the event is left alone,
  // so the page scrolls on normally. The text panel next door never captures anything.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const step = (delta: number) => {
      const p = scrollState.targetProgress;
      if ((delta > 0 && p >= 1) || (delta < 0 && p <= 0)) return false;
      scrollState.targetProgress = THREE.MathUtils.clamp(p + delta, 0, 1);
      return true;
    };
    const onWheel = (e: WheelEvent) => { if (step(e.deltaY * 0.0007)) e.preventDefault(); };
    let lastY: number | null = null;
    const onTouchStart = (e: TouchEvent) => { lastY = e.touches[0]?.clientY ?? null; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y == null || lastY == null) return;
      const dy = lastY - y;
      lastY = y;
      if (step(dy * 0.0025)) e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      scrollState.progress = 0;
      scrollState.targetProgress = 0;
      hoverState.idx = -1;
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: "#140a05" }}>
      <Canvas
        camera={{ position: [0, CAM_Y, CAM_START_Z], fov: 60, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        dpr={[1, 1.75]}
        shadows
      >
        <React.Suspense fallback={null}>
          <Hall items={items} onOpen={setOpen} />
        </React.Suspense>
      </Canvas>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-6 right-6 md:bottom-8 md:right-10 z-10 flex items-center gap-2 max-w-[60%] justify-end text-right md:max-w-none md:justify-start md:text-left text-white/50 text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-bold">
        <span className="md:hidden">Swipe to walk · Tap a picture</span>
        <span className="hidden md:inline">Scroll here to walk · Click a picture to view</span>
        <div className="w-8 h-[1px] bg-white/30" />
      </div>

      <PhotoLightbox url={open} onClose={close} />
    </div>
  );
}
