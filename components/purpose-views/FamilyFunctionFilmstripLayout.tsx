"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import InlineEditableText from "@/components/InlineEditableText";
import { motion, AnimatePresence } from "framer-motion";

const PLACEHOLDERS = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511556532299-8f662fc26c06",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300",
];

// Helper to create a true 3D ribbon geometry that correctly bends along a spline
function createRibbonGeometry(curve: THREE.Curve<THREE.Vector3>, segments = 200, width = 2.5) {
  const points = curve.getSpacedPoints(segments);
  const frenetFrames = curve.computeFrenetFrames(segments, false);
  
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  
  for (let i = 0; i <= segments; i++) {
      const point = points[i];
      // Binormal is perpendicular to the curve's direction, giving us the width of the film
      const binormal = frenetFrames.binormals[i];
      
      const p1 = new THREE.Vector3().copy(point).addScaledVector(binormal, -width/2);
      const p2 = new THREE.Vector3().copy(point).addScaledVector(binormal, width/2);
      
      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);
      
      // u maps along the curve length, v maps across the width
      const u = i / segments;
      uvs.push(u, 0);
      uvs.push(u, 1);
  }
  
  const indices = [];
  for (let i = 0; i < segments; i++) {
      const v1 = i * 2;
      const v2 = i * 2 + 1;
      const v3 = (i + 1) * 2;
      const v4 = (i + 1) * 2 + 1;
      
      indices.push(v1, v2, v3);
      indices.push(v2, v4, v3);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  return geometry;
}

const WebGLFilmstripMesh = ({ images, onImageClick }: { images: any[], onImageClick: (idx: number) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  // Generate the 3D Helix Geometry (S-curve spiral)
  const geometry = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const angle = t * Math.PI * 5; // 2.5 turns
      // Make radius vary slightly for an organic non-perfect cylinder shape
      const radius = 3.5 + Math.sin(t * Math.PI * 2) * 0.5;
      const y = (t - 0.5) * 16; // Height from -8 to 8
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    return createRibbonGeometry(curve, 300, 2.2); 
  }, []);

  // Generate the Canvas Texture dynamically from images
  useEffect(() => {
    const TOTAL = Math.max(12, images.length);
    const W = 400;
    const H = 300;
    const canvas = document.createElement('canvas');
    canvas.width = W * TOTAL;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Base Film Material (Dark Gray/Black)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Perforations
    ctx.fillStyle = '#f4ece0';
    for (let i = 0; i < TOTAL * 12; i++) { 
      const x = (canvas.width / (TOTAL * 12)) * i + 8;
      ctx.fillRect(x, 15, 12, 18); // Top hole
      ctx.fillRect(x, H - 33, 12, 18); // Bottom hole
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    
    // We want the physical frame width to remain constant regardless of how many images are on the texture.
    // 12 images looked good repeating 2 times (24 physical frames on the curve).
    // So we calculate the repeat to maintain exactly 24 physical frames spanning the geometry length.
    tex.repeat.set(24 / TOTAL, 1); 
    tex.colorSpace = THREE.SRGBColorSpace;
    setTexture(tex);

    // Load and paint photos
    images.forEach((imgObj, idx) => {
      const url = imgObj?.displayUrl || imgObj?.url || imgObj;
      if (!url) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        // Draw photo
        ctx.drawImage(img, idx * W + 20, 50, W - 40, H - 100);
        tex.needsUpdate = true;
      };
    });
  }, [images]);

  // Organic swaying and continuous texture animation
  useFrame((state, delta) => {
    if (texture) {
      // Film traveling forward along the spline
      texture.offset.x -= delta * 0.04;
    }
    if (meshRef.current) {
      // Gentle floating and sagging in the air
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.4;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (e.uv && texture) {
      const TOTAL = Math.max(12, images.length);
      const u = e.uv.x; 
      // Calculate exactly which image was clicked based on the dynamic offset
      const totalTexU = u * texture.repeat.x - texture.offset.x;
      const localU = ((totalTexU % 1) + 1) % 1; 
      const clickedIndex = Math.floor(localU * TOTAL);
      // Ensure we don't return an index out of bounds if there are fewer images uploaded than the TOTAL canvas slots
      if (clickedIndex < images.length) {
        onImageClick(clickedIndex);
      }
    }
  };

  if (!texture) return null;

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
      // Shift it to the right side of the screen natively in 3D space
      position={[4, 0, 0]}
      rotation={[0, -0.5, 0]}
    >
      <meshStandardMaterial 
        map={texture} 
        roughness={0.25} // Slightly glossy plastic film surface
        metalness={0.1} 
        side={THREE.DoubleSide} 
        transparent={true}
        alphaTest={0.05} 
      />
    </mesh>
  );
};

export default function FamilyFunctionFilmstripLayout({ 
  images = [], 
  title = "Our Story", 
  description = "A lifetime of beautiful moments unfolding together.",
  onTitleChange,
  onDescriptionChange,
}: any) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const TOTAL_IMAGES = Math.max(12, images.length);
  const safeCards = Array.from({ length: TOTAL_IMAGES }, (_, i) => {
    return images?.[i] || { id: `ph-${i}`, displayUrl: PLACEHOLDERS[i % PLACEHOLDERS.length] };
  });

  return (
    <div className="relative w-full h-full bg-[#0a0502] overflow-hidden">
      
      {/* 2D BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.img 
          src="/filmstrip-table-bg.jpg" 
          alt="Vintage Table" 
          className="w-full h-full object-cover"
          animate={{ scale: [1.0, 1.05, 1.0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[#0a0502]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_transparent_0%,_#0a0502_80%)]" />
      </div>

      {/* 3D WEBGL LAYER */}
      <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffddaa" />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#aaaaff" />
            
            {/* Soft lighting environment for realistic reflections on the film */}
            <Environment preset="city" />
            
            <WebGLFilmstripMesh images={safeCards} onImageClick={setActiveIdx} />
            
            {/* Contact shadows on the invisible "table" below */}
            <ContactShadows position={[4, -8, 0]} opacity={0.5} scale={20} blur={2.5} far={10} />
          </Suspense>
        </Canvas>
      </div>

      {/* TEXT CONTENT (LEFT ALIGNED OVERLAY) */}
      <div className="absolute top-1/2 left-[5%] md:left-[8%] -translate-y-1/2 z-20 w-full max-w-lg pointer-events-auto">
        <div className="relative">
          <div className="mb-3">
            <span className="text-[#d9cbb8] tracking-[0.4em] text-xs font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Family Function
            </span>
          </div>
          <InlineEditableText
            value={title}
            onChange={onTitleChange ?? (() => {})}
            className="text-5xl md:text-7xl font-serif font-black text-[#fcfbf9] leading-[1.1] drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] mb-6"
          />
          <InlineEditableText
            value={description}
            onChange={onDescriptionChange ?? (() => {})}
            className="text-base md:text-xl text-[#f4ece0]/90 leading-relaxed drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] font-medium max-w-sm"
          />
        </div>
      </div>

      {/* Full-Screen Modal for Active Image */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0502]/95 backdrop-blur-md cursor-zoom-out" 
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, rotateZ: -2 }}
              animate={{ scale: 1, y: 0, rotateZ: 0 }}
              exit={{ scale: 0.8, y: 50, rotateZ: 2 }}
              className="bg-[#111] p-6 pb-20 shadow-[0_30px_60px_rgba(0,0,0,1)] border border-[#333] max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={safeCards[activeIdx].displayUrl || safeCards[activeIdx].url || safeCards[activeIdx]} 
                alt="Enlarged Memory"
                className="w-full h-auto max-h-[75vh] object-contain bg-[#000]" 
              />
            </motion.div>
            <div className="absolute top-8 text-white/50 tracking-widest text-xs uppercase font-semibold">
              Click anywhere to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
