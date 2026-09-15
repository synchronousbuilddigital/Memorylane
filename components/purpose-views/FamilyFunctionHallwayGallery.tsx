"use client";

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Generate a warm placeholder canvas texture (shown while real image loads)
function makePlaceholderTex(idx: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  const warmPalette = ['#c4a882', '#b89a72', '#d4b896', '#a08060', '#c8aa80', '#b8986e'];
  ctx.fillStyle = warmPalette[idx % warmPalette.length];
  ctx.fillRect(0, 0, 256, 192);
  const g = ctx.createRadialGradient(128, 96, 30, 128, 96, 140);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 192);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const textureCache = new Map<string, THREE.Texture>();

function getOrLoadTexture(url: string, fallbackIdx: number, onLoaded: () => void): THREE.Texture {
  if (!url) return makePlaceholderTex(fallbackIdx);
  if (textureCache.has(url)) return textureCache.get(url)!;
  
  const placeholder = makePlaceholderTex(fallbackIdx);
  textureCache.set(url, placeholder); // temporarily set placeholder to avoid multiple loads
  
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(url, t);
    onLoaded();
  }, undefined, () => {
    // Keep placeholder on error
  });
  
  return placeholder;
}

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?w=600&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?w=600&q=60&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=60&auto=format&fit=crop",
];

interface FrameData {
  id: string;
  isLeft: boolean;
  x: number;
  y: number;
  z: number;
  idxOffset: number;
}

// Global scroll state reference
const scrollState = { progress: 0, targetProgress: 0 };

function FiniteHallwayScene({ images }: { images: any[] }) {
  const { camera } = useThree();
  
  const HALL_LEN = 60;
  const HALL_START = 10;
  const HALL_END = HALL_START - HALL_LEN;
  const CAMERA_START_Z = 6;
  const CAMERA_END_Z = -42;
  const NUM_FRAMES = 24; // 12 left, 12 right

  // Safe image list
  const safeImages = Array.from({ length: Math.max(images.length, NUM_FRAMES) }, (_, i) => {
    if (i < images.length) {
      const img = images[i];
      return img?.displayUrl || img?.url || (typeof img === 'string' ? img : PLACEHOLDERS[i % PLACEHOLDERS.length]);
    }
    return PLACEHOLDERS[i % PLACEHOLDERS.length];
  });

  // Generate fixed frame slots
  const frames = useMemo(() => {
    const list: FrameData[] = [];
    const NUM_PER_SIDE = 8;
    const zSpacing = 44 / NUM_PER_SIDE; // Spread 8 frames from z=4 to z=-40
    for (let i = 0; i < NUM_PER_SIDE; i++) {
      const z = 4 - i * zSpacing;
      // All frames exactly at eye level for a clean, professional museum look
      const yLevel = 2.0;
      // Perfectly on the wall (wall is at 2.8)
      list.push({ id: `L-${i}`, isLeft: true, x: -2.75, y: yLevel, z, idxOffset: i * 2 });
      list.push({ id: `R-${i}`, isLeft: false, x: 2.75, y: yLevel, z, idxOffset: i * 2 + 1 });
    }
    return list;
  }, []);

  useFrame(() => {
    scrollState.progress += (scrollState.targetProgress - scrollState.progress) * 0.1;
    camera.position.x = 0;
    camera.position.y = 1.8;
    camera.position.z = THREE.MathUtils.lerp(CAMERA_START_Z, CAMERA_END_Z, scrollState.progress);
    camera.lookAt(0, 1.8, camera.position.z - 10);
  });

  return (
    <group>
      {/* Brighter, warmer fog */}
      <fog attach="fog" args={['#e8dac3', 8, 30]} />
      
      {/* Much brighter lighting so the room isn't dark */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[0, 10, 5]} intensity={1.2} color="#fff5e0" />
      <hemisphereLight args={['#ffffff', '#8a7050', 1.0]} />

      {/* Static Architecture */}
      <group position={[0, 0, (HALL_START + HALL_END)/2]}>
        {/* FLOOR - Warm wood */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[5.6, HALL_LEN]} />
          <meshStandardMaterial color="#4a2511" roughness={0.2} metalness={0.1} />
        </mesh>
        
        {/* MUSEUM ORNAMENT: Luxurious Red Carpet Runner */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[2.4, HALL_LEN]} />
          <meshStandardMaterial color="#7a1015" roughness={0.9} />
        </mesh>
        {/* Carpet Gold Borders */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.25, 0.02, 0]}>
          <planeGeometry args={[0.1, HALL_LEN]} />
          <meshStandardMaterial color="#d4af37" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.25, 0.02, 0]}>
          <planeGeometry args={[0.1, HALL_LEN]} />
          <meshStandardMaterial color="#d4af37" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* CEILING - Bright cream */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.4, 0]}>
          <planeGeometry args={[5.6, HALL_LEN]} />
          <meshStandardMaterial color="#f0ead6" roughness={0.9} />
        </mesh>
        
        {/* UPPER WALLS - Shining Brown */}
        <mesh position={[-2.8, 2.7, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[HALL_LEN, 5.4]} />
          <meshStandardMaterial color="#5c3616" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[2.8, 2.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[HALL_LEN, 5.4]} />
          <meshStandardMaterial color="#5c3616" roughness={0.4} metalness={0.3} />
        </mesh>
        
        {/* LOWER WALLS (Wainscoting) - Darker Shining Brown */}
        <mesh position={[-2.78, 0.7, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[HALL_LEN, 1.4]} />
          <meshStandardMaterial color="#3a1e09" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[2.78, 0.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[HALL_LEN, 1.4]} />
          <meshStandardMaterial color="#3a1e09" roughness={0.3} metalness={0.4} />
        </mesh>
        
        {/* Thick Gold Trim separating upper/lower walls */}
        <mesh position={[-2.77, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[HALL_LEN, 0.08]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[2.77, 1.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[HALL_LEN, 0.08]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Ceiling Lamps */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
        <group key={`lamp-${i}`} position={[0, 5.0, 8 - i * 6]}>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.015, 0.015, 1.1, 6]} /><meshStandardMaterial color="#444" /></mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.35, 0.35, 16, 1, true]} />
            <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.15, 0]}><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#fffae0" /></mesh>
          <pointLight distance={15} intensity={2.5} color="#fff5e0" decay={1.5} />
        </group>
      ))}

      {/* Fixed Frames */}
      {frames.map(f => (
        <GalleryFrame key={f.id} data={f} images={safeImages} />
      ))}

      {/* Far glowing door - Brighter so it acts as a focal point */}
      <group position={[0, 2.8, HALL_END + 1]}>
        <mesh position={[0, 0, 0]}><boxGeometry args={[4.6, 6.2, 0.22]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
        <mesh position={[0, 0.8, 0.12]}><planeGeometry args={[3.2, 3.0]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0.8, 0.15]}><planeGeometry args={[3.4, 3.2]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} /></mesh>
        <pointLight position={[0, 0, 4]} intensity={15} distance={40} color="#ffffff" decay={1.0} />
      </group>
    </group>
  );
}

function GalleryFrame({ data, images }: { data: FrameData; images: string[] }) {
  const [renderTick, setRenderTick] = useState(0);
  
  // Classic 4:3 Aspect Ratio for proper image shape - slightly larger for better viewing
  const fw = 1.8, fh = 1.35;
  const pw = fw - 0.2, ph = fh - 0.16;
  
  // Perfectly flat against the wall again. It looks much cleaner and professional this way.
  const rotY = data.isLeft ? Math.PI / 2 : -Math.PI / 2;
  
  const currentUrl = images[data.idxOffset % images.length];
  const tex = getOrLoadTexture(currentUrl, data.idxOffset, () => setRenderTick(t => t + 1));

  return (
    <group position={[data.x, data.y, data.z]} rotation={[0, rotY, 0]}>
      {/* Thick Gold Frame border */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[fw, fh, 0.08]} />
        <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* The Photograph - Perfectly pushed in front of the gold frame */}
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[pw, ph]} />
        <meshBasicMaterial map={tex} color="#ffffff" />
      </mesh>

      {/* Elegant Brass Picture Light (Sconce) mounted above the frame */}
      <group position={[0, fh / 2 + 0.15, 0]}>
        {/* Base plate on wall */}
        <mesh position={[0, 0, -0.04]}><boxGeometry args={[0.15, 0.2, 0.05]} /><meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} /></mesh>
        {/* Arm extending out */}
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.2]} /><meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} /></mesh>
        {/* Light hood */}
        <mesh position={[0, 0, 0.18]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.04, 0.04, 0.6]} /><meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} /></mesh>
        {/* The actual light shining DOWN onto the canvas for mood */}
        <pointLight position={[0, -0.1, 0.1]} distance={3} intensity={3.0} color="#fff0d0" decay={1.5} />
      </group>
    </group>
  );
}

export default function FamilyFunctionHallwayGallery({ images = [] }: any) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const prev = scrollState.targetProgress;
      scrollState.targetProgress = Math.max(0, Math.min(1, prev + e.deltaY * 0.001));
      
      if (scrollState.targetProgress > 0 && scrollState.targetProgress < 1) {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      scrollState.progress = 0;
      scrollState.targetProgress = 0;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#0a0f18' }}
    >
      <Canvas

        camera={{ position: [0, 1.8, 0], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#c8a870']} />
        <React.Suspense fallback={null}>
          <FiniteHallwayScene images={images} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
