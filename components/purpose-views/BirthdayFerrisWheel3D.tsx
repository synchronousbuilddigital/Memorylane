"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { MeshReflectorMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import InlineEditableText from "@/components/InlineEditableText";

/* ────────────────────────────────────────────────────────────────────────────
   Ferris Wheel of Memories (WebGL)
   A brass-and-walnut wheel on a lakeside boardwalk at night. Sixteen cabins
   hang from the rim, each carrying a photograph; the wheel turns on its own,
   drag spins it, click a cabin to open the photo. Rim bulbs chase, the lake
   reflects it all. The page scrolls normally over the scene.
   ──────────────────────────────────────────────────────────────────────────── */

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1609234656388-0ff363383899?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=700&q=70&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=700&q=70&auto=format&fit=crop",
];

const N = 16;                 // cabins
const R = 3.55;               // wheel radius
const HUB_Y = 5.25;           // axle height above the boardwalk (lowest cabin clears the deck)
const WHEEL_X = 2.6;          // wheel sits right of centre; the words sit left
const YAW = -0.38;            // turned a little towards the viewer for depth
const CAB_W = 0.82, CAB_H = 0.9, CAB_D = 0.55, DROP = 0.42;
const BULBS = 72;
const AUTO_SPEED = 0.07;      // rad/s

const BRASS = "#c9a24a", BRASS_DARK = "#8a6a1e", WALNUT = "#3b1f0c", WALNUT_LIGHT = "#5c3616";
const CHAPTERS = ["Lanterns", "The Gift", "The Wheel", "Wishing Tree"];

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
function canvasTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void, repeat = true) {
  const hit = texOnce.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, mulberry32(key.length * 7919 + w));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texOnce.set(key, t);
  return t;
}
const getGlowTex = () => canvasTex("glow", 64, 64, (ctx) => {
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,235,200,0.5)"); g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
}, false);
const getPlankTex = () => canvasTex("plank", 1024, 1024, (ctx, rnd) => {
  const bh = 128;
  for (let b = 0; b < 8; b++) {
    const l = 0.75 + rnd() * 0.3;
    ctx.fillStyle = `rgb(${(74 * l) | 0}, ${(40 * l) | 0}, ${(18 * l) | 0})`;
    ctx.fillRect(0, b * bh, 1024, bh);
    for (let i = 0; i < 40; i++) {
      const y = b * bh + rnd() * bh, amp = 1 + rnd() * 3, freq = 0.01 + rnd() * 0.02, ph = rnd() * 6;
      ctx.strokeStyle = `rgba(10,4,0,${0.08 + rnd() * 0.18})`; ctx.lineWidth = 0.5 + rnd() * 1.4;
      ctx.beginPath();
      for (let x = 0; x <= 1024; x += 8) { const yy = y + Math.sin(x * freq + ph) * amp; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, b * bh, 1024, 3);
    ctx.fillStyle = "rgba(255,225,190,0.08)"; ctx.fillRect(0, b * bh + 3, 1024, 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(rnd() * 1024, b * bh, 3, bh);
  }
});
const getMountainTex = () => canvasTex("mountains", 2048, 512, (ctx, rnd) => {
  ctx.clearRect(0, 0, 2048, 512);
  const ridge = (base: number, amp: number, color: string, seed: number) => {
    const r = mulberry32(seed);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 512);
    let y = base;
    for (let x = 0; x <= 2048; x += 24) { y += (r() - 0.5) * amp; y = Math.max(base - 140, Math.min(base + 60, y)); ctx.lineTo(x, y); }
    ctx.lineTo(2048, 512); ctx.closePath(); ctx.fill();
  };
  ridge(220, 40, "#1a100a", 3); ridge(290, 36, "#120a06", 5); ridge(350, 26, "#0e0704", 9);
  void rnd;
}, false);

/* ───────────── Photo textures: once per URL, cover-cropped to the cabin's face ───────────── */
function sizedUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_800,c_limit,q_auto,f_auto/");
}
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
const FACE_ASPECT = (CAB_W - 0.1) / (CAB_H - 0.14);
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
  const key = `wheel:${url}`;
  const hit = photoCache.get(key);
  if (hit) return hit;
  const entry: PhotoEntry = { tex: makePlaceholderTex(idx), loaded: false, listeners: new Set() };
  photoCache.set(key, entry);
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  loader.load(sizedUrl(url), (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; coverTo(t, FACE_ASPECT);
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

/* ───────────── Wheel state (mutable, outside React) ───────────── */
type WheelState = { angle: number; vel: number; dragging: boolean; lastX: number; lastT: number; moved: number; hover: number };

/* ───────────── One cabin ───────────── */
function Cabin({ url, idx, register, onHover, onOpen }: {
  url: string; idx: number; register: (g: THREE.Group | null) => void; onHover: (on: boolean) => void; onOpen: () => void;
}) {
  const tex = usePhoto(url, idx);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  return (
    <group ref={register}>
      {/* hanger pin at the rim; the cabin swings below it */}
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
      <group position={[0, -DROP - CAB_H / 2, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(); }}
      >
        {/* two brass bars up to the pin */}
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x * 0.9, CAB_H / 2 + DROP / 2, 0]} rotation={[0, 0, x < 0 ? 0.32 : -0.32]}>
            <cylinderGeometry args={[0.016, 0.016, DROP + 0.1, 8]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} />
          </mesh>
        ))}
        {/* walnut body */}
        <mesh castShadow><boxGeometry args={[CAB_W, CAB_H, CAB_D]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.6} metalness={0.05} /></mesh>
        {/* brass roof + rail */}
        <mesh position={[0, CAB_H / 2 + 0.03, 0]}><boxGeometry args={[CAB_W + 0.08, 0.06, CAB_D + 0.08]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
        <mesh position={[0, -CAB_H / 2 - 0.02, 0]}><boxGeometry args={[CAB_W + 0.04, 0.04, CAB_D + 0.04]} /><meshStandardMaterial color={BRASS_DARK} metalness={0.8} roughness={0.4} /></mesh>
        {/* the photograph, front and back, with a cream mat */}
        {[1, -1].map((s) => (
          <group key={s} position={[0, 0.02, s * (CAB_D / 2 + 0.002)]} rotation={[0, s < 0 ? Math.PI : 0, 0]}>
            <mesh><planeGeometry args={[CAB_W - 0.06, CAB_H - 0.1]} /><meshStandardMaterial color="#efe6d3" roughness={1} /></mesh>
            <mesh position={[0, 0, 0.003]}><planeGeometry args={[CAB_W - 0.1, CAB_H - 0.14]} /><meshStandardMaterial map={tex} roughness={0.45} /></mesh>
          </group>
        ))}
        {/* a small lamp inside the roof, brightens on hover */}
        <mesh position={[0, CAB_H / 2 - 0.02, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial ref={lamp} color="#fff1c8" emissive="#ffc98a" emissiveIntensity={1.2} /></mesh>
      </group>
    </group>
  );
}

/* ───────────── The scene ───────────── */
function WheelScene({ urls, state, onOpen, onHoverIdx }: { urls: string[]; state: React.MutableRefObject<WheelState>; onOpen: (i: number) => void; onHoverIdx: (i: number) => void }) {
  const { camera, gl, size } = useThree();
  const aspect = size.width / size.height;
  const wheelX = aspect > 1.5 ? WHEEL_X : aspect > 1.1 ? 1.4 : 0.4;
  const camZ = aspect > 1.5 ? 16.5 : aspect > 1.1 ? 18 : 21;
  const rim = useRef<THREE.Group>(null);
  const cabins = useRef<(THREE.Group | null)[]>([]);
  const bulbs = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.Points>(null);
  const swing = useRef<number[]>(Array.from({ length: N }, () => 0));
  const swingVel = useRef<number[]>(Array.from({ length: N }, () => 0));

  const glowTex = getGlowTex(), plank = getPlankTex(), mountains = getMountainTex();
  const plankRep = useMemo(() => { const t = plank.clone(); t.repeat.set(6, 3); t.needsUpdate = true; return t; }, [plank]);

  // rim bulb positions (in the rim group's frame)
  const bulbPos = useMemo(() => {
    const p = new Float32Array(BULBS * 3);
    for (let i = 0; i < BULBS; i++) { const a = (i / BULBS) * Math.PI * 2; p.set([Math.cos(a) * R, Math.sin(a) * R, 0.22], i * 3); }
    return p;
  }, []);
  useEffect(() => {
    const m = bulbs.current;
    if (!m) return;
    const M = new THREE.Matrix4();
    for (let i = 0; i < BULBS; i++) { M.makeTranslation(bulbPos[i * 3], bulbPos[i * 3 + 1], bulbPos[i * 3 + 2]); m.setMatrixAt(i, M); }
    m.instanceMatrix.needsUpdate = true;
  }, [bulbPos]);

  // stars

  // string lights across the top of the boardwalk
  const strand = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const a = new THREE.Vector3(-9, 7.4, -1.5), b = new THREE.Vector3(9, 7.6, -1.5);
    for (let i = 0; i <= 26; i++) { const t = i / 26; const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * 0.9; pts.push(p); }
    return pts;
  }, []);

  // pointer drag spins the wheel
  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    const down = (e: PointerEvent) => { s.dragging = true; s.lastX = e.clientX; s.lastT = performance.now(); s.moved = 0; };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX, now = performance.now(), dt = Math.max(1, now - s.lastT) / 1000;
      const dA = -dx * 0.006;
      s.angle += dA; s.vel = dA / dt; s.lastX = e.clientX; s.lastT = now; s.moved += Math.abs(dx);
    };
    const up = () => { s.dragging = false; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [gl, state]);

  useFrame(({ clock }, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 1 / 30);
    const t = clock.elapsedTime;
    if (!s.dragging) {
      // inertia eases back to the idle turn
      s.vel += (AUTO_SPEED - s.vel) * Math.min(1, dt * 0.9);
      s.angle += s.vel * dt;
    }
    if (rim.current) rim.current.rotation.z = s.angle;

    // cabins hang from the rim and swing a little with the motion
    const accel = s.dragging ? s.vel : 0;
    for (let i = 0; i < N; i++) {
      const g = cabins.current[i];
      if (!g) continue;
      const a = s.angle + (i / N) * Math.PI * 2;
      g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      // pendulum: driven by wheel acceleration, damped
      const target = THREE.MathUtils.clamp(-accel * 0.25, -0.25, 0.25) + Math.sin(t * 1.1 + i) * 0.015;
      const k = 18, c = 2 * Math.sqrt(k) * 0.35;
      const acc = -k * (swing.current[i] - target) - c * swingVel.current[i];
      swingVel.current[i] += acc * dt; swing.current[i] += swingVel.current[i] * dt;
      g.rotation.z = swing.current[i];
      const cab = g.children[1] as THREE.Group | undefined;
      const lampMat = cab?.children?.[cab.children.length - 1] && ((cab.children[cab.children.length - 1] as THREE.Mesh).material as THREE.MeshStandardMaterial);
      if (lampMat) lampMat.emissiveIntensity += (((s.hover === i) ? 4 : 1.2) - lampMat.emissiveIntensity) * 0.15;
    }

    // chasing rim bulbs
    const m = bulbs.current, g = glow.current;
    if (m && g) {
      const col = new THREE.Color();
      const gc = g.geometry.getAttribute("color") as THREE.BufferAttribute;
      for (let i = 0; i < BULBS; i++) {
        const chase = 0.55 + 0.45 * Math.max(0, Math.sin(t * 2.4 - (i / BULBS) * Math.PI * 6));
        col.setRGB(chase, chase * 0.82, chase * 0.55);
        m.setColorAt(i, col);
        gc.setXYZ(i, chase, chase * 0.8, chase * 0.5);
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      gc.needsUpdate = true;
    }

    // a breath of parallax on the camera
    camera.position.x += ((0.6 + Math.sin(t * 0.25) * 0.15) - camera.position.x) * 0.02;
    camera.position.y += ((4.4 + Math.sin(t * 0.31 + 1) * 0.08) - camera.position.y) * 0.02;
    camera.position.z += (camZ - camera.position.z) * 0.05;
    camera.lookAt(wheelX * 0.5, HUB_Y - 1.0, 0);
  });

  const spokes = useMemo(() => Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2), []);
  const post = (x: number, z: number, k: number, lit = false) => (
    <group key={k} position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.18, 1.1, 0.18]} /><meshStandardMaterial color="#6b3d1d" roughness={0.6} /></mesh>
      <mesh position={[0, 1.13, 0]}><boxGeometry args={[0.16, 0.06, 0.16]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
      {lit && (
        <group position={[0, 1.16, 0]}>
          <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.28, 0.4, 0.28]} /><meshStandardMaterial color="#ffe0b0" emissive="#ffb35c" emissiveIntensity={0.9} transparent opacity={0.6} /></mesh>
          <mesh position={[0, 0.52, 0]}><coneGeometry args={[0.22, 0.14, 4]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
          <sprite position={[0, 0.28, 0]} scale={[1.4, 1.4, 1]}><spriteMaterial map={glowTex} color="#ffc98a" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
        </group>
      )}
    </group>
  );

  return (
    <group>
      <Suspense fallback={null}><Environment preset="night" /></Suspense>
      <fog attach="fog" args={["#120a05", 30, 90]} />
      <ambientLight intensity={0.25} color="#ffe3c4" />
      <hemisphereLight args={["#3a2a20", "#1a0e07", 0.5]} />
      {/* moonlight from the right, warm key from the front-left, hub glow */}
      <directionalLight position={[18, 14, -6]} intensity={0.9} color="#c8b8a0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-4} />
      <spotLight position={[-6, 9, 9]} angle={0.7} penumbra={0.8} intensity={260} color="#ffd6a6" />
      <pointLight position={[wheelX, HUB_Y, 1.2]} intensity={40} distance={14} decay={2} color="#ffc98a" />
      <pointLight position={[-9.5, 1.6, -1.5]} intensity={10} distance={7} decay={2} color="#ffb15e" />
      <pointLight position={[8, 1.6, -1.5]} intensity={10} distance={7} decay={2} color="#ffb15e" />

      {/* sky, stars, moon, mountains */}
      <mesh position={[0, 6.5, -55]}><planeGeometry args={[220, 30]} /><meshBasicMaterial map={mountains} transparent fog={false} /></mesh>

      {/* lake */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -25]}>
        <planeGeometry args={[220, 60]} />
        <MeshReflectorMaterial blur={[400, 120]} resolution={1024} mixBlur={1} mixStrength={1.6} roughness={0.7} depthScale={1.1} minDepthThreshold={0.5} maxDepthThreshold={1.6} color="#150c07" metalness={0.25} mirror={0.45} />
      </mesh>

      {/* boardwalk with railing and lantern posts */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]} receiveShadow>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial map={plankRep} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.02, -3.05]}><boxGeometry args={[30, 0.14, 0.22]} /><meshStandardMaterial color={WALNUT} roughness={0.6} /></mesh>
      {[-13, -9.5, -6, -2.5, 1, 4.5, 8, 11.5].map((x, k) => post(x, -3, k, x === -9.5 || x === 8))}
      <mesh position={[0, 1.0, -3]}><boxGeometry args={[27, 0.06, 0.08]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.55} /></mesh>
      <mesh position={[0, 0.55, -3]}><boxGeometry args={[27, 0.04, 0.05]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.55} /></mesh>
      {/* string lights */}
      <group>
        <mesh><tubeGeometry args={[new THREE.CatmullRomCurve3(strand), 48, 0.012, 5, false]} /><meshStandardMaterial color="#1e120a" /></mesh>
        {strand.map((p, i) => i % 2 === 1 && (
          <group key={i} position={[p.x, p.y - 0.1, p.z]}>
            <mesh><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#fff1c8" emissive="#ffc766" emissiveIntensity={2} /></mesh>
            <sprite scale={[0.7, 0.7, 1]}><spriteMaterial map={glowTex} color="#ffd9a8" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
          </group>
        ))}
      </group>

      {/* ── the wheel ── */}
      <group position={[wheelX, HUB_Y, 0]} rotation={[0, YAW, 0]}>
        {/* rotating rim, spokes and bulbs */}
        <group ref={rim}>
          {[0.32, -0.32].map((z) => (
            <mesh key={z} position={[0, 0, z]} castShadow><torusGeometry args={[R, 0.07, 12, 96]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
          ))}
          <mesh castShadow><torusGeometry args={[R * 0.42, 0.045, 10, 72]} /><meshStandardMaterial color={BRASS_DARK} metalness={0.8} roughness={0.4} /></mesh>
          {spokes.map((a, i) => (
            <group key={i} rotation={[0, 0, a]}>
              {[0.32, -0.32].map((z) => (
                <mesh key={z} position={[R / 2, 0, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.028, 0.028, R, 8]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
              ))}
              {/* cross tie between the two rims at the rim */}
              <mesh position={[R, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.64, 8]} /><meshStandardMaterial color={BRASS_DARK} metalness={0.8} roughness={0.4} /></mesh>
            </group>
          ))}
          <instancedMesh ref={bulbs} args={[undefined, undefined, BULBS]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </instancedMesh>
          <points ref={glow}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[bulbPos, 3]} />
              <bufferAttribute attach="attributes-color" args={[new Float32Array(BULBS * 3).fill(1), 3]} />
            </bufferGeometry>
            <pointsMaterial map={glowTex} size={0.6} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.9} />
          </points>
        </group>

        {/* hub and axle (static) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.36, 0.36, 0.9, 24]} /><meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 2.4, 12]} /><meshStandardMaterial color={BRASS_DARK} metalness={0.9} roughness={0.3} /></mesh>
        <sprite scale={[2.4, 2.4, 1]}><spriteMaterial map={glowTex} color="#ffc98a" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>

        {/* cabins: positioned every frame, never rotated with the rim */}
        {urls.map((u, i) => (
          <Cabin key={i} url={u} idx={i} register={(g) => { cabins.current[i] = g; }} onHover={(on) => onHoverIdx(on ? i : -1)} onOpen={() => onOpen(i)} />
        ))}

        {/* A-frame legs on both sides of the wheel */}
        {[1.05, -1.05].map((z) => (
          <group key={z} position={[0, 0, z]}>
            {[-1, 1].map((sgn) => (
              <mesh key={sgn} position={[sgn * 1.55, -HUB_Y / 2, 0]} rotation={[0, 0, sgn * -0.33]} castShadow>
                <boxGeometry args={[0.22, HUB_Y + 0.6, 0.22]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.55} metalness={0.05} />
              </mesh>
            ))}
            <mesh position={[0, -HUB_Y * 0.55, 0]}><boxGeometry args={[3.2, 0.12, 0.14]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
            <mesh position={[0, -HUB_Y + 0.08, 0]}><boxGeometry args={[4.4, 0.16, 0.5]} /><meshStandardMaterial color={WALNUT} roughness={0.6} /></mesh>
          </group>
        ))}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 2.3, 10]} /><meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.35} /></mesh>
      </group>
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
        <motion.div key="wheel-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0503]/90 backdrop-blur-md" onClick={onClose}>
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
interface CardItem { id: string; displayUrl: string; url?: string }
interface Props {
  title: string; description: string; cards: CardItem[];
  onTitleChange?: (v: string) => void; onDescriptionChange?: (v: string) => void;
  isEditing?: boolean; sectionRef?: React.RefObject<HTMLDivElement>;
}

export default function BirthdayFerrisWheel3D({ title, description, cards, onTitleChange, onDescriptionChange, isEditing, sectionRef }: Props) {
  void isEditing;
  const urls = useMemo(() => {
    const own = cards.map((c) => c.displayUrl || c.url || "").filter(Boolean);
    const pool = own.length ? own : PLACEHOLDERS;
    return Array.from({ length: N }, (_, i) => pool[i % pool.length]);
  }, [cards]);
  const state = useRef<WheelState>({ angle: 0, vel: AUTO_SPEED, dragging: false, lastX: 0, lastT: 0, moved: 0, hover: -1 });
  const [open, setOpen] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const close = useCallback(() => setOpen(null), []);
  const onOpen = useCallback((i: number) => { if (state.current.moved < 6) setOpen(urls[i]); }, [urls]);
  const onHoverIdx = useCallback((i: number) => { state.current.hover = i; setHovering(i >= 0); }, []);
  const aboard = Math.min(cards.length, N);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden font-sans">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 40, position: [0.6, 4.4, 17], near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        style={{ cursor: hovering ? "pointer" : "grab" }}
      >
        <Suspense fallback={null}>
          <WheelScene urls={urls} state={state} onOpen={onOpen} onHoverIdx={onHoverIdx} />
        </Suspense>
      </Canvas>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] z-20" style={{ background: "linear-gradient(180deg, rgba(20,10,5,0.9) 0%, rgba(20,10,5,0) 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[16vh] z-20" style={{ background: "linear-gradient(180deg, rgba(20,10,5,0) 0%, rgba(20,10,5,0.9) 100%)" }} />

      {/* ── LEFT: words ── */}
      <div className="absolute left-6 sm:left-10 md:left-14 top-1/2 -translate-y-1/2 z-30 max-w-[34%] md:max-w-[26%] pointer-events-none">
        <div className="pointer-events-auto">
          <p className="flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.45em] uppercase font-bold mb-4 text-[#e6c56d]/85">
            <span className="w-8 h-[1px] bg-[#c9a24a]" /> Chapter III · The wheel
          </p>
          <h2 className="font-serif font-black tracking-tight leading-[0.95] text-[#f4eee6] whitespace-pre-wrap" style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.8rem)", textShadow: "0 6px 30px rgba(0,0,0,0.85)" }}>
            {onTitleChange ? <InlineEditableText value={title} onChange={onTitleChange} /> : title}
          </h2>
          <p className="font-serif italic mt-3 text-sm md:text-base leading-relaxed whitespace-pre-wrap text-[#d9cbb8]/85">
            {onDescriptionChange ? <InlineEditableText value={description} onChange={onDescriptionChange} /> : description}
          </p>
          <div className="mt-6 space-y-1.5">
            {["Places", "People", "Moments", "Forever"].map((kw) => (
              <div key={kw} className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#d9cbb8]/55">{kw}</div>
            ))}
          </div>
          <div className="mt-7 inline-block rounded-xl px-5 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-[#c9a24a]" style={{ background: "linear-gradient(135deg,#efe6d3,#e3d5b6)" }}>
            <div className="text-[9px] tracking-[0.45em] uppercase font-bold text-[#8a6a1e]">Memories aboard</div>
            <div className="font-serif font-black text-2xl mt-0.5 tabular-nums text-[#1c1917]">{String(aboard).padStart(2, "0")} <span className="text-base font-bold text-[#8a6a1e]">/ {N}</span></div>
            <div className="text-[9px] tracking-[0.3em] uppercase font-semibold mt-0.5 text-[#5a4d41]/70">cabins filled</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: chapters ── */}
      <div className="hidden lg:flex absolute right-[2%] top-1/2 -translate-y-1/2 z-30 flex-col items-start gap-3 pointer-events-none">
        {CHAPTERS.map((c, i) => {
          const active = i === 2;
          return (
            <div key={c} className="flex items-center gap-2.5">
              <div className="rounded-full" style={{ width: active ? 9 : 4, height: active ? 9 : 4, background: active ? "#e6c56d" : "rgba(201,162,74,0.35)", boxShadow: active ? "0 0 10px rgba(255,201,138,0.7)" : "none" }} />
              <span className="tracking-[0.12em] uppercase" style={{ fontSize: active ? 11 : 9, fontWeight: active ? 700 : 500, color: active ? "#e6c56d" : "rgba(201,162,74,0.45)" }}>{["I", "II", "III", "IV"][i]} · {c}</span>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-6 right-6 md:bottom-8 md:right-10 z-30 flex items-center gap-2 text-white/50 text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-bold">
        <span>Drag to spin · Click a cabin to view</span>
        <div className="w-8 h-[1px] bg-white/30" />
      </div>

      <PhotoLightbox url={open} onClose={close} />
    </section>
  );
}
