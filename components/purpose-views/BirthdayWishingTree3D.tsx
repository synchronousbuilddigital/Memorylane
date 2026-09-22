"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import InlineEditableText from "@/components/InlineEditableText";

/* ────────────────────────────────────────────────────────────────────────────
   The Wishing Tree (WebGL)
   A walnut tree grown from a seed, blossoming in cream and peach with fairy
   lights along its branches. Photographs hang from the branch tips on strings
   and sway; paper wish tags hang between them; fireflies drift. Click a frame
   to open the photo. The page scrolls normally over the scene.
   ──────────────────────────────────────────────────────────────────────────── */

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1502086223501-7ea6ecd79368",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1609220136736-443140cffec6",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1475503572774-15a45e5d60b9",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1542037104857-ffbb0b9155fb",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1609234656388-0ff363383899",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1464349095431-e9a21285b5f3",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_700/memory_lane/stock/photo-1513151233558-d860c5398176",
];
const WISHES = ["Good\nPeople ♡", "Better\nDays ♡", "More\nTo Come ♡"];
const MAX_FRAMES = 14;
const BRASS = "#c9a24a";

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
const getPetalTex = () => canvasTex("petal", 64, 64, (ctx) => {
  const g = ctx.createRadialGradient(30, 28, 2, 32, 32, 30);
  g.addColorStop(0, "rgba(255,246,232,1)"); g.addColorStop(0.55, "rgba(250,220,200,0.95)"); g.addColorStop(0.85, "rgba(240,190,170,0.5)"); g.addColorStop(1, "rgba(240,190,170,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(32, 32, 30, 26, 0.4, 0, Math.PI * 2); ctx.fill();
});
const getBarkTex = () => canvasTex("bark", 256, 512, (ctx, rnd) => {
  ctx.fillStyle = "#3a2010"; ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 120; i++) {
    const x = rnd() * 256, amp = 3 + rnd() * 6, ph = rnd() * 6;
    ctx.strokeStyle = `rgba(${rnd() < 0.5 ? "10,4,0" : "120,80,40"},${0.15 + rnd() * 0.3})`; ctx.lineWidth = 1 + rnd() * 3;
    ctx.beginPath();
    for (let y = 0; y <= 512; y += 10) { const xx = x + Math.sin(y * 0.03 + ph) * amp; if (y === 0) ctx.moveTo(xx, y); else ctx.lineTo(xx, y); }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
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
  ridge(260, 34, "#1c110a", 12); ridge(330, 30, "#130b06", 14); ridge(390, 22, "#0d0704", 16);
});
const tagCache = new Map<string, THREE.Texture>();
function getTagTex(text: string) {
  const hit = tagCache.get(text);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f4ece0"; ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = "rgba(0,0,0,0.06)"; for (let i = 0; i < 1500; i++) ctx.fillRect(Math.random() * 256, Math.random() * 320, 1, 1);
  ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(128, 26, 7, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'italic 38px Georgia, "Times New Roman", serif'; ctx.fillStyle = "#3a2a20"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const lines = text.split("\n");
  lines.forEach((l, i) => ctx.fillText(l, 128, 150 + (i - (lines.length - 1) / 2) * 50));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  tagCache.set(text, t);
  return t;
}

/* ───────────── Photo textures ───────────── */
function sizedUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_800,c_limit,q_auto,f_auto/");
}
const FRAME_W = 0.92, FRAME_H = 1.02, FRAME_ASPECT = FRAME_W / FRAME_H;
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
  const key = `tree:${url}`;
  const hit = photoCache.get(key);
  if (hit) return hit;
  const entry: PhotoEntry = { tex: makePlaceholderTex(idx), loaded: false, listeners: new Set() };
  photoCache.set(key, entry);
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(sizedUrl(url), (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; coverTo(t, FRAME_ASPECT);
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

/* ───────────── Growing the tree ───────────── */
type Seg = { a: THREE.Vector3; b: THREE.Vector3; ra: number; rb: number; depth: number };
function growTree(seed: number) {
  const rnd = mulberry32(seed);
  const segs: Seg[] = [], tips: THREE.Vector3[] = [], ends: THREE.Vector3[] = [];
  const grow = (a: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, depth: number) => {
    const b = a.clone().add(dir.clone().multiplyScalar(len));
    const rb = depth >= 4 ? 0.02 : r * 0.62;
    segs.push({ a, b, ra: r, rb, depth });
    if (depth >= 2) ends.push(b);
    if (depth >= 4) { tips.push(b); return; }
    const n = depth === 0 ? 4 : depth === 1 ? 3 : 2 + (rnd() < 0.45 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const spread = (depth === 0 ? 0.62 : 0.55) + rnd() * 0.42;
      const axis = new THREE.Vector3(rnd() - 0.5, 0.15, rnd() - 0.5).normalize();
      const d = dir.clone().applyAxisAngle(axis, spread * (rnd() < 0.5 ? 1 : -1));
      d.y = Math.max(d.y, depth < 2 ? 0.35 : 0.05);
      d.normalize();
      grow(b, d, len * (0.66 + rnd() * 0.1), rb, depth + 1);
    }
  };
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 2.9, 0.36, 0);
  return { segs, tips, ends };
}

/* ───────────── A hanging photograph ───────────── */
function HangingFrame({ url, idx, anchor, drop, phase, onOpen, onHover }: {
  url: string; idx: number; anchor: THREE.Vector3; drop: number; phase: number; onOpen: () => void; onHover: (on: boolean) => void;
}) {
  const tex = usePhoto(url, idx);
  const g = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.SpriteMaterial>(null);
  const hovered = useRef(false);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) { g.current.rotation.z = Math.sin(t * 0.55 + phase) * 0.045; g.current.rotation.x = Math.sin(t * 0.4 + phase * 2) * 0.03; }
    if (lamp.current) lamp.current.opacity += (((hovered.current ? 0.75 : 0.42)) - lamp.current.opacity) * 0.12;
  });
  return (
    <group ref={g} position={anchor}>
      {/* string */}
      <mesh position={[0, -drop / 2, 0]}><cylinderGeometry args={[0.008, 0.008, drop, 5]} /><meshStandardMaterial color="#d8c39a" roughness={1} /></mesh>
      <group position={[0, -drop - FRAME_H / 2 - 0.06, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); hovered.current = true; onHover(true); }}
        onPointerOut={() => { hovered.current = false; onHover(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(); }}
      >
        <mesh position={[0, FRAME_H / 2 + 0.04, 0]}><torusGeometry args={[0.04, 0.012, 6, 16]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
        {/* cream mat with a brass edge, photo in front */}
        <mesh castShadow><boxGeometry args={[FRAME_W + 0.16, FRAME_H + 0.16, 0.04]} /><meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} /></mesh>
        <mesh position={[0, 0, 0.021]}><planeGeometry args={[FRAME_W + 0.1, FRAME_H + 0.1]} /><meshStandardMaterial color="#efe6d3" roughness={1} /></mesh>
        <mesh position={[0, 0, 0.025]}><planeGeometry args={[FRAME_W, FRAME_H]} /><meshStandardMaterial map={tex} roughness={0.5} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.18} /></mesh>
        <mesh position={[0, 0, -0.021]} rotation={[0, Math.PI, 0]}><planeGeometry args={[FRAME_W + 0.1, FRAME_H + 0.1]} /><meshStandardMaterial color="#e3d5b6" roughness={1} /></mesh>
        {/* a warm glow so the frame reads as lit */}
        <sprite position={[0, 0, 0.1]} scale={[2.6, 2.6, 1]}><spriteMaterial ref={lamp} map={getGlowTex()} color="#ffcca0" transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      </group>
    </group>
  );
}

function WishTag({ text, anchor, drop, phase }: { text: string; anchor: THREE.Vector3; drop: number; phase: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + phase) * 0.08; });
  return (
    <group ref={g} position={anchor}>
      <mesh position={[0, -drop / 2, 0]}><cylinderGeometry args={[0.006, 0.006, drop, 5]} /><meshStandardMaterial color="#d8c39a" /></mesh>
      <mesh position={[0, -drop - 0.4, 0]}><planeGeometry args={[0.62, 0.78]} /><meshStandardMaterial map={getTagTex(text)} roughness={1} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

/* ───────────── The scene ───────────── */
function TreeScene({ urls, onOpen, onHover }: { urls: string[]; onOpen: (i: number) => void; onHover: (on: boolean) => void }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const treeX = aspect > 1.5 ? 2.6 : aspect > 1.1 ? 1.6 : 0.6;
  const camZ = aspect > 1.5 ? 15 : aspect > 1.1 ? 17 : 21;
  const glow = getGlowTex(), petal = getPetalTex(), bark = getBarkTex(), hills = getHillsTex();
  const tree = useMemo(() => growTree(23), []);

  // blossoms as two point clouds (two sizes), fairy lights along the outer branches
  const { blossomA, blossomB, blossomColA, blossomColB, lights } = useMemo(() => {
    const rnd = mulberry32(41);
    const A: number[] = [], B: number[] = [], CA: number[] = [], CB: number[] = [], L: number[] = [];
    const cream = new THREE.Color("#f3dcc4"), peach = new THREE.Color("#e9ad8e"), c = new THREE.Color();
    for (const e of tree.ends) {
      for (let i = 0; i < 16; i++) {
        const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.4, rnd() - 0.5).multiplyScalar(1.4).add(e);
        (i % 2 ? A : B).push(v.x, v.y, v.z);
        c.copy(cream).lerp(peach, 0.2 + rnd() * 0.75);
        (i % 2 ? CA : CB).push(c.r, c.g, c.b);
      }
    }
    for (const s of tree.segs) if (s.depth >= 2) {
      const n = Math.max(1, Math.round(s.a.distanceTo(s.b) / 0.45));
      for (let i = 0; i <= n; i++) { const p = s.a.clone().lerp(s.b, i / n); L.push(p.x + (rnd() - 0.5) * 0.1, p.y - 0.06, p.z + (rnd() - 0.5) * 0.1); }
    }
    return { blossomA: new Float32Array(A), blossomB: new Float32Array(B), blossomColA: new Float32Array(CA), blossomColB: new Float32Array(CB), lights: new Float32Array(L) };
  }, [tree]);

  // frames hang from well-spread tips; tags from three more
  const { frameHangs, tagHangs } = useMemo(() => {
    const rnd = mulberry32(57);
    const tips = [...tree.tips].filter((t) => t.y > 3.6).sort((a, b) => a.x - b.x);
    const n = Math.min(urls.length, MAX_FRAMES);
    // walk the crown left to right, keeping neighbours at least a frame's width apart
    const picked: THREE.Vector3[] = [];
    const want = n + 3;
    const minGap = Math.max(0.55, (tips[tips.length - 1].x - tips[0].x) / (want + 1));
    let lastX = -Infinity;
    for (const t of tips) { if (t.x - lastX >= minGap) { picked.push(t); lastX = t.x; } }
    while (picked.length < want && picked.length < tips.length) { const t = tips[Math.floor(rnd() * tips.length)]; if (!picked.includes(t)) picked.push(t); }
    picked.sort((a, b) => a.x - b.x);
    const tagIdx = new Set([0, Math.floor(picked.length / 2), picked.length - 1]);
    const mk = (t: THREE.Vector3, i: number) => ({ anchor: t, drop: 0.45 + rnd() * 1.0 + (i % 2) * 0.45, phase: rnd() * 6 });
    return {
      frameHangs: picked.filter((_, i) => !tagIdx.has(i)).map(mk),
      tagHangs: picked.filter((_, i) => tagIdx.has(i)).map(mk),
    };
  }, [tree, urls.length]);

  const flies = useMemo(() => {
    const rnd = mulberry32(77), n = 90, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([treeX + (rnd() - 0.5) * 14, 0.3 + rnd() * 7, -3 + rnd() * 7], i * 3);
    return p;
  }, [treeX]);
  const flyRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.Points>(null);
  const flyBase = useMemo(() => flies.slice(), [flies]);

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime;
    const f = flyRef.current;
    if (f) {
      const pos = f.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i, flyBase[i * 3] + Math.sin(t * 0.5 + i) * 0.6, flyBase[i * 3 + 1] + Math.sin(t * 0.8 + i * 1.3) * 0.35, flyBase[i * 3 + 2] + Math.cos(t * 0.45 + i * 0.7) * 0.5);
      }
      pos.needsUpdate = true;
      (f.material as THREE.PointsMaterial).opacity = 0.55 + 0.25 * Math.sin(t * 2.2);
    }
    const l = lightRef.current;
    if (l) (l.material as THREE.PointsMaterial).size = 0.42 + 0.06 * Math.sin(t * 3.1);
    camera.position.x += ((0.6 + pointer.x * 0.7) - camera.position.x) * 0.03;
    camera.position.y += ((4.2 + pointer.y * 0.4) - camera.position.y) * 0.03;
    camera.position.z += (camZ - camera.position.z) * 0.05;
    camera.lookAt(treeX * 0.75, 4.4, 0);
  });

  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  return (
    <group>
      <fog attach="fog" args={["#120a05", 22, 70]} />
      <ambientLight intensity={0.28} color="#ffd9b0" />
      <hemisphereLight args={["#3a2a20", "#1a0e07", 0.55]} />
      <directionalLight position={[16, 18, -8]} intensity={0.7} color="#c8b8a0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={14} shadow-camera-bottom={-2} />
      <spotLight position={[-5, 9, 10]} angle={0.7} penumbra={0.9} intensity={220} color="#ffd6a6" />
      <pointLight position={[treeX, 5.6, 1.5]} intensity={26} distance={12} decay={2} color="#ffc98a" />
      <pointLight position={[treeX - 2, 1.2, 3]} intensity={8} distance={7} decay={2} color="#ffb15e" />

      {/* sky, stars, moon, hills, ground */}
      <mesh position={[0, 3, -50]}><planeGeometry args={[220, 34]} /><meshBasicMaterial map={hills} transparent fog={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 60]} />
        <meshStandardMaterial color="#1b1008" roughness={1} />
      </mesh>
      {/* warm pool of light under the tree and candles at its foot */}
      <sprite position={[treeX, 0.15, 1]} scale={[14, 5, 1]}><spriteMaterial map={glow} color="#8a4a20" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      {[-2.2, -1.1, 1.3, 2.4].map((dx, i) => (
        <group key={i} position={[treeX + dx, 0, 1.6 + (i % 2) * 0.6]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.07, 0.08, 0.24, 12]} /><meshStandardMaterial color="#f1e3c4" roughness={0.6} /></mesh>
          <sprite position={[0, 0.34, 0]} scale={[0.55, 0.55, 1]}><spriteMaterial map={glow} color="#ffb15e" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        </group>
      ))}

      {/* ── the tree ── */}
      <group position={[treeX, 0, 0]}>
        {tree.segs.map((s, i) => {
          const dir = s.b.clone().sub(s.a); const len = dir.length(); dir.normalize();
          const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
          const mid = s.a.clone().lerp(s.b, 0.5);
          return (
            <mesh key={i} position={mid} quaternion={q} castShadow>
              <cylinderGeometry args={[s.rb, s.ra, len * 1.04, s.depth < 2 ? 12 : 7]} />
              <meshStandardMaterial map={bark} color={s.depth < 2 ? "#6a4022" : "#5c3616"} roughness={0.9} />
            </mesh>
          );
        })}
        {/* roots */}
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} position={[Math.cos((k / 5) * Math.PI * 2) * 0.4, 0.08, Math.sin((k / 5) * Math.PI * 2) * 0.4]} rotation={[0, -(k / 5) * Math.PI * 2, Math.PI / 2.6]}>
            <cylinderGeometry args={[0.05, 0.22, 0.9, 7]} /><meshStandardMaterial map={bark} color="#6a4022" roughness={0.9} />
          </mesh>
        ))}

        {/* blossoms */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[blossomA, 3]} />
            <bufferAttribute attach="attributes-color" args={[blossomColA, 3]} />
          </bufferGeometry>
          <pointsMaterial map={petal} size={0.3} sizeAttenuation vertexColors transparent alphaTest={0.05} depthWrite={false} opacity={0.88} />
        </points>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[blossomB, 3]} />
            <bufferAttribute attach="attributes-color" args={[blossomColB, 3]} />
          </bufferGeometry>
          <pointsMaterial map={petal} size={0.2} sizeAttenuation vertexColors transparent alphaTest={0.05} depthWrite={false} opacity={0.88} />
        </points>
        {/* fairy lights */}
        <points ref={lightRef}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[lights, 3]} /></bufferGeometry>
          <pointsMaterial map={glow} size={0.42} sizeAttenuation color="#ffc98a" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>

        {/* photographs and wishes */}
        {frameHangs.slice(0, Math.min(urls.length, MAX_FRAMES)).map((h, i) => (
          <HangingFrame key={i} url={urls[i]} idx={i} anchor={h.anchor} drop={h.drop} phase={h.phase} onOpen={() => onOpen(i)} onHover={onHover} />
        ))}
        {tagHangs.slice(0, 3).map((h, i) => (
          <WishTag key={`w${i}`} text={WISHES[i]} anchor={h.anchor} drop={h.drop * 0.7} phase={h.phase} />
        ))}
      </group>

      {/* fireflies */}
      <points ref={flyRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[flies, 3]} /></bufferGeometry>
        <pointsMaterial map={glow} size={0.5} sizeAttenuation color="#ffd27a" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
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
        <motion.div key="tree-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0503]/90 backdrop-blur-md" onClick={onClose}>
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
type Card = { id: string; displayUrl?: string; url?: string };
interface Props { title: string; description: string; cards: Card[]; onTitleChange?: (v: string) => void; onDescriptionChange?: (v: string) => void }

export default function BirthdayWishingTree3D({ title, description, cards, onTitleChange, onDescriptionChange }: Props) {
  const urls = useMemo(() => {
    const own = cards.map((c) => c.displayUrl || c.url || "").filter(Boolean);
    return (own.length ? own : PLACEHOLDERS).slice(0, MAX_FRAMES);
  }, [cards]);
  const [open, setOpen] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const close = useCallback(() => setOpen(null), []);
  const onOpen = useCallback((i: number) => setOpen(urls[i]), [urls]);

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 42, position: [0.6, 3.8, 14], near: 0.1, far: 220 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }} style={{ cursor: hovering ? "pointer" : "default" }}>
        <Suspense fallback={null}>
          <TreeScene urls={urls} onOpen={onOpen} onHover={setHovering} />
        </Suspense>
      </Canvas>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] z-20" style={{ background: "linear-gradient(180deg, rgba(20,10,5,0.9) 0%, rgba(20,10,5,0) 100%)" }} />

      <div className="absolute top-1/2 -translate-y-1/2 left-[5%] md:left-[8%] z-30 max-w-xs md:max-w-xl pointer-events-none">
        <div className="pointer-events-auto">
          <p className="flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold mb-4 text-[#e6c56d]/85"><span className="w-8 h-[1px] bg-[#c9a24a]" /> Chapter IV · Wishing tree</p>
          <h2 className="text-4xl md:text-6xl font-serif font-black text-[#f4eee6] leading-[1.05] drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] mb-5 whitespace-pre-wrap">
            {onTitleChange ? <InlineEditableText value={title} onChange={onTitleChange} /> : title}
          </h2>
          <p className="text-sm md:text-lg text-[#d9cbb8] font-serif italic leading-relaxed drop-shadow-[0_5px_10px_rgba(0,0,0,0.9)] max-w-[280px] md:max-w-lg whitespace-pre-wrap">
            {onDescriptionChange ? <InlineEditableText value={description} onChange={onDescriptionChange} /> : description}
          </p>
        </div>
      </div>
      <div className="absolute top-8 right-10 text-[#e6c56d] font-handwriting text-2xl md:text-3xl z-30 rotate-[-4deg] pointer-events-none text-right leading-tight hidden md:block">Memories<br />Never Fade ♡</div>
      <div className="pointer-events-none absolute bottom-6 right-6 md:bottom-8 md:right-10 z-30 flex items-center gap-2 text-white/50 text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-bold">
        <span>Click a picture to view</span><div className="w-8 h-[1px] bg-white/30" />
      </div>

      <PhotoLightbox url={open} onClose={close} />
    </section>
  );
}
