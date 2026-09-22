"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, MeshReflectorMaterial, RoundedBox, Sparkles, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { fillCount } from "./familyFunctionText";

/* ────────────────────────────────────────────────────────────────────────────
   Flip-Cube Photo Wall
   A wall of wooden blocks, each face carrying a printed photo, hung in a
   warm walnut-panelled room lit by a pair of brass wall sconces. Blocks
   turn on their own (single flips + row/column waves), turn on hover, and
   open a lightbox on click. Every face is pre-assigned a photo, so a block
   always lands on a picture.
   ──────────────────────────────────────────────────────────────────────────── */

type ImageLike = string | { displayUrl?: string; originalUrl?: string; url?: string; position?: number };

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1502086223501-7ea6ecd79368",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1542037104857-ffbb0b9155fb",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1609220136736-443140cffec6",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1609234656388-0ff363383899",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1475503572774-15a45e5d60b9",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1511795409834-ef04bbd61622",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1601288496920-b6154fe3626a",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1544568100-847a948585b9",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1499856871958-5b9627545d1a",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1506748686214-e9df14d4d9d0",
];

/* ───────────── Deterministic random (keeps the wall identical between renders) ───────────── */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────── Photo textures ───────────── */
function makePlaceholderTex(idx: number): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  const warm = ["#c4a882", "#b89a72", "#d4b896", "#a08060", "#c8aa80", "#b8986e"];
  ctx.fillStyle = warm[idx % warm.length];
  ctx.fillRect(0, 0, 256, 256);
  const g = ctx.createRadialGradient(128, 128, 30, 128, 128, 180);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Center-crop any aspect ratio onto a square face
function coverSquare(t: THREE.Texture) {
  const img = t.image as { width?: number; height?: number };
  if (!img?.width || !img?.height) return;
  const a = img.width / img.height;
  if (a > 1) { t.repeat.set(1 / a, 1); t.offset.set((1 - 1 / a) / 2, 0); }
  else { t.repeat.set(1, a); t.offset.set(0, (1 - a) / 2); }
  t.needsUpdate = true;
}

// Uploads are stored as full-size Cloudinary URLs; a tile only needs ~800px.
// Cloudinary resizes on the fly when a transform segment follows /upload/.
function sizedUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url; // already transformed
  return url.replace("/upload/", "/upload/w_800,c_limit,q_auto,f_auto/");
}

type TexEntry = { tex: THREE.Texture; loaded: boolean; listeners: Set<() => void> };
const texCache = new Map<string, TexEntry>();

function getTexEntry(url: string, idx: number): TexEntry {
  const hit = texCache.get(url);
  if (hit) return hit;
  const entry: TexEntry = { tex: makePlaceholderTex(idx), loaded: false, listeners: new Set() };
  texCache.set(url, entry);
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(
    sizedUrl(url),
    (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      coverSquare(t);
      entry.tex = t;
      entry.loaded = true;
      entry.listeners.forEach((l) => l());
    },
    undefined,
    () => { /* keep the warm placeholder on error */ },
  );
  return entry;
}

function usePhotoTexture(url: string, idx: number) {
  const [tex, setTex] = useState<THREE.Texture>(() => getTexEntry(url, idx).tex);
  useEffect(() => {
    const e = getTexEntry(url, idx);
    setTex(e.tex);
    if (e.loaded) return;
    const l = () => setTex(e.tex);
    e.listeners.add(l);
    return () => { e.listeners.delete(l); };
  }, [url, idx]);
  return tex;
}

/* ───────────── Procedural material textures (generated once, client-side) ───────────── */
const texOnce = new Map<string, THREE.Texture>();

function canvasTex(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void, repeat = true) {
  const hit = texOnce.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  draw(c.getContext("2d")!, mulberry32(key.length * 7919));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  texOnce.set(key, t);
  return t;
}

// Wavy grain lines used by every wood surface
function grain(ctx: CanvasRenderingContext2D, rnd: () => number, size: number, lines: number, vertical: boolean, alpha: number) {
  for (let i = 0; i < lines; i++) {
    const base = rnd() * size;
    const amp = 2 + rnd() * 8, freq = 0.004 + rnd() * 0.012, ph = rnd() * Math.PI * 2;
    ctx.strokeStyle = `rgba(${10 + (rnd() * 30) | 0}, ${4 + (rnd() * 10) | 0}, 0, ${alpha * (0.4 + rnd())})`;
    ctx.lineWidth = 0.5 + rnd() * 1.6;
    ctx.beginPath();
    for (let s = 0; s <= size; s += 6) {
      const off = base + Math.sin(s * freq + ph) * amp;
      const x = vertical ? off : s, y = vertical ? s : off;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// Block sides
const getWoodTex = () => canvasTex("wood", 512, (ctx, rnd) => {
  ctx.fillStyle = "#6b3d1d";
  ctx.fillRect(0, 0, 512, 512);
  grain(ctx, rnd, 512, 160, false, 0.18);
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, "rgba(255,220,180,0.10)"); g.addColorStop(1, "rgba(0,0,0,0.20)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
});

// Walnut wall panelling: 8 vertical planks per tile
const getWallTex = () => canvasTex("wall", 1024, (ctx, rnd) => {
  const pw = 128;
  for (let p = 0; p < 8; p++) {
    const l = 0.86 + rnd() * 0.28;
    ctx.fillStyle = `rgb(${(92 * l) | 0}, ${(52 * l) | 0}, ${(24 * l) | 0})`;
    ctx.fillRect(p * pw, 0, pw, 1024);
  }
  grain(ctx, rnd, 1024, 260, true, 0.16);
  for (let p = 0; p < 8; p++) {
    // groove + highlight at each plank edge
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(p * pw, 0, 3, 1024);
    ctx.fillStyle = "rgba(255,225,190,0.10)"; ctx.fillRect(p * pw + 3, 0, 2, 1024);
  }
});

// Floorboards: 4 horizontal boards per tile
const getFloorTex = () => canvasTex("floor", 1024, (ctx, rnd) => {
  const bh = 256;
  for (let b = 0; b < 4; b++) {
    const l = 0.8 + rnd() * 0.3;
    ctx.fillStyle = `rgb(${(70 * l) | 0}, ${(36 * l) | 0}, ${(16 * l) | 0})`;
    ctx.fillRect(0, b * bh, 1024, bh);
    // board joints
    const jx = rnd() * 1024;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(jx, b * bh, 3, bh);
  }
  grain(ctx, rnd, 1024, 220, false, 0.14);
  for (let b = 0; b < 4; b++) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, b * bh, 1024, 3);
    ctx.fillStyle = "rgba(255,225,190,0.08)"; ctx.fillRect(0, b * bh + 3, 1024, 2);
  }
});

/* ───────────── Face placement ─────────────
   Each block turns around ONE axis in 90° steps. The four faces on that axis
   carry photos, oriented so whichever one arrives at the front reads upright. */
type Face = { pos: [number, number, number]; rot: [number, number, number] };
const FACES_X: Face[] = [ // front → top → back → bottom
  { pos: [0, 0, 0.5], rot: [0, 0, 0] },
  { pos: [0, 0.5, 0], rot: [-Math.PI / 2, 0, 0] },
  { pos: [0, 0, -0.5], rot: [Math.PI, 0, 0] },
  { pos: [0, -0.5, 0], rot: [Math.PI / 2, 0, 0] },
];
const FACES_Y: Face[] = [ // front → left → back → right
  { pos: [0, 0, 0.5], rot: [0, 0, 0] },
  { pos: [-0.5, 0, 0], rot: [0, -Math.PI / 2, 0] },
  { pos: [0, 0, -0.5], rot: [0, Math.PI, 0] },
  { pos: [0.5, 0, 0], rot: [0, Math.PI / 2, 0] },
];

type CubeDef = { i: number; x: number; y: number; axis: "x" | "y"; faces: string[] };
type CubeState = { angle: number; target: number; vel: number; lastFlip: number; axis: "x" | "y" };

const QUARTER = Math.PI / 2;

/* ───────────── One printed photo on one face ───────────── */
function PhotoFace({ url, idx, face }: { url: string; idx: number; face: Face }) {
  const tex = usePhotoTexture(url, idx);
  return (
    <group position={face.pos} rotation={face.rot}>
      {/* Paper border of the print */}
      <mesh position={[0, 0, 0.003]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#e8dcc4" roughness={1} envMapIntensity={0.2} />
      </mesh>
      {/* The photograph — slightly glossy */}
      <mesh position={[0, 0, 0.006]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial map={tex} roughness={0.42} metalness={0} envMapIntensity={0.3} />
      </mesh>
    </group>
  );
}

/* ───────────── One wooden block ───────────── */
function FlipCube({
  cube, register, onHover, onOpen,
}: {
  cube: CubeDef;
  register: (el: THREE.Group | null) => void;
  onHover: () => void;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const faces = cube.axis === "x" ? FACES_X : FACES_Y;
  const wood = getWoodTex();

  return (
    <group
      ref={register}
      position={[cube.x, cube.y, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); onHover(); }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(); }}
    >
      <RoundedBox args={[1, 1, 1]} radius={0.045} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.62} metalness={0.02} envMapIntensity={0.35} />
      </RoundedBox>
      {faces.map((face, k) => (
        <PhotoFace key={k} url={cube.faces[k]} idx={cube.i * 4 + k} face={face} />
      ))}
    </group>
  );
}

const BRASS = { color: "#d4a94c", metalness: 0.8, roughness: 0.35, envMapIntensity: 1.4 } as const;
/* Brass wall sconce with a frosted shade and a warm light */
function Sconce({ position, intensity }: { position: [number, number, number]; intensity: number }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((st) => {
    if (light.current) light.current.intensity = intensity * (0.94 + 0.06 * Math.sin(st.clock.elapsedTime * 6.3 + position[0]));
  });
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.015]}><boxGeometry args={[0.16, 0.38, 0.03]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, -0.02, 0.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.018, 0.018, 0.22, 10]} /><meshStandardMaterial {...BRASS} /></mesh>
      <mesh position={[0, 0.02, 0.24]}><cylinderGeometry args={[0.045, 0.03, 0.08, 14]} /><meshStandardMaterial {...BRASS} /></mesh>
      {/* bulb */}
      <mesh position={[0, 0.13, 0.24]} scale={[1, 1.6, 1]}><sphereGeometry args={[0.035, 10, 10]} /><meshStandardMaterial color="#fff3d0" emissive="#ffcf7a" emissiveIntensity={3} /></mesh>
      {/* frosted shade */}
      <mesh position={[0, 0.16, 0.24]}>
        <cylinderGeometry args={[0.1, 0.065, 0.24, 20, 1, true]} />
        <meshStandardMaterial color="#ffe2b0" emissive="#ffb35c" emissiveIntensity={0.5} transparent opacity={0.45} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
      <pointLight ref={light} position={[0, 0.15, 0.32]} color="#ffc98a" distance={9} decay={2} intensity={intensity} />
    </group>
  );
}

/* The room: panelled wall, wainscot, chair rail, skirting, floor */
function Room({ floorY, wainH, reflective }: { floorY: number; wainH: number; reflective: boolean }) {
  const wall = getWallTex(), floor = getFloorTex();
  const wallRep = useMemo(() => { const t = wall.clone(); t.repeat.set(18, 11); t.needsUpdate = true; return t; }, [wall]);
  const wainRep = useMemo(() => { const t = wall.clone(); t.repeat.set(18, 2); t.needsUpdate = true; return t; }, [wall]);
  const floorRep = useMemo(() => { const t = floor.clone(); t.repeat.set(18, 3.6); t.needsUpdate = true; return t; }, [floor]);
  const railY = floorY + wainH;
  return (
    <group>
      {/* Upper wall */}
      <mesh position={[0, 0, -0.62]} receiveShadow>
        <planeGeometry args={[80, 50]} />
        <meshStandardMaterial map={wallRep} roughness={0.5} metalness={0.08} />
      </mesh>
      {/* Wainscot */}
      <mesh position={[0, floorY + wainH / 2, -0.6]} receiveShadow>
        <planeGeometry args={[80, wainH]} />
        <meshStandardMaterial map={wainRep} color="#8a6a4e" roughness={0.45} metalness={0.1} />
      </mesh>
      {/* Raised panels */}
      {Array.from({ length: 11 }, (_, i) => (i - 5) * 1.75).map((x) => (
        <mesh key={x} position={[x, floorY + wainH / 2 + 0.04, -0.585]} receiveShadow>
          <boxGeometry args={[1.25, wainH - 0.42, 0.025]} />
          <meshStandardMaterial map={wainRep} color="#a07c5c" roughness={0.42} metalness={0.1} />
        </mesh>
      ))}
      {/* Chair rail */}
      <mesh position={[0, railY, -0.57]} castShadow receiveShadow>
        <boxGeometry args={[80, 0.09, 0.07]} />
        <meshStandardMaterial color="#3b1f0c" roughness={0.45} metalness={0.1} />
      </mesh>
      {/* Skirting */}
      <mesh position={[0, floorY + 0.07, -0.58]} receiveShadow>
        <boxGeometry args={[80, 0.14, 0.05]} />
        <meshStandardMaterial color="#2c170a" roughness={0.5} />
      </mesh>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 7.4]} receiveShadow>
        <planeGeometry args={[80, 16]} />
        {reflective ? (
          <MeshReflectorMaterial
            map={floorRep}
            blur={[300, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={0.9}
            roughness={0.85}
            depthScale={0.8}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            color="#3a2010"
            metalness={0.15}
            mirror={0.35}
          />
        ) : (
          <meshStandardMaterial map={floorRep} color="#3a2010" roughness={0.55} metalness={0.15} />
        )}
      </mesh>
    </group>
  );
}

/* ═══════════════════════════ THE WALL ═══════════════════════════ */
function WallScene({ urls, onOpen }: { urls: string[]; onOpen: (url: string) => void }) {
  const { size, camera } = useThree();
  const aspect = size.width / size.height;
  const isMobile = size.width < 640;
  const { cols, rows } = aspect >= 1.45 ? { cols: 7, rows: 4 } : aspect >= 0.95 ? { cols: 5, rows: 4 } : { cols: 3, rows: 5 };
  const N = cols * rows;
  const PITCH = 1.1;
  const gridW = cols * PITCH - 0.1;
  const gridH = rows * PITCH - 0.1;

  // Shuffle once so the visible fronts don't follow upload order
  const pool = useMemo(() => {
    const rnd = mulberry32(97);
    const arr = [...urls];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [urls]);

  const cubes = useMemo<CubeDef[]>(() => {
    const rnd = mulberry32(1337);
    const list: CubeDef[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        list.push({
          i,
          x: (c - (cols - 1) / 2) * PITCH,
          y: ((rows - 1) / 2 - r) * PITCH,
          axis: rnd() < 0.5 ? "x" : "y",
          // face k of block i → spreads photos so every front is distinct
          faces: [0, 1, 2, 3].map((k) => pool[(i + k * N) % pool.length]),
        });
      }
    }
    return list;
  }, [pool, cols, rows, N]);

  // Camera distance: the grid fills ~50% of the height, leaving room for the heading above and a strip of floor below
  const FOV = 38;
  const dist = useMemo(() => {
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return Math.max(gridH / (0.5 * 2 * t), gridW / (0.86 * 2 * t * aspect));
  }, [gridW, gridH, aspect]);
  const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const camBaseY = visH * 0.06 + 0.35;
  const lookY = 0;

  // Mutable per-block state lives outside React for smooth 60fps springs
  const states = useRef<CubeState[]>([]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const sched = useRef({ nextSingle: 1.4, nextWave: 5.5, queue: [] as { i: number; at: number; dir: number }[] });
  const clock = useRef(0);

  useEffect(() => {
    states.current = cubes.map((c) => ({ angle: 0, target: 0, vel: 0, lastFlip: -10, axis: c.axis }));
    groups.current = [];
    sched.current.queue = [];
  }, [cubes]);

  const flip = useCallback((i: number, now: number, dir: number) => {
    const s = states.current[i];
    if (!s) return;
    s.target += dir * QUARTER;
    s.lastFlip = now;
  }, []);

  const isIdle = (s: CubeState, now: number) => now - s.lastFlip > 1.2 && Math.abs(s.angle - s.target) < 0.05;

  const hoverFlip = useCallback((i: number) => {
    const s = states.current[i];
    if (s && isIdle(s, clock.current)) flip(i, clock.current, 1);
  }, [flip]);

  const openFront = useCallback((i: number) => {
    const s = states.current[i];
    const c = cubes[i];
    if (!s || !c) return;
    const k = ((Math.round(s.target / QUARTER) % 4) + 4) % 4;
    onOpen(c.faces[k]);
  }, [cubes, onOpen]);

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    clock.current = now;
    const dt = Math.min(delta, 1 / 30);
    const S = sched.current;

    // A single random block turns every ~0.6–1.5s
    if (now >= S.nextSingle) {
      const idle = states.current.map((_, i) => i).filter((i) => isIdle(states.current[i], now));
      if (idle.length) flip(idle[Math.floor(Math.random() * idle.length)], now, Math.random() < 0.5 ? 1 : -1);
      S.nextSingle = now + 0.6 + Math.random() * 0.9;
    }

    // Every ~5–9s a whole row or column ripples
    if (now >= S.nextWave) {
      const byRow = Math.random() < 0.5;
      const idx = Math.floor(Math.random() * (byRow ? rows : cols));
      const dir = Math.random() < 0.5 ? 1 : -1;
      cubes.forEach((c) => {
        const r = Math.floor(c.i / cols), col = c.i % cols;
        if ((byRow && r === idx) || (!byRow && col === idx)) {
          S.queue.push({ i: c.i, at: now + (byRow ? col : r) * 0.07, dir });
        }
      });
      S.nextWave = now + 5 + Math.random() * 4;
    }
    if (S.queue.length) {
      S.queue = S.queue.filter((q) => {
        if (now >= q.at) { flip(q.i, now, q.dir); return false; }
        return true;
      });
    }

    // Spring towards target (slight overshoot = weight of a wooden block)
    const K = 52, C = 2 * Math.sqrt(K) * 0.72;
    states.current.forEach((s, i) => {
      const g = groups.current[i];
      if (!g) return;
      const a = -K * (s.angle - s.target) - C * s.vel;
      s.vel += a * dt;
      s.angle += s.vel * dt;
      if (s.axis === "x") g.rotation.x = s.angle; else g.rotation.y = s.angle;
      // The block lifts off the wall while it turns, so its shadow grows and shrinks
      const progress = Math.min(1, Math.abs(s.angle - s.target) / QUARTER);
      g.position.z = Math.sin(progress * Math.PI) * 0.18;
    });

    // Gentle parallax on the pointer + dolly-in on load
    const tx = state.pointer.x * 0.9;
    const ty = camBaseY + state.pointer.y * 0.45;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.position.z += (dist - camera.position.z) * 0.06;
    camera.lookAt(0, lookY, 0);
  });

  /* ── Layout anchors for the room and ornaments ── */
  const fw = gridW + 0.5, fh = gridH + 0.5, ft = 0.14;
  const halfW = fw / 2 + ft;            // outer edge of the brass frame
  const floorY = -(fh / 2 + ft) - 1.35;
  const I = dist * dist;                // physically-based light intensities scale with distance²

  return (
    <group>
      <color attach="background" args={["#160a04"]} />
      <Suspense fallback={null}>
        <Environment preset="night" />
      </Suspense>

      {/* Lighting: warm key from upper-left with soft shadows, amber fill from lower-right */}
      <ambientLight intensity={0.22} color="#ffe3c4" />
      <hemisphereLight args={["#ffdcb8", "#2a1208", 0.28]} />
      <spotLight
        position={[-gridW * 0.55, gridH * 0.8, dist * 0.85]}
        angle={0.62}
        penumbra={0.9}
        intensity={I * 2.8}
        color="#ffd6a6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <spotLight position={[gridW * 0.6, -gridH * 0.4, dist * 0.7]} angle={0.7} penumbra={1} intensity={I * 0.9} color="#ffb576" />
      <pointLight position={[0, gridH * 0.9, dist * 0.4]} intensity={I * 0.25} color="#fff0dc" />

      {/* Room */}
      <Room floorY={floorY} wainH={0.95} reflective={!isMobile} />

      {/* Velvet backing inside the frame */}
      <mesh position={[0, 0, -0.6]} receiveShadow>
        <planeGeometry args={[fw, fh]} />
        <meshStandardMaterial color="#3a1c0c" roughness={0.92} />
      </mesh>
      {/* Brass frame around the wall */}
      <group position={[0, 0, -0.485]}>
        {[
          { p: [0, fh / 2 + ft / 2, 0], s: [fw + ft * 2, ft, 0.27] },
          { p: [0, -fh / 2 - ft / 2, 0], s: [fw + ft * 2, ft, 0.27] },
          { p: [-fw / 2 - ft / 2, 0, 0], s: [ft, fh, 0.27] },
          { p: [fw / 2 + ft / 2, 0, 0], s: [ft, fh, 0.27] },
        ].map((b, k) => (
          <mesh key={k} position={b.p as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={b.s as [number, number, number]} />
            <meshStandardMaterial {...BRASS} />
          </mesh>
        ))}
      </group>

      {/* The blocks */}
      {cubes.map((c) => (
        <FlipCube
          key={`${cols}x${rows}-${c.i}`}
          cube={c}
          register={(el) => { groups.current[c.i] = el; }}
          onHover={() => hoverFlip(c.i)}
          onOpen={() => openFront(c.i)}
        />
      ))}

      {/* Brass wall lights either side of the frame */}
      {!isMobile && (
        <>
          <Sconce position={[-(halfW + 2.1), 0.7, -0.6]} intensity={I * 0.22} />
          <Sconce position={[halfW + 2.1, 0.7, -0.6]} intensity={I * 0.22} />
        </>
      )}

      {/* Dust motes in the light */}
      <Sparkles count={70} scale={[gridW + 3, gridH + 3, 3]} position={[0, 0, 1.2]} size={2.2} speed={0.25} opacity={0.32} color="#ffd9a8" />
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
          key="flipwall-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0503]/90 backdrop-blur-md"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={22} />
          </button>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative p-3 bg-[#f4ecdc] shadow-[0_40px_80px_rgba(0,0,0,0.7)] rounded-sm"
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
export default function FamilyFunctionFlipCubeWall({
  images = [],
  label = "The Family Wall",
  heading = "Every Face, Every Moment",
  subtitle = "{count} memories on wooden tiles — they turn on their own, or turn one yourself.",
}: { images?: ImageLike[]; label?: string; heading?: string; subtitle?: string }) {
  const urls = useMemo(() => {
    const extracted = images
      .map((i) => (typeof i === "string" ? i : i?.displayUrl || i?.originalUrl || i?.url || ""))
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    return extracted.length ? extracted : PLACEHOLDERS;
  }, [images]);

  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#160a04" }}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 38, position: [0, 0.8, 18], near: 0.1, far: 120 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.92 }}
      >
        <Suspense fallback={null}>
          <WallScene urls={urls} onOpen={setOpen} />
        </Suspense>
      </Canvas>

      {/* Heading */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-5 md:pt-6 pb-10 bg-gradient-to-b from-[#160a04] via-[#160a04]/60 to-transparent">
        <div className="flex items-center gap-3 opacity-70 mb-2">
          <div className="w-8 h-[1px] bg-amber-400" />
          <span className="text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold text-amber-400">{label}</span>
          <div className="w-8 h-[1px] bg-amber-400" />
        </div>
        <h3
          className="font-serif font-black text-white text-2xl md:text-4xl lg:text-5xl tracking-tight text-center leading-none px-6"
          style={{ textShadow: "0 6px 30px rgba(0,0,0,0.85)" }}
        >
          {heading}
        </h3>
        <p className="mt-2 text-amber-200/60 text-[11px] md:text-[13px] font-serif italic text-center max-w-2xl px-6">
          {fillCount(subtitle, urls.length)}
        </p>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-6 right-6 md:bottom-8 md:right-10 z-10 flex items-center gap-2 text-white/50 text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-bold">
        <span>Hover to flip · Click to view</span>
        <div className="w-8 h-[1px] bg-white/30" />
      </div>

      <PhotoLightbox url={open} onClose={close} />
    </div>
  );
}
