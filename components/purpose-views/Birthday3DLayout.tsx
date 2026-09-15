"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import InlineEditableText from "@/components/InlineEditableText";
import { Menu, Mouse, RefreshCw } from "lucide-react";
import BirthdayFerrisWheelLayout from "./BirthdayFerrisWheelLayout";
import BirthdayWishingTreeLayout from "./BirthdayWishingTreeLayout";

/* ─────────────────── PLACEHOLDERS ─────────────────── */
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1530103862676-de88b4db8ba4?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1558636508-e0969431e4d2?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1682687219973-3145b2855a0e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=800",
];

const DEFAULT_CAPTIONS_S1 = [
  "Some Madness ♡","Good Friends ♡","Next Stop More Life ♡","Unforgettable ♡","Cheers ♡",
];
const DEFAULT_CAPTIONS_S2 = [
  "Good Times ♡","Brighter Days ♡","Many More ♡","Sweet Memories ♡",
  "Best People ♡","Always Us ♡","Another Year ♡","Forever Young ♡",
];

/* ═══════════════════════════════════════════════════
   SECTION 1 — GLOWING LANTERN CUBES
════════════════════════════════════════════════════ */

const CUBE_SIZE = 220;
const H = CUBE_SIZE / 2;

function GlowingLanternCube({
  imgs, caption, speed = 14, initialRotation = 0, onCaptionChange,
}: { imgs: string[]; caption: string; speed?: number; initialRotation?: number; onCaptionChange?: (v: string) => void }) {
  const PolaroidFace = ({ src, transform, opacity = 1 }: { src: string; transform: string; opacity?: number }) => (
    <div style={{
      position: "absolute", inset: 0, transform,
      border: "2px solid rgba(255,210,100,0.6)", boxSizing: "border-box",
      overflow: "hidden", opacity, background: "#0a0500",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="memory" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 80%, rgba(255,140,0,0.18) 0%, transparent 65%)",
        pointerEvents: "none", mixBlendMode: "overlay",
      }} />
    </div>
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      filter: "drop-shadow(0 0 18px rgba(255,150,0,0.85)) drop-shadow(0 0 45px rgba(255,90,0,0.5)) drop-shadow(0 0 80px rgba(255,60,0,0.3))",
    }}>
      <div style={{ width: CUBE_SIZE, height: CUBE_SIZE, perspective: 900 }}>
        <motion.div
          style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
          animate={{ rotateY: [initialRotation, initialRotation + 360], rotateX: [4, 9, 4, 0, 4] }}
          transition={{
            rotateY: { duration: speed, repeat: Infinity, ease: "linear" },
            rotateX: { duration: speed * 1.4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <motion.div
            style={{
              position: "absolute", top: "50%", left: "50%", width: 88, height: 88,
              transform: "translateX(-50%) translateY(-50%) translateZ(0px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,220,1) 0%, rgba(255,190,0,0.95) 28%, rgba(255,100,0,0.8) 55%, transparent 78%)",
              pointerEvents: "none",
            }}
            animate={{ scale: [1, 1.12, 0.93, 1.08, 1], opacity: [0.88, 1, 0.82, 1, 0.88] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <PolaroidFace src={imgs[0]} transform={`translateZ(${H}px)`} opacity={1} />
          <PolaroidFace src={imgs[1]} transform={`rotateY(180deg) translateZ(${H}px)`} opacity={0.97} />
          <PolaroidFace src={imgs[2]} transform={`rotateY(90deg) translateZ(${H}px)`} opacity={0.95} />
          <PolaroidFace src={imgs[3]} transform={`rotateY(-90deg) translateZ(${H}px)`} opacity={0.95} />
          <PolaroidFace src={imgs[4]} transform={`rotateX(90deg) translateZ(${H}px)`} opacity={0.92} />
          <PolaroidFace src={imgs[5]} transform={`rotateX(-90deg) translateZ(${H}px)`} opacity={0.92} />
        </motion.div>
      </div>
      <svg width={CUBE_SIZE * 0.6} height={44} style={{ display: "block", marginTop: 0 }} overflow="visible">
        <line x1="20%" y1="0" x2="50%" y2="100%" stroke="rgba(255,200,80,0.7)" strokeWidth="1.4" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,200,80,0.7)" strokeWidth="1.4" />
        <line x1="80%" y1="0" x2="50%" y2="100%" stroke="rgba(255,200,80,0.7)" strokeWidth="1.4" />
      </svg>
      <div className="font-handwriting text-center text-[#fef3c7]" style={{
        background: "rgba(20,10,0,0.82)", border: "1.5px solid rgba(255,200,80,0.55)",
        borderRadius: 5, padding: "6px 16px 7px", fontSize: 14, letterSpacing: "0.02em",
        boxShadow: "0 0 12px rgba(255,150,0,0.5), 0 4px 12px rgba(0,0,0,0.6)",
        maxWidth: CUBE_SIZE * 0.95, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      }}>
        {onCaptionChange ? <InlineEditableText value={caption} onChange={onCaptionChange} /> : caption}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 2 — 3D GIFT BOX UNWRAP
════════════════════════════════════════════════════ */

function GiftBoxSection({
  images, title, description, content, onTitleChange, onDescriptionChange, onContentChange,
}: any) {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const sceneRef    = useRef<HTMLDivElement>(null);
  const dragRef     = useRef({ isDragging: false, startX: 0, startY: 0, rotX: -22, rotY: 28 });
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const lidPivotRef = useRef<HTMLDivElement>(null);
  const bowRef      = useRef<HTMLDivElement>(null);
  const photosRef   = useRef<HTMLDivElement>(null);
  const sprinklersRef = useRef<HTMLDivElement>(null);
  const tissueRef   = useRef<HTMLDivElement>(null);
  const innerGlowRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const targetRef   = useRef(0);
  const rafRef      = useRef<number>(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const sprinklerTraj = React.useMemo(() => {
    return Array.from({ length: 70 }).map(() => {
      // Burst mostly forward and to the sides (0 to PI) to avoid clipping the back lid
      const angle = -0.1 * Math.PI + Math.random() * 1.2 * Math.PI;
      const radius = 100 + Math.random() * 350;
      return {
        tx: Math.cos(angle) * radius,
        tz: Math.sin(angle) * radius,
        jump: 200 + Math.random() * 300,
        rotX: Math.random() * 720,
        rotY: Math.random() * 720,
        rotZ: Math.random() * 720,
        color: ['#ffd700', '#ff6b9d', '#c084fc', '#60a5fa', '#34d399', '#ffffff'][Math.floor(Math.random() * 6)]
      };
    });
  }, []);

  const photoTrajectories = React.useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      // Spread cubes evenly in the front 180 degrees (0 to PI) so they don't clip the lid in the back
      const angle = -0.1 * Math.PI + (i / 24) * 1.2 * Math.PI + (Math.random() * 0.2 - 0.1);
      // Keep cubes within a reasonable radius so they stay on-screen
      const radius = 200 + Math.random() * 250;
      return {
        tx: Math.cos(angle) * radius,
        tz: Math.sin(angle) * radius,
        jump: 300 + Math.random() * 350,
        rotX: Math.random() * 720,
        rotY: Math.random() * 720,
        rotZ: Math.random() * 720,
        delay: Math.random() * 0.2,
      };
    });
  }, []);

  /* Box dimensions */
  const W = 340;   // width
  const H = 290;   // body height
  const D = 270;   // depth
  const LH = 72;   // lid skirt height

  const LW = W + 6;
  const LD = D + 6;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Only trap scroll on the right half of the screen
      if (e.clientX < window.innerWidth / 2) return;
      e.preventDefault();
      targetRef.current = Math.min(1, Math.max(0, targetRef.current + e.deltaY * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Dynamic Spotlight Tracking
      if (sectionRef.current) {
        const mx = (e.clientX / window.innerWidth) * 100;
        const my = (e.clientY / window.innerHeight) * 100;
        sectionRef.current.style.setProperty("--mx", `${mx}%`);
        sectionRef.current.style.setProperty("--my", `${my}%`);
      }

      if (!dragRef.current.isDragging || !sceneRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      dragRef.current.rotY += dx * 0.4;
      dragRef.current.rotX -= dy * 0.4;
      
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      
      dragRef.current.rotX = Math.max(-60, Math.min(20, dragRef.current.rotX));
      
      sceneRef.current.style.transform = `rotateX(${dragRef.current.rotX}deg) rotateY(${dragRef.current.rotY}deg)`;
    };

    const handlePointerUp = () => {
      dragRef.current.isDragging = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
  };

  useEffect(() => {
    const animate = () => {
      progressRef.current += (targetRef.current - progressRef.current) * 0.07;
      const p = progressRef.current;

      /* Lid opens by rotating around the back-top hinge */
      if (lidPivotRef.current) {
        // Lid hinges backward with positive X rotation
        const lidAngle = p * 130;
        // Shift hinge slightly back so lid overhangs back edge by 3px
        lidPivotRef.current.style.transform =
          `translateY(${-H / 2}px) translateZ(${-D / 2 - 3}px) rotateX(${lidAngle}deg)`;
      }

      /* Tissue paper rises as lid opens */
      if (tissueRef.current) {
        const rise = p * 60;
        tissueRef.current.style.transform = `translateY(${-rise}px)`;
        tissueRef.current.style.opacity = String(Math.min(1, p * 3));
      }

      /* Knot pops open in true 3D right before lid swings back */
      if (bowRef.current) {
        const parts = bowRef.current.children;
        const pop = Math.min(1, p * 4.5); // 0 to 1 quickly
        
        // Center knot shrinks and fades
        if (parts[0]) {
          (parts[0] as HTMLElement).style.transform = `translate(-50%, -50%) scale(${1 - pop * 0.5})`;
          (parts[0] as HTMLElement).style.opacity = String(1 - pop * 1.5);
        }
        
        // 4 Loops fly outwards
        for (let i = 1; i <= 4; i++) {
          const loop = parts[i] as HTMLElement;
          if (!loop) continue;
          const dx = (i - 1) % 2 === 0 ? -1 : 1;
          const dy = (i - 1) < 2 ? -1 : 1;
          loop.style.transform = `
            translate3d(${dx * pop * 150}px, ${dy * pop * 120}px, ${pop * 80}px)
            rotateY(${dx * -45 + dx * pop * 180}deg)
            rotateX(${dy * 40 + dy * pop * 180}deg)
            rotateZ(${dx * dy * -30}deg)
            scale(${1 - pop * 0.7})
          `;
          loop.style.opacity = String(1 - pop * 1.2);
        }

        // 2 Tails fly downwards and away
        for (let i = 5; i <= 6; i++) {
          const tail = parts[i] as HTMLElement;
          if (!tail) continue;
          const dx = i === 5 ? -1 : 1;
          tail.style.transform = `
            translate3d(${dx * pop * 100}px, ${pop * 180}px, ${pop * 100}px)
            rotateX(${55 + pop * 200}deg)
            rotateZ(${dx * 35 + dx * pop * 100}deg)
            scale(${1 - pop * 0.7})
          `;
          tail.style.opacity = String(1 - pop * 1.2);
        }
      }

      /* Inner glow intensifies */
      if (innerGlowRef.current) {
        innerGlowRef.current.style.opacity = String(0.05 + p * 0.65);
      }

      /* Party Popper Explosion (Photos) */
      if (photosRef.current) {
        const cards = photosRef.current.children;
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i] as HTMLElement;
          const traj = photoTrajectories[i];
          if (!traj) continue;
          
          // Wait until lid is mostly open (p > 0.5) before popping cubes
          let t = Math.max(0, (p - 0.5 - traj.delay * 0.5) * 2.5);
          t = Math.min(1, t);
          
          const easeOut = t * (2 - t);
          const x = traj.tx * easeOut;
          const z = traj.tz * easeOut;
          // Floor is roughly at Y = H (since photos start at top of box Y = -H/2, floor is at H/2 relative to box center, so distance is H)
          const y = H * easeOut - traj.jump * Math.sin(t * Math.PI);
          
          // Settle flat on the floor: facing up (-90deg X), random Z rotation
          const currentRotX = traj.rotX * (1 - t) - 90 * t;
          const currentRotY = traj.rotY * (1 - t) + 0 * t;
          const currentRotZ = traj.rotZ * (1 - t) + ((traj.rotZ % 60) - 30) * t;

          const sc = 0.1 + t * 0.9;
          card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg) rotateZ(${currentRotZ}deg) scale(${sc})`;
          // Make them visible as they pop
          card.style.opacity = String(Math.min(1, t * 5));
        }
      }

      /* Sprinklers / Confetti Burst */
      if (sprinklersRef.current) {
        const parts = sprinklersRef.current.children;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i] as HTMLElement;
          const traj = sprinklerTraj[i];
          if (!traj) continue;
          
          // Wait until lid is mostly open (p > 0.5) before popping confetti
          let t = Math.max(0, (p - 0.5) * 2.5); 
          t = Math.min(1, t);
          
          const easeOut = t * (2 - t);
          const x = traj.tx * easeOut;
          const z = traj.tz * easeOut;
          const y = H * easeOut - traj.jump * Math.sin(t * Math.PI);
          
          const rotX = traj.rotX * t;
          const rotY = traj.rotY * t;
          const rotZ = traj.rotZ * t;
          
          part.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
          part.style.opacity = String(t < 0.1 ? t * 10 : (1 - t) * 1.5);
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const rawImages = images.length > 0
    ? images
    : PLACEHOLDERS.map((src, i) => ({ id: `p-${i}`, displayUrl: src }));
    
  // Ensure we have exactly 24 images for the cubes
  let extendedImages = [...rawImages];
  while (extendedImages.length < 24) {
    extendedImages = extendedImages.concat(rawImages);
  }
  const cards = extendedImages.slice(0, 24);

  /* ── Shared face styles with directional lighting ── */
  // Front face: warm honey (lit by window)
  const styleFront: React.CSSProperties = {
    position: "absolute", width: W, height: H,
    marginLeft: -W / 2, marginTop: -H / 2,
    transform: `translateZ(${D / 2}px)`,
    background: "linear-gradient(160deg, #c8a97a 0%, #b08e60 40%, #8e6b3e 100%)",
    border: "1.5px solid rgba(80,30,0,0.2)",
    boxSizing: "border-box", overflow: "hidden",
  };
  // Back face
  const styleBack: React.CSSProperties = {
    position: "absolute", width: W, height: H,
    marginLeft: -W / 2, marginTop: -H / 2,
    transform: `rotateY(180deg) translateZ(${D / 2}px)`,
    background: "#6e4f2a",
    border: "1.5px solid rgba(80,30,0,0.2)",
    boxSizing: "border-box",
  };
  // Right face: shadow side
  const styleRight: React.CSSProperties = {
    position: "absolute", width: D, height: H,
    marginLeft: -D / 2, marginTop: -H / 2,
    transform: `rotateY(90deg) translateZ(${W / 2}px)`,
    background: "linear-gradient(180deg, #a07845 0%, #7a5728 100%)",
    border: "1.5px solid rgba(80,30,0,0.2)",
    boxSizing: "border-box", overflow: "hidden",
  };
  // Left face: deep shadow
  const styleLeft: React.CSSProperties = {
    position: "absolute", width: D, height: H,
    marginLeft: -D / 2, marginTop: -H / 2,
    transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
    background: "linear-gradient(180deg, #7a5728 0%, #54381a 100%)",
    border: "1.5px solid rgba(80,30,0,0.2)",
    boxSizing: "border-box", overflow: "hidden",
  };
  // Bottom face
  const styleBottom: React.CSSProperties = {
    position: "absolute", width: W, height: D,
    marginLeft: -W / 2, marginTop: -D / 2,
    transform: `rotateX(90deg) translateZ(${H / 2}px)`,
    background: "#3d2709",
    border: "1.5px solid rgba(80,30,0,0.2)",
    boxSizing: "border-box",
  };

  /* Red satin ribbon stripe helpers */
  const rH: React.CSSProperties = {
    position: "absolute", top: "50%", left: 0, right: 0,
    height: 24, marginTop: -12,
    background: "linear-gradient(to bottom, #990000 0%, #e60000 25%, #660000 50%, #e60000 75%, #990000 100%)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.6)",
  };
  const rV: React.CSSProperties = {
    position: "absolute", left: "50%", top: 0, bottom: 0,
    width: 24, marginLeft: -12,
    background: "linear-gradient(to right, #990000 0%, #e60000 25%, #660000 50%, #e60000 75%, #990000 100%)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.6)",
  };

  /* Gold star decoration */
  const star = (left: string, top: string, size: number): React.CSSProperties => ({
    position: "absolute", left, top,
    width: size, height: size,
    background: "rgba(255,215,0,0.65)",
    clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
  });

  return (
    <div
      ref={sectionRef}
      className="relative h-screen flex items-center overflow-hidden"
      style={{ background: "#1a0f08" }}
      onMouseMove={(e) => {
        const rect = sectionRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        });
      }}
    >
      {/* ── PARALLAX BACKGROUND LAYERS ── */}
      {/* Layer 1: Far background (slowest movement) */}
      <div style={{
        position: "absolute", inset: "-6%",
        backgroundImage: "url('/images/cozy_golden_hour_room.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -5}px) scale(1.12)`,
        transition: "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        filter: "brightness(0.7) blur(0.5px)",
        zIndex: 0,
      }} />
      {/* Layer 2: Mid-ground vignette & warm overlay (medium movement) */}
      <div style={{
        position: "absolute", inset: "-4%",
        background: "radial-gradient(ellipse 80% 70% at 65% 55%, transparent 30%, rgba(10,5,0,0.6) 100%)",
        transform: `translate(${mousePos.x * -4}px, ${mousePos.y * -2}px)`,
        transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        zIndex: 1,
      }} />
      {/* Layer 3: Warm golden light from window */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 50% 80% at 18% 30%, rgba(255,180,60,0.28) 0%, transparent 65%)",
        transform: `translate(${mousePos.x * 6}px, ${mousePos.y * 4}px)`,
        transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        zIndex: 2,
      }} />
      {/* Layer 4: FAIRY STRING LIGHTS — upper left corner */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        {/* String line 1 */}
        <div style={{ position: "absolute", top: "8%", left: "28%", right: "45%", height: 1, background: "rgba(255,220,100,0.25)" }} />
        {/* String line 2 */}
        <div style={{ position: "absolute", top: "15%", left: "30%", right: "50%", height: 1, background: "rgba(255,220,100,0.18)" }} />
        {/* Fairy lights bulbs */}
        {[
          { l: "28%",  t: "7.5%",  c: "rgba(255,220,80,0.9)",  r: 4 },
          { l: "32%",  t: "8.2%",  c: "rgba(255,180,100,0.8)", r: 3.5 },
          { l: "36%",  t: "7.8%",  c: "rgba(255,240,120,0.85)",r: 4 },
          { l: "40%",  t: "8.4%",  c: "rgba(255,200,80,0.75)", r: 3 },
          { l: "44%",  t: "7.6%",  c: "rgba(255,220,100,0.9)", r: 4 },
          { l: "48%",  t: "8.0%",  c: "rgba(255,160,80,0.8)",  r: 3.5 },
          { l: "30%",  t: "14.5%", c: "rgba(255,200,80,0.7)",  r: 3.5 },
          { l: "34%",  t: "15.2%", c: "rgba(255,240,120,0.8)", r: 4 },
          { l: "38%",  t: "14.8%", c: "rgba(255,180,100,0.75)",r: 3 },
          { l: "42%",  t: "15.4%", c: "rgba(255,220,80,0.85)", r: 3.5 },
        ].map((b, i) => (
          <motion.div key={`bulb-${i}`} style={{
            position: "absolute", left: b.l, top: b.t,
            width: b.r * 2, height: b.r * 2,
            borderRadius: "50%",
            background: b.c,
            boxShadow: `0 0 ${b.r * 4}px ${b.r * 3}px ${b.c}`,
          }}
            animate={{ opacity: [0.5, 1, 0.6, 1, 0.5] }}
            transition={{ duration: 2 + (i % 3) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
          />
        ))}
        {/* Bokeh circles in upper left */}
        {[
          { l: "25%", t: "5%",  s: 40, o: 0.12 },
          { l: "33%", t: "3%",  s: 60, o: 0.08 },
          { l: "20%", t: "12%", s: 35, o: 0.1 },
          { l: "37%", t: "18%", s: 50, o: 0.07 },
          { l: "28%", t: "22%", s: 30, o: 0.09 },
        ].map((bk, i) => (
          <div key={`bk-${i}`} style={{
            position: "absolute", left: bk.l, top: bk.t,
            width: bk.s, height: bk.s,
            borderRadius: "50%",
            border: `1.5px solid rgba(255,220,100,${bk.o * 2})`,
            background: `radial-gradient(circle, rgba(255,220,100,${bk.o}) 0%, transparent 70%)`,
            filter: "blur(4px)",
          }} />
        ))}
      </div>
      {/* Floating Dust Motes (sunlight sparkles) */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div key={`s-${i}`} className="absolute pointer-events-none"
          style={{
            width: 2 + (i%2)*2, height: 2 + (i%2)*2,
            left: `${10 + (i * 29) % 80}%`, top: `${15 + (i * 11) % 70}%`,
            background: "rgba(255,230,180,0.8)",
            boxShadow: "0 0 10px 2px rgba(255,230,180,0.4)",
            borderRadius: "50%",
            filter: `blur(${i%3}px)`,
          }}
          animate={{ y: [0, -30, 0], x: [0, Math.random()*20 - 10, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        />
      ))}

      {/* ══════════════ FULL-WIDTH PHOTO GARLAND ══════════════ */}
      {/* SVG catenary wave wire with fairy lights + hanging polaroids */}
      <div style={{
        position: "absolute", inset: 0,
        zIndex: 20, pointerEvents: "none",
        overflow: "hidden",
      }}>
        {/* SVG Wave Wire */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "42%" }}
          viewBox="0 0 1000 180"
          preserveAspectRatio="none"
        >
          {/* Drop shadow filter */}
          <defs>
            <filter id="wireShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.5)" />
            </filter>
            <filter id="bulbGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Main catenary wave wire — sags naturally */}
          <path
            d="M 0,60 C 80,68 160,82 250,75 C 340,68 420,50 500,58 C 580,66 660,80 750,72 C 840,64 920,52 1000,60"
            fill="none"
            stroke="url(#wireGrad)"
            strokeWidth="1.8"
            filter="url(#wireShadow)"
          />
          <defs>
            <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(180,140,60,0.4)" />
              <stop offset="15%" stopColor="rgba(220,175,80,0.85)" />
              <stop offset="50%" stopColor="rgba(200,160,70,0.9)" />
              <stop offset="85%" stopColor="rgba(220,175,80,0.85)" />
              <stop offset="100%" stopColor="rgba(180,140,60,0.4)" />
            </linearGradient>
            {/* Metallic cap gradient */}
            <linearGradient id="capG" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#5a3e08" />
              <stop offset="40%"  stopColor="#C49A22" />
              <stop offset="70%"  stopColor="#8B6914" />
              <stop offset="100%" stopColor="#4a3006" />
            </linearGradient>
            {/* Bulb glass gradients per color */}
            <radialGradient id="bg0" cx="35%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#FFFBE0" stopOpacity="1" />
              <stop offset="45%"  stopColor="#FFD840" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#CC7700" stopOpacity="0.85" />
            </radialGradient>
            <radialGradient id="bg1" cx="35%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#FFE8C0" stopOpacity="1" />
              <stop offset="45%"  stopColor="#FFB347" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#CC5500" stopOpacity="0.8" />
            </radialGradient>
            <radialGradient id="bg2" cx="35%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#FFFFF0" stopOpacity="1" />
              <stop offset="45%"  stopColor="#FFEC6E" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#CCB800" stopOpacity="0.8" />
            </radialGradient>
            <radialGradient id="bg3" cx="35%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#FFF0C0" stopOpacity="1" />
              <stop offset="45%"  stopColor="#FFC04A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#CC8000" stopOpacity="0.8" />
            </radialGradient>
            {/* Outer glow filter */}
            <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* ── REALISTIC FAIRY LIGHT BULBS ── */}
          {[
            { cx: 80,  cy: 65.5, grad: "bg0", dur: "2.1s", begin: "0s"    },
            { cx: 160, cy: 72,   grad: "bg1", dur: "1.8s", begin: "0.3s"  },
            { cx: 240, cy: 75.5, grad: "bg2", dur: "2.4s", begin: "0.6s"  },
            { cx: 330, cy: 72,   grad: "bg0", dur: "1.6s", begin: "0.9s"  },
            { cx: 415, cy: 63,   grad: "bg3", dur: "2.2s", begin: "0.2s"  },
            { cx: 500, cy: 58,   grad: "bg2", dur: "1.9s", begin: "0.7s"  },
            { cx: 585, cy: 62,   grad: "bg0", dur: "2.5s", begin: "0.4s"  },
            { cx: 670, cy: 73,   grad: "bg1", dur: "1.7s", begin: "1.1s"  },
            { cx: 755, cy: 73,   grad: "bg3", dur: "2.0s", begin: "0.15s" },
            { cx: 840, cy: 66,   grad: "bg0", dur: "2.3s", begin: "0.8s"  },
            { cx: 920, cy: 57,   grad: "bg2", dur: "1.85s",begin: "0.5s"  },
          ].map((b, i) => (
            <g key={`bulb-${i}`}>
              {/* Soft light cone projected downward */}
              <path
                d={`M ${b.cx - 3},${b.cy + 20} L ${b.cx - 14},${b.cy + 55} L ${b.cx + 14},${b.cy + 55} L ${b.cx + 3},${b.cy + 20} Z`}
                fill={`url(#${b.grad})`} opacity={0.09}
              />
              {/* Thread drop from wire to cap */}
              <line x1={b.cx} y1={b.cy} x2={b.cx} y2={b.cy + 5} stroke="rgba(180,140,50,0.7)" strokeWidth="1"/>
              {/* Metallic screw cap */}
              <rect x={b.cx - 3.5} y={b.cy + 4} width={7} height={5} rx={1} fill="url(#capG)"/>
              {/* Screw lines on cap */}
              <line x1={b.cx-3} y1={b.cy+5.8} x2={b.cx+3} y2={b.cy+5.8} stroke="rgba(0,0,0,0.4)" strokeWidth="0.6"/>
              <line x1={b.cx-3} y1={b.cy+7.4} x2={b.cx+3} y2={b.cy+7.4} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5"/>
              {/* Bulb glass — pear / teardrop shape with gradient glow */}
              <path
                d={`M ${b.cx},${b.cy+9} C ${b.cx-6},${b.cy+9} ${b.cx-9},${b.cy+13} ${b.cx-9},${b.cy+18} C ${b.cx-9},${b.cy+24} ${b.cx-5},${b.cy+28} ${b.cx},${b.cy+28} C ${b.cx+5},${b.cy+28} ${b.cx+9},${b.cy+24} ${b.cx+9},${b.cy+18} C ${b.cx+9},${b.cy+13} ${b.cx+6},${b.cy+9} ${b.cx},${b.cy+9} Z`}
                fill={`url(#${b.grad})`}
                filter="url(#glow)"
              >
                <animate attributeName="opacity" values="0.9;1;0.65;1;0.85;0.55;1;0.9" dur={b.dur} begin={b.begin} repeatCount="indefinite"/>
              </path>
              {/* Specular glass highlight */}
              <ellipse cx={b.cx - 2.5} cy={b.cy + 14} rx={2} ry={3.5} fill="rgba(255,255,255,0.55)" opacity={0.8}/>
              {/* Bright centre dot */}
              <circle cx={b.cx - 1} cy={b.cy + 13} r={0.8} fill="rgba(255,255,255,0.9)"/>
            </g>
          ))}
        </svg>

        {/* Hanging thread + polaroid at each photo point on the wave */}
        {[
          { leftPct: 8,   wireTop: 17.2, imgIdx: 0, sway: 3,    delay: 0,   tilt: -4 },
          { leftPct: 24,  wireTop: 18.5, imgIdx: 1, sway: -2.5, delay: 0.4, tilt: 4  },
          { leftPct: 40,  wireTop: 17.8, imgIdx: 2, sway: 2,    delay: 0.7, tilt: -5 },
          { leftPct: 56,  wireTop: 17.2, imgIdx: 3, sway: -3,   delay: 0.2, tilt: 3  },
          { leftPct: 71,  wireTop: 18.2, imgIdx: 4, sway: 2.5,  delay: 0.9, tilt: -3 },
          { leftPct: 86,  wireTop: 17.0, imgIdx: 5, sway: -2,   delay: 0.5, tilt: 5  },
        ].map((photo, i) => (
          <div key={`hang-${i}`} style={{
            position: "absolute",
            left: `${photo.leftPct}%`,
            top: `${photo.wireTop}%`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
          }}>
            {/* Thread drop */}
            <div style={{
              width: "1.5px", height: "20px",
              background: "linear-gradient(180deg, rgba(180,140,60,0.75) 0%, rgba(140,100,30,0.4) 100%)",
            }} />
            {/* Wooden clip */}
            <div style={{
              width: "11px", height: "6px",
              background: "linear-gradient(135deg, #7a5514 0%, #C49A22 60%, #8B6914 100%)",
              borderRadius: "2px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.6)",
              marginBottom: "-2px",
            }} />
            {/* Swaying polaroid */}
            <motion.div
              style={{ transformOrigin: "top center" }}
              animate={{ rotate: [photo.tilt - photo.sway, photo.tilt + photo.sway, photo.tilt - photo.sway] }}
              transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: photo.delay }}
            >
              <div style={{
                width: 74, height: 88,
                background: "#f9f5ed",
                padding: "5px 5px 20px",
                boxSizing: "border-box" as const,
                boxShadow: "0 8px 24px rgba(0,0,0,0.6), 0 2px 5px rgba(0,0,0,0.4)",
                overflow: "hidden",
              }}>
                {cards[photo.imgIdx] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cards[photo.imgIdx].displayUrl}
                    alt="memory"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      {/* LEFT: text panel */}
      <div className="relative z-20 flex flex-col justify-center h-full pl-8 sm:pl-10 md:pl-14 pr-4"
        style={{ width: "clamp(200px, 36%, 420px)", flexShrink: 0 }}>
        <div className="my-auto">
          <p className="font-sans uppercase tracking-[0.35em] text-[#ffd89b]/80 text-[9px] mb-4 font-bold">
            Unwrap the memories
          </p>
          <h2 className="font-serif font-extrabold tracking-tight leading-[0.88] text-[#fdfaf4] whitespace-pre-wrap mb-5"
            style={{ fontSize: "clamp(2rem, 4.8vw, 5.5rem)", textShadow: "0 5px 25px rgba(0,0,0,0.95)" }}>
            <InlineEditableText value={title} onChange={onTitleChange} />
          </h2>
          <p className="font-sans uppercase tracking-[0.28em] text-[#e3d2ba]/80 whitespace-pre-wrap font-semibold"
            style={{ fontSize: "clamp(0.5rem, 0.85vw, 0.75rem)", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            <InlineEditableText value={description} onChange={onDescriptionChange} />
          </p>
          <div className="flex items-center gap-2 mt-10 text-[#e3d2ba]/60 font-bold">
            <Mouse size={13} />
            <span className="text-[8px] tracking-[0.28em] uppercase">Scroll to unwrap</span>
          </div>
        </div>
        <div className="absolute bottom-8 left-8 sm:left-10 md:left-14 text-[#fdfaf4]/30 font-serif uppercase tracking-[0.2em] text-[0.48rem] leading-loose font-bold">
          Gifted<br />With<br />Love ♡
        </div>
      </div>

      {/* RIGHT: TRUE CSS 3D Gift Box — sits on the table */}
      <div className="relative z-20 flex-1 flex items-end justify-center h-full cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ perspective: 1000, perspectiveOrigin: "50% 58%", paddingBottom: "18%" }}
        onPointerDown={handlePointerDown}
      >
        {/* ── CANDLE WARM GLOW — bottom left ambience ── */}
        <div style={{
          position: "absolute", bottom: 0, left: "2%",
          width: 220, height: 220,
          background: "radial-gradient(ellipse, rgba(255,160,40,0.35) 0%, rgba(255,100,0,0.12) 40%, transparent 70%)",
          filter: "blur(24px)",
          pointerEvents: "none", zIndex: 3,
        }} />

        {/* ── FLOATING CURSIVE SIDE NOTES (like reference image) ── */}
        {[
          { text: "Same You\nBrighter Days ♡", top: "6%",  right: "3%",  rotate: "6deg",  opacity: 0.75, size: "16px" },
          { text: "Collect\nMoments\nNot Things",  top: "32%", right: "2%",  rotate: "-4deg", opacity: 0.65, size: "14px" },
          { text: "Gifted with\nLove ♡",           top: "58%", right: "4%",  rotate: "3deg",  opacity: 0.6,  size: "13px" },
          { text: "Every Photo\na Gift",            top: "18%", right: "24%", rotate: "-5deg", opacity: 0.5,  size: "12px" },
          { text: "Forever Young ♡",               top: "78%", right: "3%",  rotate: "-3deg", opacity: 0.45, size: "12px" },
        ].map((note, i) => (
          <motion.div key={`note-${i}`}
            style={{
              position: "absolute", top: note.top, right: note.right,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: note.size,
              color: "#fdf6e3",
              opacity: note.opacity,
              transform: `rotate(${note.rotate})`,
              lineHeight: 1.5,
              whiteSpace: "pre-line",
              pointerEvents: "none",
              textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 20px rgba(255,200,100,0.3)",
              zIndex: 15,
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
          >
            {note.text}
          </motion.div>
        ))}


        {/* Ground shadow — anchors the box to the table surface */}
        <div style={{
          position: "absolute",
          bottom: "17%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 40,
          background: "radial-gradient(ellipse, rgba(10,5,0,0.7) 0%, transparent 70%)",
          filter: "blur(18px)",
          pointerEvents: "none",
          zIndex: 5,
        }} />

        {/* Scene — viewing angle: slightly from above-right for maximum 3D depth */}
        <div 
          ref={sceneRef}
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(-22deg) rotateY(28deg)",
            position: "relative", width: 0, height: 0,
          }}
        >

          {/* ══════════════ BOX BODY (5 faces — top is open) ══════════════ */}

          {/* FRONT face */}
          <div style={styleFront}>
            <div style={rH} /><div style={rV} />
            {/* Elegant Script Text */}
            <div style={{
              position: "absolute", bottom: "15%", right: "15%",
              transform: "rotate(-5deg)",
              fontFamily: "cursive",
              fontSize: "18px",
              color: "#2a1200",
              textAlign: "right",
              lineHeight: "1.3",
              pointerEvents: "none",
              opacity: 0.75,
            }}>
              Good People<br/>Beautiful<br/>Memories ♡
            </div>
            {/* Warm window light hitting face */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(140deg, rgba(255,180,60,0.18) 0%, transparent 60%)", pointerEvents:"none" }} />
            {/* Velvet sheen overlay */}
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 55%,rgba(0,0,0,0.12) 100%)", pointerEvents:"none" }} />
            {/* Dynamic Spotlight */}
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.3) 0%, transparent 60%)", pointerEvents:"none", mixBlendMode:"screen" }} />
          </div>

          {/* BACK face */}
          <div style={styleBack}>
          </div>

          {/* RIGHT face */}
          <div style={styleRight}>
            <div style={rH} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(0,0,0,0.25) 0%,transparent 50%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.2) 0%, transparent 60%)", pointerEvents:"none", mixBlendMode:"screen" }} />
          </div>

          {/* LEFT face */}
          <div style={styleLeft}>
            <div style={rH} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(0,0,0,0.4) 0%,transparent 60%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.18) 0%, transparent 60%)", pointerEvents:"none", mixBlendMode:"screen" }} />
          </div>

          {/* BOTTOM face */}
          <div style={styleBottom} />

          {/* Inner glow (visible through open top) */}
          <div ref={innerGlowRef} style={{
            position: "absolute", width: W, height: H,
            marginLeft: -W/2, marginTop: -H/2,
            transform: `translateZ(${D/2 - 2}px)`,
            background: "radial-gradient(ellipse at 50% 65%, rgba(255,210,0,0.9) 0%, rgba(255,120,0,0.6) 30%, transparent 68%)",
            opacity: 0.05, pointerEvents: "none", zIndex: 2,
            filter: "blur(4px)",
          }} />

          {/* Tissue paper (peeking out from open top) */}
          <div ref={tissueRef} style={{
            position: "absolute", width: W - 24, height: 70,
            marginLeft: -(W-24)/2, marginTop: -70,
            transform: `translateY(${-(H/2 - 10)}px)`,
            opacity: 0, pointerEvents: "none",
          }}>
            {[...Array(3)].map((_, ti) => (
              <div key={ti} style={{
                position: "absolute",
                top: ti * 8, left: ti * 12,
                right: ti * 8,
                height: 60 + ti * 8,
                background: ti % 2 === 0
                  ? "linear-gradient(160deg, rgba(255,240,180,0.85) 0%, rgba(255,220,100,0.6) 100%)"
                  : "linear-gradient(160deg, rgba(255,210,80,0.7) 0%, rgba(200,160,40,0.5) 100%)",
                borderRadius: "40% 40% 10% 10%",
                transform: `rotateZ(${(ti - 1) * 8}deg)`,
                boxShadow: "0 -4px 12px rgba(255,200,0,0.3)",
              }} />
            ))}
          </div>

          {/* Confetti Sprinklers Burst */}
          <div ref={sprinklersRef} style={{
            position: "absolute", width: 0, height: 0,
            transform: `translateY(${-H/2}px)`,
            transformStyle: "preserve-3d", pointerEvents: "none",
          }}>
            {sprinklerTraj.map((traj, i) => (
              <div key={i} style={{
                position: "absolute", top: 0, left: 0,
                width: 8, height: 8,
                background: traj.color,
                opacity: 0,
                boxShadow: "0 0 10px " + traj.color,
              }} />
            ))}
          </div>

          {/* Photo cubes exploding out of box opening */}
          <div ref={photosRef} style={{
            position: "absolute",
            width: 0, height: 0,
            transform: `translateY(${-H/2}px)`,
            transformStyle: "preserve-3d",
          }}>
            {cards.map((img: any, i: number) => {
              const S = 90; // Cube size
              return (
                <div key={`${img.id}-${i}`} style={{
                  position: "absolute",
                  bottom: 0, left: 0,
                  transform: "translateY(0px) rotateZ(0deg) scale(0.3)",
                  opacity: 0,
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  zIndex: cards.length - i,
                }}>
                  <div 
                    className="group cursor-pointer transition-transform duration-300 hover:scale-[1.3] hover:-translate-y-8"
                    style={{ 
                      position: "relative", width: S, height: S, marginLeft: -S/2, marginTop: -S/2,
                      transformStyle: "preserve-3d", zIndex: cards.length - i 
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.zIndex = "50"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.zIndex = String(cards.length - i); }}
                    onClick={() => setSelectedPhoto(img)}
                  >
                    {/* 6 Faces of the cube */}
                    {[
                      { rot: "rotateY(0deg)" },
                      { rot: "rotateY(180deg)" },
                      { rot: "rotateY(90deg)" },
                      { rot: "rotateY(-90deg)" },
                      { rot: "rotateX(90deg)" },
                      { rot: "rotateX(-90deg)" }
                    ].map((face, fi) => (
                      <div key={fi} style={{
                        position: "absolute", inset: 0,
                        transform: `${face.rot} translateZ(${S/2}px)`,
                        border: "5px solid #fff", // Thick acrylic white border
                        borderRadius: "2px",
                        boxShadow: "inset 0 0 15px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)",
                        background: "#fff",
                        backfaceVisibility: "hidden",
                        overflow: "hidden",
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.displayUrl} alt={`cube-face-${i}-${fi}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                        {/* Lighting overlay for 3D depth */}
                        <div style={{ position:"absolute", inset:0, background: fi === 4 ? "rgba(255,255,255,0.15)" : fi === 5 ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)", pointerEvents:"none" }} />
                      </div>
                    ))}
                    
                    {/* Caption floating above the cube when hovered */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-black/80 text-white/90 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-yellow-500/30" style={{ transform: "translateZ(30px)" }}>
                      {content?.[`s2_caption_${i % 9}`] || "A beautiful memory"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ══════════════ LID (hinges from back-top edge) ══════════════ */}
          {/*
            Pivot positioned at back-top-center of box body:
            translateY(-H/2) translateZ(-D/2)
            Then rotateX opens the lid (negative = opens toward viewer/up)
          */}
          <div
            ref={lidPivotRef}
            style={{
              position: "absolute",
              transformStyle: "preserve-3d",
              transformOrigin: "0 0 0",  // rotate around this origin (the hinge point)
              transform: `translateY(${-H/2}px) translateZ(${-D/2 - 3}px) rotateX(0deg)`,
              width: 0, height: 0,
            }}
          >
            {/* True 3D Popping Bow - SIBLING to prevent overflow clipping */}
            <div ref={bowRef} style={{
              position: "absolute",
              width: 0, height: 0,
              transformStyle: "preserve-3d",
              transform: `translateZ(${LD/2}px) translateY(-2px) rotateX(90deg)`,
            }}>
              {/* 0. Central knot (dome) */}
              <div style={{
                position:"absolute", top:0, left:0,
                transform:"translate(-50%,-50%) translateZ(4px)",
                width:60, height:60,
                borderRadius:"50%",
                background:"radial-gradient(circle at 35% 35%, #ff4d4d 0%, #cc0000 30%, #800000 70%, #330000 100%)",
                boxShadow:"0 15px 30px rgba(0,0,0,0.7), inset -4px -4px 15px rgba(0,0,0,0.5), 0 0 40px rgba(255,0,0,0.4)",
                border:"1px solid rgba(255,100,100,0.8)",
              }} />
              {/* 1-4. 3D Loops */}
              {[-1, 1, -1, 1].map((dx, bi) => {
                const dy = bi < 2 ? -1 : 1;
                return (
                  <div key={bi} style={{
                    position:"absolute", top:0, left:0,
                    width: 55, height: 40,
                    marginLeft: dx < 0 ? -53 : -2,
                    marginTop: dy < 0 ? -38 : -2,
                    background: "linear-gradient(135deg, #ff4d4d 0%, #b30000 50%, #660000 100%)",
                    borderRadius: dx < 0 ? "50% 25% 25% 50%" : "25% 50% 50% 25%",
                    boxShadow: "0 12px 25px rgba(0,0,0,0.6), inset 0 3px 20px rgba(255,100,100,0.7)",
                    transformOrigin: dx < 0 ? "100% 50%" : "0% 50%",
                    transform: `translateZ(2px) rotateY(${dx * -45}deg) rotateX(${dy * 40}deg) rotateZ(${dx * dy * -30}deg)`,
                    border: "2px solid rgba(255,100,100,0.6)",
                  }} />
                );
              })}
              {/* 5-6. Ribbon Tails */}
              {[-1, 1].map((dx, ti) => (
                <div key={`tail-${ti}`} style={{
                  position:"absolute", top:0, left:0,
                  width: 28, height: 110,
                  marginLeft: dx < 0 ? -42 : 14,
                  marginTop: 15,
                  background: "linear-gradient(180deg, #cc0000 0%, #660000 100%)",
                  transformOrigin: "top center",
                  transform: `translateZ(0px) rotateX(55deg) rotateZ(${dx * 35}deg)`,
                  clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }} />
              ))}
            </div>

            {/* Lid top face - OUTSIDE (LW × LD) */}
            <div style={{
              position: "absolute",
              width: LW, height: LD,
              marginLeft: -LW/2, marginTop: -LD/2,
              transform: `translateZ(${LD/2}px) rotateX(90deg) translateZ(1px)`,
              background: "linear-gradient(135deg, #d4a96a 0%, #c09050 40%, #9a7035 100%)",
              border: "2px solid rgba(80,30,0,0.2)",
              boxSizing: "border-box", overflow: "hidden",
            }}>
              <div style={rH} /><div style={rV} />
              {/* Top-face velvet sheen */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(150deg,rgba(255,200,100,0.2) 0%,transparent 50%,rgba(0,0,0,0.15) 100%)", pointerEvents:"none" }} />
              {/* Dynamic Spotlight */}
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.35) 0%, transparent 60%)", pointerEvents:"none", mixBlendMode:"screen" }} />
            </div>

            {/* Lid top face - INSIDE (LW × LD) */}
            <div style={{
              position: "absolute",
              width: LW, height: LD,
              marginLeft: -LW/2, marginTop: -LD/2,
              transform: `translateZ(${LD/2}px) rotateX(-90deg) translateZ(1px)`,
              background: "#6e4f2a",
              border: "2px solid rgba(80,30,0,0.2)",
              boxSizing: "border-box",
            }} />

            {/* Lid FRONT face (LW × LH) */}
            <div style={{
              position: "absolute",
              width: LW, height: LH,
              marginLeft: -LW/2, marginTop: -LH/2,
              transform: `translateZ(${LD}px) translateY(${LH/2}px)`,
              background: "linear-gradient(180deg, #c8a97a 0%, #a07845 100%)",
              border: "2px solid rgba(80,30,0,0.2)",
              boxSizing: "border-box", overflow: "hidden",
            }}>
              <div style={rH} /><div style={rV} />
              {/* Dynamic Spotlight */}
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.3) 0%, transparent 60%)", pointerEvents:"none", mixBlendMode:"screen" }} />
            </div>

            {/* Lid BACK face (LW × LH) */}
            <div style={{
              position: "absolute",
              width: LW, height: LH,
              marginLeft: -LW/2, marginTop: -LH/2,
              transform: `translateZ(0px) translateY(${LH/2}px) rotateY(180deg)`,
              background: "linear-gradient(180deg, #9e8460 0%, #7d6341 100%)",
              border: "2px solid rgba(139,0,0,0.1)",
              boxSizing: "border-box", overflow: "hidden",
            }} />

            {/* Lid LEFT face (LD × LH) */}
            <div style={{
              position: "absolute",
              width: LD, height: LH,
              marginLeft: -LD/2, marginTop: -LH/2,
              transform: `translateX(${-LW/2}px) translateZ(${LD/2}px) translateY(${LH/2}px) rotateY(-90deg)`,
              background: "linear-gradient(180deg, #9e8460 0%, #7d6341 100%)",
              border: "2px solid rgba(139,0,0,0.1)",
              boxSizing: "border-box", overflow: "hidden",
            }}>
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.15)", pointerEvents:"none" }} />
            </div>

            {/* Lid RIGHT face (LD × LH) */}
            <div style={{
              position: "absolute",
              width: LD, height: LH,
              marginLeft: -LD/2, marginTop: -LH/2,
              transform: `translateX(${LW/2}px) translateZ(${LD/2}px) translateY(${LH/2}px) rotateY(90deg)`,
              background: "linear-gradient(180deg, #cbb18d 0%, #a88c68 100%)",
              border: "2px solid rgba(139,0,0,0.1)",
              boxSizing: "border-box", overflow: "hidden",
            }}>
              <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.18)", pointerEvents:"none" }} />
            </div>
          </div>

          {/* Ground shadow */}
          <div style={{
            position: "absolute",
            width: W * 1.3, height: D * 0.5,
            marginLeft: -W * 0.65,
            transform: `translateY(${H/2 + 20}px) rotateX(90deg)`,
            background: "radial-gradient(ellipse, rgba(0,0,0,0.65) 0%, transparent 70%)",
            filter: "blur(12px)",
          }} />
        </div>
      </div>

      {/* Lightbox Overlay */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedPhoto(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: "#faf8f2",
              padding: "12px 12px 40px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,180,0,0.2)",
              border: "2px solid rgba(212,175,55,0.3)",
              borderRadius: 4,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedPhoto.displayUrl} 
                alt="Selected Memory"
                className="w-auto h-auto max-w-full max-h-[75vh] object-contain block"
              />
              <div className="absolute bottom-4 left-0 right-0 text-center font-serif text-xl sm:text-2xl text-[#3a2f29]">
                {content?.[`s2_caption_${cards.findIndex((c:any) => c.id === selectedPhoto.id)}`] || "A beautiful memory"}
              </div>
            </div>
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN BIRTHDAY LAYOUT (multi-section)
════════════════════════════════════════════════════ */
export default function Birthday3DLayout({
  images = [],
  title = "BIRTHDAY\nSKIES",
  description = "FLOATING MOMENTS\nFOREVER",
  content = {},
  onTitleChange,
  onDescriptionChange,
  onContentChange,
}: any) {
  /* Split images by slot position */
  const slot1Images = images.filter((img: any) => img.position === 0).slice(0, 15);
  const slot2Images = images.filter((img: any) => img.position === 1).slice(0, 16);
  const slot3Images = images.filter((img: any) => img.position === 2).slice(0, 24);
  const slot4Images = images.filter((img: any) => img.position === 3).slice(0, 14);

  let displaySlot1: any[] = slot1Images;
  if (displaySlot1.length === 0)
    displaySlot1 = PLACEHOLDERS.map((src, i) => ({ id: `p1-${i}`, displayUrl: src }));

  const allUrls: string[] = displaySlot1.map((img: any) => img.displayUrl);
  while (allUrls.length < 6)
    allUrls.push(PLACEHOLDERS[allUrls.length % PLACEHOLDERS.length]);

  const FLOAT_POSITIONS = [8, 24, 42, 60, 78];

  return (
    <div className="w-full">
      {/* ───── SECTION 1: Floating Glowing Lantern Cubes ───── */}
      <section
        className="relative h-screen overflow-hidden font-serif text-[#f4eee6]"
        style={{ background: "#050B14" }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url('/images/birthday_night_sky_v2.jpg')`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0" style={{ backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", background: "rgba(5,11,20,0.3)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050B14]/40 via-transparent to-[#050B14]/75" />
        </div>

        {/* Navigation */}
        <div className="absolute top-6 right-8 z-50 flex items-center gap-6 text-xs tracking-widest font-sans uppercase text-white/70">
          <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">Home</span>
          <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">Moments</span>
          <span className="hover:text-white cursor-pointer transition-colors hidden sm:inline">Wishes</span>
          <Menu className="hover:text-white cursor-pointer transition-colors" size={22} />
        </div>

        {/* Hero title */}
        <div
          className="absolute left-4 sm:left-8 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
          style={{ width: "clamp(180px, 40vw, 480px)" }}
        >
          <h1
            className="font-serif font-extrabold tracking-tight leading-[0.88] text-[#f3dfc1] whitespace-pre-wrap"
            style={{ fontSize: "clamp(2.5rem, 9vw, 9rem)", textShadow: "0 4px 32px rgba(0,0,0,0.9), 0 0 60px rgba(255,140,0,0.2)" }}
          >
            <InlineEditableText value={title} onChange={onTitleChange} />
          </h1>
          <p
            className="font-sans uppercase tracking-[0.28em] text-[#d9cbb8]/80 whitespace-pre-wrap mt-4"
            style={{ fontSize: "clamp(0.55rem, 1.1vw, 0.8rem)" }}
          >
            <InlineEditableText value={description} onChange={onDescriptionChange} />
          </p>
        </div>

        {/* Floating lantern cubes */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {displaySlot1.slice(0, 5).map((img: any, i: number) => {
            const duration = 45 + (i % 3) * 6;
            const delay = -(i * (duration / 5));
            const leftPos = FLOAT_POSITIONS[i];
            const scaleVal = 1 + (-120 + (i % 5) * 60) / 1600;
            const faceUrls = Array.from({ length: 6 }, (_, fi) => allUrls[(i + fi) % allUrls.length]);
            const visibilityClass = i >= 4 ? "hidden lg:block" : i >= 3 ? "hidden sm:block" : "block";

            return (
              <motion.div
                key={img.id}
                className={`absolute flex flex-col items-center pointer-events-auto ${visibilityClass}`}
                style={{ left: `${leftPos}%`, top: "100vh", scale: scaleVal }}
                animate={{ y: [0, "-160vh"], x: [0, 25, -25, 0], rotateZ: [-1.5, 1.5, -1, 1, -1.5] }}
                transition={{
                  y: { duration, repeat: Infinity, ease: "linear", delay },
                  x: { duration: duration * 0.9, repeat: Infinity, ease: "easeInOut", delay },
                  rotateZ: { duration: duration * 0.75, repeat: Infinity, ease: "easeInOut", delay },
                }}
              >
                <div className="flex flex-col items-center sm:!transform-none" style={{ transform: "scale(0.6)", transformOrigin: "bottom center" }}>
                  <GlowingLanternCube
                    imgs={faceUrls}
                    caption={content?.[`caption_${i}`] || DEFAULT_CAPTIONS_S1[i % DEFAULT_CAPTIONS_S1.length]}
                    speed={12 + (i % 4) * 2}
                    initialRotation={(i * 72) % 360}
                    onCaptionChange={(val) => onContentChange && onContentChange(`caption_${i}`, val)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom decorative */}
        <div className="absolute bottom-10 left-8 text-[#d9cbb8]/60 font-serif uppercase tracking-[0.2em] text-[0.6rem] leading-loose z-50 pointer-events-none hidden sm:block">
          Some<br />Memories<br />Never<br />Fade
        </div>
        <div className="absolute bottom-14 right-10 text-[#f3dfc1] font-handwriting text-2xl md:text-3xl z-50 rotate-[-5deg] pointer-events-none">
          High<br />on<br />Moments ♡
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 text-[#d9cbb8]/60 cursor-pointer">
          <Mouse size={20} className="mb-2" />
          <span className="text-[9px] tracking-[0.3em] uppercase">Scroll Down</span>
          <div className="mt-3 w-[1px] h-10 bg-gradient-to-b from-[#d9cbb8]/40 to-transparent" />
        </div>
      </section>

      {/* ───── SECTION 2: 3D Gift Box Unwrap ───── */}
      <GiftBoxSection
        images={slot2Images}
        title={content?.s2_title || "OPEN\nWITH\nLOVE"}
        description={content?.s2_description || "EVERY PHOTO\nA GIFT"}
        content={content}
        onTitleChange={(val: string) => onContentChange && onContentChange("s2_title", val)}
        onDescriptionChange={(val: string) => onContentChange && onContentChange("s2_description", val)}
        onContentChange={onContentChange}
      />

      {/* ───── SECTION 3: 3D Ferris Wheel of Memories ───── */}
      <BirthdayFerrisWheelLayout
        title={content?.s3_title || "RIDE THE\nMEMORIES"}
        description={content?.s3_description || "EVERY GONDOLA\nA GIFT BOX SURPRISE"}
        cards={slot3Images}
        onTitleChange={(val: string) => onContentChange && onContentChange("s3_title", val)}
        onDescriptionChange={(val: string) => onContentChange && onContentChange("s3_description", val)}
      />

      {/* ───── SECTION 4: Magical Wishing Tree ───── */}
      <BirthdayWishingTreeLayout
        title={content?.s4_title || "A Tree of\nBeautiful Moments"}
        description={content?.s4_description || "Every photo a story, every branch a memory, and every light a moment we'll always keep."}
        cards={slot4Images}
        onTitleChange={(val: string) => onContentChange && onContentChange("s4_title", val)}
        onDescriptionChange={(val: string) => onContentChange && onContentChange("s4_description", val)}
      />
    </div>
  );
}
