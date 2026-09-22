"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { fillCount, lines } from "./familyFunctionText";

// Simple global scroll state
const scrollState = {
  progress: 0,
  targetProgress: 0,
};

export default function FamilyFunctionMovieProjector({
  images = [],
  heading = "Movie\nNight",
  subtitle = "A timeless collection of {count} cherished memories.",
}: { images: any[]; heading?: string; subtitle?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Extract URLs safely handling both string and object image formats, wrapped in useMemo to prevent infinite render loops
  const safeImages = useMemo(() => {
    const extracted = images.map((i) => {
      if (typeof i === 'string') return i;
      return i?.displayUrl || i?.originalUrl || i?.url || i?.src || i?.file?.preview || i?.preview || '';
    }).filter((i) => typeof i === 'string' && i.length > 0);
    
    if (extracted.length === 0) {
      extracted.push(
        "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_1000/memory_lane/stock/photo-1511895426328-dc8714191300"
      );
    }
    return extracted;
  }, [images]);

  // Frame counter for the overlay, and ← → to step the film while the section is on screen
  const [frameNo, setFrameNo] = useState(0);
  useEffect(() => {
    const onFrame = () => setFrameNo(film.frame);
    film.listeners.add(onFrame);
    const onKey = (e: KeyboardEvent) => {
      const el = stickyRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.5 || r.bottom < window.innerHeight * 0.5) return;
      if (e.key === "ArrowRight") { e.preventDefault(); stepFilm(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepFilm(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      film.listeners.delete(onFrame);
      window.removeEventListener("keydown", onKey);
      resetFilm();
      // start from the room entrance next time the section mounts
      scrollState.progress = 0;
      scrollState.targetProgress = 0;
    };
  }, []);

  const count = safeImages.length;
  return (
    // A tall wrapper: scrolling through it drives the camera. No wheel hijacking, and it works on touch.
    <div ref={wrapperRef} className="relative w-full" style={{ height: "320vh" }}>
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full bg-[#0a0705] overflow-hidden cursor-pointer"
        onClick={() => stepFilm(1)}
      >
        <Canvas
          camera={{ position: [0, 1.5, 6], fov: 45 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          shadows
        >
          <ScrollDriver wrapper={wrapperRef} sticky={stickyRef} />
          <ProjectorScene images={safeImages} />
        </Canvas>

        {/* Cinematic overlay text */}
        <div className="absolute top-1/2 -translate-y-1/2 left-12 md:left-24 text-white/80 font-serif z-10 pointer-events-none drop-shadow-2xl max-w-md">
          <h3 className="text-6xl md:text-8xl font-black tracking-widest text-amber-500/90 uppercase drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] leading-tight">
            {lines(heading).map((line, i) => (
              <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
            ))}
          </h3>
          <div className="w-24 h-1 bg-amber-500/60 my-8"></div>
          <p className="text-xl md:text-2xl italic tracking-wide text-white/80 drop-shadow-md">
            {fillCount(subtitle, count)}
          </p>
          <p className="text-sm md:text-base mt-4 text-white/40 tracking-wider uppercase">
            [ Scroll to roll the film ]
          </p>
          <p className="text-xs md:text-sm mt-2 text-white/30 tracking-wider uppercase">
            [ Click or ← → for the next photo · {(frameNo % count) + 1} / {count} ]
          </p>
        </div>
      </div>
    </div>
  );
}

// Reads how far the tall wrapper has scrolled through the viewport and turns it into camera progress.
// The journey completes at 80% of the range so there is a dwell at the end stop.
function ScrollDriver({ wrapper, sticky }: { wrapper: React.RefObject<HTMLDivElement>; sticky: React.RefObject<HTMLDivElement> }) {
  useFrame(() => {
    const w = wrapper.current, s = sticky.current;
    if (!w || !s) return;
    const r = w.getBoundingClientRect();
    const range = r.height - s.clientHeight;
    const raw = range > 0 ? -r.top / range : 0;
    scrollState.targetProgress = THREE.MathUtils.clamp(raw / 0.8, 0, 1);
  });
  return null;
}

function ProjectorScene({ images }: { images: string[] }) {
  // Every photo is decoded once here and shared by the screen, the beam and the wall frames
  const films = useFilm(images);
  return (
    <group>
      <Environment preset="night" />
      {/* Low base light: the projector, the lamp and the moon do the work */}
      <ambientLight intensity={0.35} color="#ffedd6" />
      <hemisphereLight args={['#ffedd6', '#5c3a21', 0.35]} />

      <LivingRoom films={films} />
      <Moonlight />

      <group position={[0, 0, 0]}>
        <VintageProjector />
        <LensGlow />
        <VolumetricBeam films={films} />
      </group>

      <ProjectionScreen films={films} />

      <CinematicCamera />
    </group>
  );
}

/* ───────────── Procedural room textures (generated once, client-side) ───────────── */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roomTexCache = new Map<string, THREE.Texture>();
function roomTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, rnd: () => number) => void, repeat = true) {
  const hit = roomTexCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, mulberry32(key.length * 7919 + w));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  roomTexCache.set(key, t);
  return t;
}

// Wavy grain lines shared by every wood surface
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

const getFloorTex = () => roomTex("floor", 1024, 1024, (ctx, rnd) => {
  const bh = 256;
  for (let b = 0; b < 4; b++) {
    const l = 0.8 + rnd() * 0.3;
    ctx.fillStyle = `rgb(${(78 * l) | 0}, ${(40 * l) | 0}, ${(18 * l) | 0})`;
    ctx.fillRect(0, b * bh, 1024, bh);
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(rnd() * 1024, b * bh, 3, bh);
  }
  grainLines(ctx, rnd, 1024, 1024, 220, false, 0.14);
  for (let b = 0; b < 4; b++) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, b * bh, 1024, 3);
    ctx.fillStyle = "rgba(255,225,190,0.08)"; ctx.fillRect(0, b * bh + 3, 1024, 2);
  }
});

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

const getWoodTex = () => roomTex("wood", 512, 512, (ctx, rnd) => {
  ctx.fillStyle = "#5a3118"; ctx.fillRect(0, 0, 512, 512);
  grainLines(ctx, rnd, 512, 512, 160, false, 0.18);
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, "rgba(255,220,180,0.10)"); g.addColorStop(1, "rgba(0,0,0,0.20)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
});

const getPlasterTex = () => roomTex("plaster", 512, 512, (ctx, rnd) => {
  ctx.fillStyle = "#2e241d"; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 8 + rnd() * 50;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rnd() < 0.5 ? "rgba(0,0,0,0.10)" : "rgba(255,225,190,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let i = 0; i < 6000; i++) ctx.fillRect(rnd() * 512, rnd() * 512, 1, 1);
});

const getRugTex = () => roomTex("rug", 840, 1024, (ctx, rnd) => {
  const W = 840, H = 1024;
  ctx.fillStyle = "#5c1f1f"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(0,0,0,0.10)"; ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 3) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  const band = (inset: number, width: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(inset, inset, W - inset * 2, width); ctx.fillRect(inset, H - inset - width, W - inset * 2, width);
    ctx.fillRect(inset, inset, width, H - inset * 2); ctx.fillRect(W - inset - width, inset, width, H - inset * 2);
  };
  band(0, 26, "#2b0f0f"); band(34, 8, "#c39a4a"); band(50, 40, "#3a1414"); band(98, 6, "#c39a4a");
  const dia = (cx: number, cy: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill();
  };
  ctx.fillStyle = "#a8763a";
  for (let x = 70; x < W - 60; x += 40) { dia(x, 70, 10); dia(x, H - 70, 10); }
  for (let y = 70; y < H - 60; y += 40) { dia(70, y, 10); dia(W - 70, y, 10); }
  ctx.strokeStyle = "rgba(195,154,74,0.35)"; ctx.lineWidth = 2;
  for (let x = 150; x < W - 110; x += 90) for (let y = 150; y < H - 110; y += 90) {
    ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + 30, y); ctx.lineTo(x, y + 30); ctx.lineTo(x - 30, y); ctx.closePath(); ctx.stroke();
  }
  const cx = W / 2, cy = H / 2;
  const cols = ["#c39a4a", "#3a1414", "#a8763a", "#5c1f1f", "#c39a4a"];
  [260, 210, 160, 110, 60].forEach((r, i) => { ctx.fillStyle = cols[i]; dia(cx, cy, r); });
  ctx.fillStyle = "#2b0f0f"; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  [[104, 104], [W - 104, 104], [104, H - 104], [W - 104, H - 104]].forEach(([x, y]) => {
    ctx.fillStyle = "#a8763a"; dia(x, y, 70); ctx.fillStyle = "#3a1414"; dia(x, y, 40);
  });
  void rnd;
}, false);

const getWindowTex = () => roomTex("window", 256, 320, (ctx, rnd) => {
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, "#070d1c"); g.addColorStop(1, "#111c38");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 90; i++) { ctx.globalAlpha = 0.3 + rnd() * 0.7; ctx.fillRect(rnd() * 256, rnd() * 320, rnd() < 0.2 ? 2 : 1, 1); }
  ctx.globalAlpha = 1;
  const mg = ctx.createRadialGradient(190, 70, 10, 190, 70, 60);
  mg.addColorStop(0, "rgba(220,235,255,0.9)"); mg.addColorStop(0.3, "rgba(200,220,255,0.35)"); mg.addColorStop(1, "rgba(200,220,255,0)");
  ctx.fillStyle = mg; ctx.fillRect(100, -20, 200, 200);
  ctx.fillStyle = "#eef4ff"; ctx.beginPath(); ctx.arc(190, 70, 18, 0, Math.PI * 2); ctx.fill();
}, false);

function useRepeat(get: () => THREE.Texture, rx: number, ry: number) {
  return useMemo(() => { const t = get().clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; }, [get, rx, ry]);
}

/* ───────────── Furniture & props ───────────── */
const FABRIC = { color: "#3a2626", roughness: 0.9 } as const;

function Armchair({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.2, 0.42, 1.05]} radius={0.06} smoothness={4} position={[0, 0.36, 0]} castShadow receiveShadow><meshStandardMaterial {...FABRIC} /></RoundedBox>
      <RoundedBox args={[1.2, 0.75, 0.28]} radius={0.06} smoothness={4} position={[0, 0.92, 0.42]} castShadow receiveShadow><meshStandardMaterial {...FABRIC} /></RoundedBox>
      {[-0.55, 0.55].map((x) => (
        <RoundedBox key={x} args={[0.22, 0.6, 1.0]} radius={0.05} smoothness={4} position={[x, 0.55, 0.05]} castShadow receiveShadow><meshStandardMaterial {...FABRIC} /></RoundedBox>
      ))}
      <RoundedBox args={[0.92, 0.14, 0.8]} radius={0.05} smoothness={4} position={[0, 0.64, -0.05]} castShadow receiveShadow><meshStandardMaterial color="#4a3030" roughness={0.9} /></RoundedBox>
      {[[-0.5, -0.45], [0.5, -0.45], [-0.5, 0.45], [0.5, 0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} castShadow><cylinderGeometry args={[0.035, 0.03, 0.16, 10]} /><meshStandardMaterial color="#2a1508" /></mesh>
      ))}
    </group>
  );
}

function Canister({ y, rot = 0 }: { y: number; rot?: number }) {
  return (
    <group position={[0, y, 0]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.06, 32]} /><meshStandardMaterial color="#6e6e6e" metalness={0.8} roughness={0.35} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.205, 0.205, 0.024, 32, 1, true]} /><meshStandardMaterial color="#e2d5b8" roughness={0.9} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.062, 0]}><cylinderGeometry args={[0.05, 0.05, 0.006, 16]} /><meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} /></mesh>
    </group>
  );
}

const BOWL_PROFILE = [[0, 0], [0.08, 0], [0.16, 0.03], [0.2, 0.1], [0.21, 0.14], [0.19, 0.14], [0.18, 0.11], [0.14, 0.03], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y));

function Popcorn({ position }: { position: [number, number, number] }) {
  const kernels = useMemo(() => {
    const rnd = mulberry32(5);
    return Array.from({ length: 26 }, () => {
      const a = rnd() * Math.PI * 2, r = rnd() * 0.15;
      return {
        p: [Math.cos(a) * r, 0.12 + rnd() * 0.06 + (0.15 - r) * 0.3, Math.sin(a) * r] as [number, number, number],
        s: 0.02 + rnd() * 0.015,
        c: rnd() < 0.7 ? "#f6e6b8" : "#f2c860",
      };
    });
  }, []);
  return (
    <group position={position}>
      <mesh castShadow><latheGeometry args={[BOWL_PROFILE, 32]} /><meshStandardMaterial color="#c8352e" roughness={0.4} /></mesh>
      {kernels.map((k, i) => (
        <mesh key={i} position={k.p} castShadow><dodecahedronGeometry args={[k.s, 0]} /><meshStandardMaterial color={k.c} roughness={1} /></mesh>
      ))}
    </group>
  );
}

/* ───────────── The room ───────────── */
function LivingRoom({ films }: { films: Film[] }) {
  const matRef1 = useRef<THREE.MeshStandardMaterial>(null);
  const matRef2 = useRef<THREE.MeshStandardMaterial>(null);
  const matRef3 = useRef<THREE.MeshStandardMaterial>(null);
  const mats = useMemo(() => [matRef1, matRef2, matRef3], []);

  useEffect(() => {
    if (!films.length) return;
    // Frames start black; once photos are in, let them show at full brightness
    mats.forEach((ref) => { if (ref.current) ref.current.color.setHex(0xffffff); });
  }, [films, mats]);

  const lamp = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lamp.current) lamp.current.intensity = 26 * (0.96 + 0.04 * Math.sin(state.clock.elapsedTime * 9.3));
    if (!films.length) return;

    // Change frames every 4 seconds (0.25 fps)
    const slideNumber = Math.floor(state.clock.elapsedTime * 0.25);
    mats.forEach((matRef, i) => {
      if (matRef.current) {
        // Ensure they always display DIFFERENT images by offsetting their index evenly
        const offset = Math.floor((films.length / 3) * i);
        const newTex = films[(slideNumber + offset) % films.length].tex;
        if (matRef.current.map !== newTex) {
          matRef.current.map = newTex;
          matRef.current.needsUpdate = true;
        }
      }
    });
  });

  const floorT = useRepeat(getFloorTex, 7, 7);
  const wallT = useRepeat(getPlasterTex, 6, 2);
  const sideT = useRepeat(getPlasterTex, 3.5, 1.8);
  const panelT = useRepeat(getPanelTex, 7, 1);
  const tableT = useRepeat(getWoodTex, 2, 1.2);
  const rugT = getRugTex(), skyT = getWindowTex();

  // Rug fringe along both short edges
  const fringe = useRef<THREE.InstancedMesh>(null);
  const FRINGE = 128;
  useEffect(() => {
    const m = fringe.current;
    if (!m) return;
    const M = new THREE.Matrix4();
    for (let i = 0; i < FRINGE; i++) {
      const side = i < FRINGE / 2 ? -1 : 1, k = i % (FRINGE / 2);
      M.makeTranslation(-2.2 + (k + 0.5) * (4.4 / (FRINGE / 2)), 0.012, 2.5 + side * 2.87);
      m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  const plaster = { roughness: 0.92, metalness: 0 } as const;
  const trim = { color: "#1f0f06", roughness: 0.6 } as const;

  return (
    <group>
      {/* Floorboards */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial map={floorT} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Woven rug with fringe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.5]} receiveShadow>
        <planeGeometry args={[4.5, 5.5]} />
        <meshStandardMaterial map={rugT} roughness={0.95} />
      </mesh>
      <instancedMesh ref={fringe} args={[undefined, undefined, FRINGE]} receiveShadow>
        <boxGeometry args={[0.022, 0.01, 0.24]} />
        <meshStandardMaterial color="#e6dcc6" roughness={1} />
      </instancedMesh>

      {/* Back wall: plaster above, walnut wainscot below */}
      <mesh position={[0, 4, -8]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial map={wallT} {...plaster} />
      </mesh>
      <mesh position={[0, 1.2, -7.95]} receiveShadow>
        <planeGeometry args={[30, 2.4]} />
        <meshStandardMaterial map={panelT} color="#8f7358" roughness={0.45} metalness={0.1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (i - 4) * 1.75).map((x) => (
        <mesh key={x} position={[x, 1.25, -7.93]} receiveShadow>
          <boxGeometry args={[1.25, 1.7, 0.025]} />
          <meshStandardMaterial map={panelT} color="#a58462" roughness={0.42} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[0, 2.4, -7.9]} receiveShadow castShadow>
        <boxGeometry args={[30, 0.1, 0.1]} />
        <meshStandardMaterial color="#2a1508" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.08, -7.92]} receiveShadow>
        <boxGeometry args={[30, 0.16, 0.06]} />
        <meshStandardMaterial {...trim} />
      </mesh>

      {/* Decorative Picture Frames on the Wall */}
      {[-3, 0, 3].map((x, i) => (
        <group key={`frame-${i}`} position={[x, 4.5, -7.9]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 2, 0.1]} />
            <meshStandardMaterial color="#8c7a51" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[1.4, 1.8]} />
            <meshStandardMaterial ref={mats[i]} color="#050505" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Left wall, built around the window so the moonlight only comes through the opening */}
      <group>
        {[
          { p: [-6.1, 0.75, 0], s: [0.2, 1.5, 16] },
          { p: [-6.1, 7.25, 0], s: [0.2, 1.5, 16] },
          { p: [-6.1, 4, -6], s: [0.2, 5, 4] },
          { p: [-6.1, 4, 4], s: [0.2, 5, 8] },
        ].map((b, i) => (
          <mesh key={i} position={b.p as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={b.s as [number, number, number]} />
            <meshStandardMaterial map={sideT} {...plaster} />
          </mesh>
        ))}
        <mesh position={[-5.97, 0.08, 0]} receiveShadow><boxGeometry args={[0.06, 0.16, 16]} /><meshStandardMaterial {...trim} /></mesh>
        {/* Night sky with a moon */}
        <mesh position={[-6.22, 4, -2]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4, 5]} />
          <meshBasicMaterial map={skyT} />
        </mesh>
        {/* Frame and panes — these cast the cross on the floor */}
        {[
          { p: [-5.98, 1.5, -2], s: [0.08, 0.1, 4.2] }, { p: [-5.98, 4, -2], s: [0.08, 0.08, 4.2] }, { p: [-5.98, 6.5, -2], s: [0.08, 0.1, 4.2] },
          { p: [-5.98, 4, -4], s: [0.08, 5.2, 0.1] }, { p: [-5.98, 4, -2], s: [0.08, 5.2, 0.08] }, { p: [-5.98, 4, 0], s: [0.08, 5.2, 0.1] },
        ].map((b, i) => (
          <mesh key={`pane-${i}`} position={b.p as [number, number, number]} castShadow>
            <boxGeometry args={b.s as [number, number, number]} />
            <meshStandardMaterial color="#141210" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[-5.9, 1.45, -2]} castShadow receiveShadow><boxGeometry args={[0.3, 0.08, 4.4]} /><meshStandardMaterial color="#1a1310" roughness={0.6} /></mesh>
      </group>

      {/* Right wall */}
      <mesh position={[6.1, 4, 0]} receiveShadow>
        <boxGeometry args={[0.2, 8, 16]} />
        <meshStandardMaterial map={sideT} {...plaster} />
      </mesh>
      <mesh position={[5.97, 0.08, 0]} receiveShadow><boxGeometry args={[0.06, 0.16, 16]} /><meshStandardMaterial {...trim} /></mesh>

      {/* Floor lamp in the corner — now an actual light source */}
      <group position={[-4, 0, -6]}>
        <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.2, 32]} /><meshStandardMaterial color="#b59a5b" metalness={0.8} /></mesh>
        <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 3, 16]} /><meshStandardMaterial color="#b59a5b" metalness={0.8} /></mesh>
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 0.6, 32, 1, true]} />
          <meshStandardMaterial color="#ffe6c8" emissive="#ffb870" emissiveIntensity={0.9} side={THREE.DoubleSide} transparent opacity={0.92} roughness={0.8} />
        </mesh>
        <mesh position={[0, 3.2, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#fff1d6" /></mesh>
        <pointLight
          ref={lamp}
          position={[0, 3.15, 0]}
          color="#ffc27a"
          intensity={26}
          distance={14}
          decay={2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.001}
          shadow-normalBias={0.03}
          shadow-camera-near={0.3}
          shadow-camera-far={16}
        />
      </group>

      {/* Armchairs facing the screen */}
      <Armchair position={[-3.3, 0, 4.4]} rotation={[0, 0.25, 0]} />
      <Armchair position={[3.3, 0, 4.4]} rotation={[0, -0.25, 0]} />

      {/* Coffee Table / Projector Stand */}
      <group position={[0, 0, 2.5]}>
        <mesh position={[0, 0.7, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.2, 0.1, 1.4]} />
          <meshStandardMaterial map={tableT} roughness={0.45} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.6, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.0, 0.1, 1.2]} />
          <meshStandardMaterial color="#1a0d04" roughness={0.6} />
        </mesh>
        {[-1.0, 1.0].map(x => [-0.6, 0.6].map(z => (
          <group key={`${x}-${z}`} position={[x, 0.35, z]}>
             <mesh castShadow><cylinderGeometry args={[0.06, 0.04, 0.7, 16]} /><meshStandardMaterial color="#2a1508" /></mesh>
             <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.08, 0.08, 0.05, 16]} /><meshStandardMaterial color="#b59a5b" metalness={0.8} /></mesh>
          </group>
        )))}

        {/* Film canisters and a bowl of popcorn */}
        <group position={[0.65, 0.75, 0.15]}>
          <Canister y={0} rot={0.4} />
          <Canister y={0.065} rot={0.9} />
        </group>
        <Popcorn position={[-0.7, 0.75, -0.15]} />
      </group>
    </group>
  );
}

/* ───────────── The projector ─────────────
   Two reels side by side on top, faces toward the screen and the audience. The feed pack
   empties while the take-up fills, so their speeds drift apart the way real reels do;
   the film runs down the inner faces into the gate and back up, fluttering slightly. */
const REEL_Y = 0.78, FEED_X = -0.33, TAKE_X = 0.33, GATE_Y = 0.43;
const REEL_R = 0.25, PACK_MAX = 0.22, PACK_MIN = 0.09;
const REEL_CYCLE = 90;              // seconds for a full reel to run through
const FILM_SPEED = 0.9;             // film travel, world units per second

const METAL = { color: "#4a4238", metalness: 0.9, roughness: 0.3 } as const;
const BRASS = { color: "#b59a5b", metalness: 0.9, roughness: 0.35 } as const;

function Reel({ x, pack, spin }: { x: number; pack: React.RefObject<THREE.Mesh>; spin: React.RefObject<THREE.Group> }) {
  const spokes = [0, 1, 2].map((i) => (i * Math.PI * 2) / 3);
  return (
    <group position={[x, REEL_Y, 0]}>
      {/* everything inside spins about the hub, not about the projector */}
      <group ref={spin}>
      {[-0.016, 0.016].map((zz) => (
        <group key={zz} position={[0, 0, zz]}>
          <mesh castShadow><torusGeometry args={[REEL_R, 0.011, 8, 48]} /><meshStandardMaterial {...BRASS} /></mesh>
          <mesh><torusGeometry args={[0.07, 0.009, 8, 24]} /><meshStandardMaterial {...BRASS} /></mesh>
          {spokes.map((a) => (
            <group key={a} rotation={[0, 0, a]}>
              <mesh position={[0, (0.07 + REEL_R) / 2, 0]} castShadow>
                <boxGeometry args={[0.012, REEL_R - 0.07, 0.024]} />
                <meshStandardMaterial {...BRASS} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* film wound on the reel — scaled every frame */}
      <mesh ref={pack} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[PACK_MAX, PACK_MAX, 0.024, 40]} />
        <meshStandardMaterial color="#141414" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.07, 16]} /><meshStandardMaterial {...METAL} /></mesh>
      </group>
    </group>
  );
}

// Where the film leaves (or meets) a reel: the tangent from the gate to the pack, on the reel's inner face.
// Works in (y, x): returns the higher of the two tangent points.
function tangentPoint(cy: number, cx: number, r: number, gy: number, gx: number): [number, number] {
  const dy = gy - cy, dx = gx - cx;
  const d = Math.hypot(dy, dx);
  const phi = Math.atan2(dx, dy);
  const alpha = Math.acos(Math.min(1, r / d));
  const at = (th: number): [number, number] => [cy + r * Math.cos(th), cx + r * Math.sin(th)];
  const a = at(phi + alpha), b = at(phi - alpha);
  return a[0] > b[0] ? a : b;
}

// Places a thin ribbon between two points in the XY plane (facing the audience), with a little flutter
function placeRibbon(m: THREE.Mesh | null, a: [number, number, number], b: [number, number, number], t: number) {
  if (!m) return;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + Math.sin(t * 9.1) * 0.0015);
  m.rotation.set(0, Math.sin(t * 7.3) * 0.03, Math.atan2(-dx, dy));
  m.scale.set(1, len, 1);
}

function VintageProjector() {
  const feed = useRef<THREE.Group>(null);
  const take = useRef<THREE.Group>(null);
  const feedPack = useRef<THREE.Mesh>(null);
  const takePack = useRef<THREE.Mesh>(null);
  const ribbonA = useRef<THREE.Mesh>(null);
  const ribbonB = useRef<THREE.Mesh>(null);
  const angle = useRef({ feed: 0, take: 0 });

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime, dt = Math.min(delta, 1 / 30);
    const phase = (t % REEL_CYCLE) / REEL_CYCLE;
    const rFeed = THREE.MathUtils.lerp(PACK_MAX, PACK_MIN, phase);
    const rTake = THREE.MathUtils.lerp(PACK_MIN, PACK_MAX, phase);
    // constant film speed → angular speed follows the pack radius; clockwise so the inner faces run down into the gate
    angle.current.feed -= (FILM_SPEED / rFeed) * dt;
    angle.current.take -= (FILM_SPEED / rTake) * dt;
    if (feed.current) feed.current.rotation.z = angle.current.feed;
    if (take.current) take.current.rotation.z = angle.current.take;
    if (feedPack.current) feedPack.current.scale.set(rFeed / PACK_MAX, 1, rFeed / PACK_MAX);
    if (takePack.current) takePack.current.scale.set(rTake / PACK_MAX, 1, rTake / PACK_MAX);
    const [fy, fx] = tangentPoint(REEL_Y, FEED_X, rFeed, GATE_Y, -0.13);
    const [ty, tx] = tangentPoint(REEL_Y, TAKE_X, rTake, GATE_Y, 0.13);
    placeRibbon(ribbonA.current, [fx, fy, 0], [-0.13, GATE_Y, 0], t);
    placeRibbon(ribbonB.current, [0.13, GATE_Y, 0], [tx, ty, 0], t + 1.3);
  });

  return (
    <group position={[0, 0.75, 2.5]}>
      {/* Body - Vintage Brass & Steel */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.5]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.2, 0.26]}>
        <boxGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial {...BRASS} metalness={1} roughness={0.2} />
      </mesh>
      {/* film gate on top of the body, between the reels */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.3, 0.06, 0.08]} />
        <meshStandardMaterial {...METAL} />
      </mesh>

      {/* Lens Tube */}
      <mesh position={[0, 0.3, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.3, 16]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Lens Glass */}
      <mesh position={[0, 0.3, -0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={1} roughness={0} emissive="#ffddaa" emissiveIntensity={3} />
      </mesh>

      {/* Reel arms: a crossbar behind the reels with a post up to each hub */}
      <mesh position={[0, 0.47, -0.05]} castShadow>
        <boxGeometry args={[0.72, 0.03, 0.03]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {[FEED_X, TAKE_X].map((x) => (
        <mesh key={x} position={[x, (0.47 + REEL_Y) / 2, -0.05]} castShadow>
          <boxGeometry args={[0.03, REEL_Y - 0.47, 0.02]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      <Reel x={FEED_X} pack={feedPack} spin={feed} />
      <Reel x={TAKE_X} pack={takePack} spin={take} />

      {/* Film ribbons: feed → gate → take-up */}
      {[ribbonA, ribbonB].map((r, i) => (
        <mesh key={i} ref={r}>
          <planeGeometry args={[0.022, 1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────── Geometry of the throw ─────────────
   Projector group sits at (0, 0.75, 2.5); its lens glass is at local (0, 0.3, -0.46),
   so the light leaves the lens at world (0, 1.05, ~2.04). The screen hangs at (0, 1.5, -4.9). */
const LENS_FRONT = new THREE.Vector3(0, 1.05, 2.0);
const SCREEN = new THREE.Vector3(0, 1.5, -4.9);
const SCREEN_W = 4.2, SCREEN_H = 3.1;
const FRAME_ASPECT = 1.4 / 1.8;      // the three wall frames are portrait

/* ───────────── Film transport (shared by screen, beam, lens and the overlay counter) ─────────────
   Advances on its own every FRAME_DUR seconds; stepFilm() jumps at once, backwards too. */
const FRAME_DUR = 2.5;              // seconds each photo stays up
const PULL_DUR = 0.06;              // the pull-down between frames

const film = {
  frame: 0,
  dir: 1 as 1 | -1,
  pullStart: -1,
  nextAt: FRAME_DUR,
  pull: 0,                          // -1..1 while a pull-down is in progress, 0 otherwise
  listeners: new Set<() => void>(),
};

function stepFilm(dir: 1 | -1) {
  film.dir = dir;
  film.nextAt = -1;                 // pull down on the next tick
}

function resetFilm() {
  film.frame = 0; film.dir = 1; film.pullStart = -1; film.nextAt = FRAME_DUR; film.pull = 0;
}

function driveFilm(t: number, count: number) {
  if (film.pullStart < 0 && (film.nextAt < 0 || t >= film.nextAt)) film.pullStart = t;
  if (film.pullStart < 0) return;
  const k = (t - film.pullStart) / PULL_DUR;
  if (k >= 1) {
    film.frame = count ? (((film.frame + film.dir) % count) + count) % count : 0;
    film.pullStart = -1;
    film.pull = 0;
    film.nextAt = t + FRAME_DUR;
    film.dir = 1;
    film.listeners.forEach((l) => l());
  } else {
    film.pull = film.dir * k;
  }
}

// Lamp flicker: deterministic so the screen and the beam agree frame to frame
function lampFlicker(t: number, pull: number) {
  const r = Math.abs(Math.sin(t * 7919.7) * 43758.5) % 1;
  return (0.9 + 0.06 * Math.sin(t * 151) + 0.05 * r) * (pull !== 0 ? 0.35 : 1);
}

/* ───────────── Texture loading: once per URL, sized for the GPU ───────────── */
// Uploads are stored as full-size Cloudinary URLs; the screen never needs more than ~1200px.
function sizedUrl(url: string) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*\b(w_|c_|q_|f_)/.test(url)) return url;
  return url.replace("/upload/", "/upload/w_1200,c_limit,q_auto,f_auto/");
}

type Film = { tex: THREE.Texture; aspect: number; tint: THREE.Color };
const filmCache = new Map<string, Promise<Film>>();

function averageColor(img: HTMLImageElement | undefined): THREE.Color {
  try {
    if (!img) throw new Error("no image");
    const c = document.createElement("canvas");
    c.width = 8; c.height = 8;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, 8, 8);
    const d = ctx.getImageData(0, 0, 8, 8).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return new THREE.Color(r / n / 255, g / n / 255, b / n / 255);
  } catch {
    return new THREE.Color("#ffe4c4");
  }
}

function loadFilm(url: string): Promise<Film> {
  const hit = filmCache.get(url);
  if (hit) return hit;
  const p = new Promise<Film>((resolve) => {
    const loader = new THREE.TextureLoader();
    // Only set crossOrigin for real URLs; blob:/data: URIs fail strict CORS in some browsers
    if (!url.startsWith("blob:") && !url.startsWith("data:")) loader.setCrossOrigin("anonymous");
    loader.load(
      sizedUrl(url),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const img = tex.image as HTMLImageElement | undefined;
        const aspect = img?.width && img?.height ? img.width / img.height : 4 / 3;
        // The wall frames show this texture through a standard material, so cover-crop it to their
        // portrait shape here. The screen shader samples raw UVs and letterboxes on its own.
        if (aspect > FRAME_ASPECT) { tex.repeat.set(FRAME_ASPECT / aspect, 1); tex.offset.set((1 - FRAME_ASPECT / aspect) / 2, 0); }
        else { tex.repeat.set(1, aspect / FRAME_ASPECT); tex.offset.set(0, (1 - aspect / FRAME_ASPECT) / 2); }
        resolve({ tex, aspect, tint: averageColor(img) });
      },
      undefined,
      (err) => {
        console.error("Failed to load texture", url, err);
        const canvas = document.createElement("canvas");
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#333"; ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = "#fff"; ctx.font = "40px sans-serif"; ctx.fillText("Image Error", 150, 256);
        resolve({ tex: new THREE.CanvasTexture(canvas), aspect: 1, tint: new THREE.Color("#888888") });
      },
    );
  });
  filmCache.set(url, p);
  return p;
}

function useFilm(images: string[]) {
  const [films, setFilms] = useState<Film[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all(images.map(loadFilm)).then((f) => { if (alive) setFilms(f); });
    return () => { alive = false; };
  }, [images]);
  return films;
}

/* ───────────── Small procedural textures ───────────── */
let glowTex: THREE.Texture | null = null;
function getGlowTex() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,240,210,0.6)");
  g.addColorStop(0.6, "rgba(255,200,120,0.15)");
  g.addColorStop(1, "rgba(255,180,80,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

let blankTex: THREE.Texture | null = null;
function getBlankTex() {
  if (blankTex) return blankTex;
  const c = document.createElement("canvas");
  c.width = 2; c.height = 2;
  c.getContext("2d")!.fillStyle = "#000";
  c.getContext("2d")!.fillRect(0, 0, 2, 2);
  blankTex = new THREE.CanvasTexture(c);
  return blankTex;
}

/* ───────────── Shaders ───────────── */
const PASS_UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The screen: fabric + projected light. Letterboxes the photo, adds a hotspot, warm tint,
// soft edges, film grain, dust specks, the odd scratch, gate weave and the pull-down frame line.
const SCREEN_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uImgAspect, uScreenAspect, uTime, uBright, uPull;
  uniform vec2 uJitter;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  vec3 sampleImg(vec2 uv, out float inside) {
    vec2 f = uv - 0.5;
    if (uImgAspect > uScreenAspect) f.y *= uImgAspect / uScreenAspect; else f.x *= uScreenAspect / uImgAspect;
    vec2 t = f + 0.5;
    inside = step(0.0, t.x) * step(t.x, 1.0) * step(0.0, t.y) * step(t.y, 1.0);
    return texture2D(uMap, clamp(t, 0.0, 1.0)).rgb * inside;
  }

  void main() {
    float d = length((vUv - 0.5) * vec2(1.0, 0.8));

    // the screen fabric itself: fine weave, a little sheen towards the middle
    float weave = 0.92 + 0.08 * (0.5 * sin(vUv.x * 1400.0) + 0.5 * sin(vUv.y * 1100.0));
    vec3 fabric = vec3(0.11, 0.105, 0.095) * weave * (1.05 - 0.3 * d);

    // gate weave + pull-down shift
    vec2 uv = vUv + uJitter;
    uv.y = fract(uv.y + uPull);

    float vig = 1.0 - smoothstep(0.15, 0.75, d);
    float hot = 0.62 + 0.55 * vig;                 // bright centre, dimmer corners
    float soft = (1.0 - vig) * 0.0035;             // edges slightly out of focus

    float inside, i2, i3, i4, i5;
    vec3 img = sampleImg(uv, inside);
    vec3 blur = (sampleImg(uv + vec2(soft, 0.0), i2) + sampleImg(uv - vec2(soft, 0.0), i3)
               + sampleImg(uv + vec2(0.0, soft), i4) + sampleImg(uv - vec2(0.0, soft), i5)) * 0.25;
    img = mix(img, blur, 0.6);

    // film artefacts, refreshed 24 times a second like a real print
    float fr = floor(uTime * 24.0);
    float grain = hash(floor(gl_FragCoord.xy / 1.5) + fr) - 0.5;
    img += grain * 0.07 * inside;
    float speck = step(0.9992, hash(floor(gl_FragCoord.xy / 5.0) + fr * 1.7));
    img *= 1.0 - speck * 0.7;
    float slot = floor(uTime * 6.0);
    float sx = hash(vec2(slot, 7.0));
    float show = step(0.8, hash(vec2(slot, 3.0)));
    float scratch = show * (1.0 - smoothstep(0.0, 0.0018, abs(vUv.x - sx))) * (0.5 + 0.5 * hash(vec2(floor(vUv.y * 40.0), slot)));
    img += scratch * 0.45 * inside;

    // the frame line sweeping through during the pull-down
    float seam = min(uv.y, 1.0 - uv.y);
    float bar = (abs(uPull) > 0.0 ? 1.0 : 0.0) * (1.0 - smoothstep(0.0, 0.025, seam));
    img *= 1.0 - bar;

    vec3 warm = vec3(1.0, 0.95, 0.85);
    gl_FragColor = vec4(fabric + img * hot * warm * uBright, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// The beam: a rectangular frustum from the lens to the screen, brightest at the lens,
// faintly tinted by the photo being shown, with a slow shimmer of haze.
const BEAM_VERT = /* glsl */ `
  attribute float aT;
  attribute float aKind;
  varying float vT;
  varying float vKind;
  varying vec3 vPos;
  void main() {
    vT = aT; vKind = aKind; vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const BEAM_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uTint;
  uniform float uTime, uBright;
  varying float vT;
  varying float vKind;
  varying vec3 vPos;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // smooth value noise, so the haze wafts instead of showing cells
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    float fall = pow(1.0 - vT, 1.6);
    vec2 hp = vec2(vPos.x * 2.5 + uTime * 0.12, vPos.y * 2.5 - uTime * 0.08 + vPos.z * 0.6);
    float haze = 0.8 + 0.4 * (0.6 * vnoise(hp) + 0.4 * vnoise(hp * 2.3 + 7.0));
    float a = (vKind < 0.5 ? 0.2 : 0.03) * (0.25 + fall) * haze * uBright;
    vec3 col = mix(vec3(1.0, 0.92, 0.8), uTint, 0.35);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* Moonlight through the window, aimed at the floor (a light's target must live in the scene to work) */
function Moonlight() {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={target} position={[-2.8, 0, -2]} />
      <spotLight
        position={[-10, 9, -2]}
        target={target}
        intensity={420}
        color="#8fb6ff"
        angle={0.42}
        penumbra={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-near={1}
        shadow-camera-far={26}
      />
    </>
  );
}

/* Glow on the lens, flaring when the camera looks down the barrel */
function LensGlow() {
  const halo = useRef<THREE.Sprite>(null);
  const glow = getGlowTex();
  useFrame(({ camera }) => {
    if (!halo.current) return;
    const toCam = camera.position.clone().sub(LENS_FRONT).normalize();
    const facing = -toCam.z;                    // the lens points down -z
    const k = THREE.MathUtils.smoothstep(facing, 0.85, 0.995);
    const pull = film.pull;
    halo.current.scale.setScalar((0.5 + 2.5 * k) * (pull !== 0 ? 0.8 : 1));
    (halo.current.material as THREE.SpriteMaterial).opacity = 0.15 + 0.6 * k;
  });
  return (
    <group position={[LENS_FRONT.x, LENS_FRONT.y, LENS_FRONT.z]}>
      <sprite scale={[0.3, 0.3, 1]}>
        <spriteMaterial map={glow} color="#ffe0b0" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={halo} scale={[0.5, 0.5, 1]}>
        <spriteMaterial map={glow} color="#ffcf90" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* Beam cross-section: a tiny aperture at the lens growing to the screen rectangle */
const AX = 0.04, AY = 0.03, BX = (SCREEN_W / 2) * 0.98, BY = (SCREEN_H / 2) * 0.98;
const beamHalf = (u: number): [number, number] => [THREE.MathUtils.lerp(AX, BX, u), THREE.MathUtils.lerp(AY, BY, u)];
const beamCenter = (u: number, out: THREE.Vector3) => out.copy(LENS_FRONT).lerp(SCREEN, u);

function VolumetricBeam({ films }: { films: Film[] }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const dust = useRef<THREE.Points>(null);
  const DUST = 220;

  // Frustum shell (4 sides) plus a few cross-section slices that fake the haze inside it
  const frustum = useMemo(() => {
    const corners = (p: THREE.Vector3, hx: number, hy: number) => [
      [p.x - hx, p.y + hy, p.z], [p.x + hx, p.y + hy, p.z], [p.x + hx, p.y - hy, p.z], [p.x - hx, p.y - hy, p.z],
    ];
    const A = corners(LENS_FRONT, AX, AY), B = corners(SCREEN, BX, BY);
    const pos: number[] = [], t: number[] = [], kind: number[] = [];
    const tri = [0, 1, 2, 0, 2, 3];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const quad = [A[i], A[j], B[j], B[i]], tq = [0, 0, 1, 1];
      for (const k of tri) { pos.push(...quad[k]); t.push(tq[k]); kind.push(0); }
    }
    const c = new THREE.Vector3();
    for (let s = 1; s <= 10; s++) {
      const u = s / 11, [hx, hy] = beamHalf(u);
      beamCenter(u, c);
      const q = [[c.x - hx, c.y + hy, c.z], [c.x + hx, c.y + hy, c.z], [c.x + hx, c.y - hy, c.z], [c.x - hx, c.y - hy, c.z]];
      for (const k of tri) { pos.push(...q[k]); t.push(u); kind.push(1); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.Float32BufferAttribute(t, 1));
    g.setAttribute("aKind", new THREE.Float32BufferAttribute(kind, 1));
    return g;
  }, []);

  const beamUniforms = useMemo(() => ({
    uTint: { value: new THREE.Color("#ffe4c4") },
    uTime: { value: 0 },
    uBright: { value: 1 },
  }), []);

  // Dust motes drifting inside the frustum; respawn when they leave it
  const { pos, vel, seed } = useMemo(() => {
    const pos = new Float32Array(DUST * 3), vel = new Float32Array(DUST * 3), seed = new Float32Array(DUST);
    const c = new THREE.Vector3();
    for (let i = 0; i < DUST; i++) {
      const u = 0.05 + Math.random() * 0.95, [hx, hy] = beamHalf(u);
      beamCenter(u, c);
      pos[i * 3] = c.x + (Math.random() * 2 - 1) * hx;
      pos[i * 3 + 1] = c.y + (Math.random() * 2 - 1) * hy;
      pos[i * 3 + 2] = c.z;
      vel[i * 3] = (Math.random() - 0.5) * 0.08;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
      vel[i * 3 + 2] = -0.02 - Math.random() * 0.05;
      seed[i] = Math.random() * Math.PI * 2;
    }
    return { pos, vel, seed };
  }, []);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    const { frame, pull } = film;
    const bright = lampFlicker(t, pull);
    beamUniforms.uTime.value = t;
    beamUniforms.uBright.value = films.length ? bright : 0.6;
    if (films.length) beamUniforms.uTint.value.lerp(films[frame % films.length].tint, 0.08);

    const p = dust.current;
    if (!p) return;
    const posAttr = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = p.geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < DUST; i++) {
      let x = pos[i * 3] + vel[i * 3] * dt;
      let y = pos[i * 3 + 1] + (vel[i * 3 + 1] + Math.sin(t * 0.5 + seed[i]) * 0.03) * dt;
      let z = pos[i * 3 + 2] + vel[i * 3 + 2] * dt;
      let u = (z - LENS_FRONT.z) / (SCREEN.z - LENS_FRONT.z);
      let [hx, hy] = beamHalf(u);
      beamCenter(u, tmp);
      if (u < 0.03 || u > 1 || Math.abs(x - tmp.x) > hx || Math.abs(y - tmp.y) > hy) {
        u = 0.05 + Math.random() * 0.95;
        [hx, hy] = beamHalf(u);
        beamCenter(u, tmp);
        x = tmp.x + (Math.random() * 2 - 1) * hx;
        y = tmp.y + (Math.random() * 2 - 1) * hy;
        z = tmp.z;
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      posAttr.setXYZ(i, x, y, z);
      const b = (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3 + seed[i] * 4))) * (1 - u * 0.45) * bright;
      colAttr.setXYZ(i, b, b * 0.9, b * 0.75);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <group>
      {/* The light that actually reaches the screen and spills onto the stand and wall */}
      <primitive object={target} position={[SCREEN.x, SCREEN.y, SCREEN.z]} />
      <spotLight
        position={[LENS_FRONT.x, LENS_FRONT.y, LENS_FRONT.z]}
        target={target}
        angle={0.36}
        penumbra={0.35}
        intensity={6}
        color="#ffebd4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        distance={20}
      />

      {/* Visible beam */}
      <mesh geometry={frustum}>
        <shaderMaterial
          uniforms={beamUniforms}
          vertexShader={BEAM_VERT}
          fragmentShader={BEAM_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dust caught in the beam */}
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[new Float32Array(DUST * 3).fill(1), 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={getGlowTex()}
          size={0.05}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function ProjectionScreen({ films }: { films: Film[] }) {
  const glow = useRef<THREE.PointLight>(null);
  const uniforms = useMemo(() => ({
    uMap: { value: getBlankTex() },
    uImgAspect: { value: 4 / 3 },
    uScreenAspect: { value: SCREEN_W / SCREEN_H },
    uTime: { value: 0 },
    uBright: { value: 0 },
    uPull: { value: 0 },
    uJitter: { value: new THREE.Vector2() },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;
    if (!films.length) { uniforms.uBright.value = 0; if (glow.current) glow.current.intensity = 3; return; }

    driveFilm(t, films.length);
    const { frame, pull } = film;
    const current = films[frame % films.length];
    if (uniforms.uMap.value !== current.tex) {
      uniforms.uMap.value = current.tex;
      uniforms.uImgAspect.value = current.aspect;
    }
    uniforms.uPull.value = pull;
    uniforms.uBright.value = lampFlicker(t, pull);
    if (glow.current) {
      glow.current.color.lerp(current.tint, 0.08);
      glow.current.intensity = 16 * uniforms.uBright.value;
    }
    // gate weave: the print never sits perfectly still in the gate
    uniforms.uJitter.value.set((Math.random() - 0.5) * 0.0025, (Math.random() - 0.5) * 0.002);
  });

  const caseW = SCREEN_W + 0.3;
  return (
    <group position={[SCREEN.x, SCREEN.y, SCREEN.z]}>
      {/* Fabric + projected light, all in one shader */}
      <mesh>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <shaderMaterial uniforms={uniforms} vertexShader={PASS_UV_VERT} fragmentShader={SCREEN_FRAG} />
      </mesh>

      {/* Light from the picture bouncing back into the room */}
      <pointLight ref={glow} position={[0, 0.2, 1.4]} color="#ffe4c4" intensity={6} distance={9} decay={2} />

      {/* Pull-down case along the top */}
      <mesh position={[0, SCREEN_H / 2 + 0.1, -0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, caseW, 20]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (caseW / 2 + 0.02), SCREEN_H / 2 + 0.1, -0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.04, 20]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, SCREEN_H / 2 + 0.02, -0.02]}>
        <boxGeometry args={[SCREEN_W, 0.03, 0.02]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Projection Screen Frame / Stand */}
      <mesh position={[0, -1.8, -0.05]}>
        <boxGeometry args={[4.4, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Stand Legs */}
      <mesh position={[-2, -2.8, -0.05]}><cylinderGeometry args={[0.05, 0.05, 2]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[2, -2.8, -0.05]}><cylinderGeometry args={[0.05, 0.05, 2]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
    </group>
  );
}

function CinematicCamera() {
  // Define a cinematic camera path that flies through the room
  const cameraPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.8, 7),      // 1. Scene entrance (high up)
    new THREE.Vector3(1.5, 1.2, 3.5),  // 2. Fly right, look at projector side
    new THREE.Vector3(0.5, 0.9, 2.3),  // 3. Inspecting film reels closely
    new THREE.Vector3(-0.2, 1.1, 1.8), // 4. Move around to the front lens
    new THREE.Vector3(0, 1.5, 0),      // 5. Enter the volumetric light beam
    new THREE.Vector3(0, 1.5, -3.5),   // 6. Arrive right in front of the screen
  ]), []);

  // Define where the camera should look at each step of the path
  const lookAtPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.8, 2.5),    // 1. Look down at projector on table
    new THREE.Vector3(0, 0.8, 2.5),    // 2. Keep looking at projector
    new THREE.Vector3(0, 0.8, 2.5),    // 3. Focus on reels
    new THREE.Vector3(0, 1.5, -6),     // 4. Suddenly look down the beam at the screen
    new THREE.Vector3(0, 1.5, -6),     // 5. Keep looking at screen
    new THREE.Vector3(0, 1.5, -6),     // 6. Focus on the memory
  ]), []);

  useFrame(({ camera, clock }) => {
    // Smoothly interpolate scroll progress for buttery animation
    scrollState.progress += (scrollState.targetProgress - scrollState.progress) * 0.05;
    
    // Evaluate the splines based on progress (0 to 1)
    const pos = cameraPath.getPointAt(scrollState.progress);
    const lookAtPos = lookAtPath.getPointAt(scrollState.progress);

    // Handheld drift: slow sway plus a faint tremor, on both the position and the aim
    const t = clock.elapsedTime;
    pos.x += Math.sin(t * 0.37) * 0.03 + Math.sin(t * 1.9) * 0.004;
    pos.y += Math.sin(t * 0.53 + 1) * 0.02 + Math.sin(t * 2.3) * 0.003;
    lookAtPos.x += Math.sin(t * 0.29 + 2) * 0.05;
    lookAtPos.y += Math.sin(t * 0.41) * 0.03;
    
    camera.position.copy(pos);
    camera.lookAt(lookAtPos);
  });
  
  return null;
}
