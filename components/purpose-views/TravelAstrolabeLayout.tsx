"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import InlineEditableText from "@/components/InlineEditableText";
import Lightbox from "../Lightbox";

/* ── PLACEHOLDERS ── */
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
  "https://images.unsplash.com/photo-1517677129300-07b130802f46?q=80&w=800",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800",
  "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=800",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800",
];

const LABELS = [
  "Mountains\n2023",
  "Sunsets\nHeal",
  "Exploring\nNew Streets",
  "Good Company\nAlways",
  "Salty Hair\nHappier Me",
  "Quiet\nMoments"
];

/* ── ORNAMENT COMPONENTS ── */
const GlobeOrnament = () => (
  <div className="w-14 h-14 md:w-20 md:h-20 rounded-full relative overflow-hidden bg-[#a68a5c] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.4)] border-2 border-[#b59868]">
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b')] bg-cover opacity-50 mix-blend-multiply" />
    <div className="absolute w-[110%] h-[110%] top-1/2 left-1/2 rounded-full border-4 border-[#5c4322]/60" style={{ transform: 'translate(-50%, -50%) rotateX(65deg) rotateY(15deg)' }} />
  </div>
);

const MoonOrnament = () => (
  <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-transparent rotate-[60deg] shadow-[inset_12px_0_0_#d4af37,0_10px_15px_rgba(0,0,0,0.2)] drop-shadow-xl" />
);

const StarOrnament = () => (
  <div 
    className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-[#f5d799] to-[#8b6a38] shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
    style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
  />
);

const CompassOrnament = () => (
  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#e6d0a3] to-[#8b6a38] p-1 shadow-xl border border-[#f5d799]">
    <div className="w-full h-full rounded-full border-[3px] border-[#5c4322] relative flex items-center justify-center shadow-inner">
      <span className="absolute top-0.5 text-[8px] font-bold text-[#5c4322] leading-none">N</span>
      <span className="absolute bottom-0.5 text-[8px] font-bold text-[#5c4322] leading-none">S</span>
      <span className="absolute left-1 text-[8px] font-bold text-[#5c4322] leading-none">W</span>
      <span className="absolute right-1 text-[8px] font-bold text-[#5c4322] leading-none">E</span>
      <div className="w-1.5 h-10 bg-gradient-to-b from-[#8a221a] to-[#3a2817] rounded-full rotate-45 shadow-sm" />
    </div>
  </div>
);

const BellOrnament = () => (
  <div className="relative flex flex-col items-center drop-shadow-xl">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-[#f5d799] to-[#a88248] rounded-t-full border-b border-[#5c4322] shadow-inner" />
    <div className="w-12 h-2 md:w-14 md:h-3 bg-gradient-to-r from-[#70522a] via-[#f5d799] to-[#70522a] rounded-full -mt-1 shadow-md" />
    <div className="w-3 h-3 md:w-4 md:h-4 bg-[#4a361c] rounded-full -mt-1" />
  </div>
);

const Ornaments = {
  globe: GlobeOrnament,
  moon: MoonOrnament,
  star: StarOrnament,
  compass: CompassOrnament,
  bell: BellOrnament
};

/* ── CONFIGURATION FOR HANGING ITEMS ── */
const CHIME_ITEMS = [
  // Outer (radius 240)
  { id: 1, type: 'polaroid', radius: 240, angle: 0,   length: 250, twist: -5 },
  { id: 2, type: 'ornament', icon: 'moon', radius: 240, angle: 30,  length: 180, twist: 0 },
  { id: 3, type: 'polaroid', radius: 240, angle: 60,  length: 380, twist: 4 },
  { id: 4, type: 'polaroid', radius: 240, angle: 90,  length: 290, twist: -2 },
  { id: 5, type: 'ornament', icon: 'star', radius: 240, angle: 120, length: 450, twist: 0 },
  { id: 6, type: 'polaroid', radius: 240, angle: 150, length: 320, twist: 6 },
  { id: 7, type: 'polaroid', radius: 240, angle: 180, length: 480, twist: -3 },
  { id: 8, type: 'ornament', icon: 'globe', radius: 240, angle: 210, length: 220, twist: 0 },
  { id: 9, type: 'polaroid', radius: 240, angle: 240, length: 350, twist: 2 },
  { id: 10, type: 'polaroid', radius: 240, angle: 270, length: 420, twist: -4 },
  { id: 11, type: 'ornament', icon: 'bell', radius: 240, angle: 300, length: 280, twist: 0 },
  { id: 12, type: 'polaroid', radius: 240, angle: 330, length: 360, twist: 5 },

  // Inner (radius 100)
  { id: 13, type: 'polaroid', radius: 100, angle: 0,   length: 500, twist: 10 },
  { id: 14, type: 'ornament', icon: 'compass', radius: 100, angle: 60, length: 400, twist: 0 },
  { id: 15, type: 'polaroid', radius: 100, angle: 120, length: 550, twist: -8 },
  { id: 16, type: 'polaroid', radius: 100, angle: 180, length: 480, twist: 4 },
  { id: 17, type: 'ornament', icon: 'star', radius: 100, angle: 240, length: 350, twist: 0 },
  { id: 18, type: 'polaroid', radius: 100, angle: 300, length: 430, twist: -6 },
];

/* ── INDIVIDUAL HANGING ITEM WITH 3D PHYSICS ── */
function HangingItem({ 
  config, 
  itemData, 
  globalRotation,
  onClick
}: { 
  config: any; 
  itemData: any; 
  globalRotation: MotionValue<number>;
  onClick?: () => void;
}) {
  // Continuous gentle sway for natural realism
  const swayX = useSpring(0, { damping: 10 + Math.random() * 10, stiffness: 40 + Math.random() * 20 });
  const swayZ = useSpring(0, { damping: 10 + Math.random() * 10, stiffness: 40 + Math.random() * 20 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      swayX.set((Math.random() - 0.5) * 12);
      swayZ.set((Math.random() - 0.5) * 12);
    }, 2000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [swayX, swayZ]);

  // The carousel spins. To keep the photo facing the user (world Z), it must counter-rotate perfectly.
  const counterRotation = useTransform(globalRotation, (v: number) => -config.angle - v + config.twist);

  const OrnamentComponent = config.type === 'ornament' ? Ornaments[config.icon as keyof typeof Ornaments] : null;

  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        transform: `rotateY(${config.angle}deg) translateZ(${config.radius}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="absolute w-[240px] -left-[120px] flex flex-col items-center"
        style={{
          transformOrigin: 'top center',
          rotateX: swayX,
          rotateZ: swayZ,
          rotateY: counterRotation, // MAGIC: counteracts the carousel spin!
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Top Bead exactly on the rim */}
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#f5d799] to-[#8b6a38] shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10" />
        
        {/* String */}
        <div className="w-[1.5px] bg-gradient-to-b from-[#8b6a38] to-[#d4af37]/60 shadow-[1px_0_2px_rgba(0,0,0,0.3)]" style={{ height: config.length }} />
        
        {/* Bottom Bead */}
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#f5d799] to-[#5c3a21] shadow-md -mb-1 z-10" />
        
        {/* Payload */}
        <div className="pointer-events-auto cursor-pointer group -mt-1 transition-transform duration-500 hover:scale-105" style={{ transformStyle: 'preserve-3d' }}>
          {/* THE POLAROID (OR EMPTY SLOT) */}
          {itemData ? (
            <div 
              className="bg-[#fdfaf5] p-2 md:p-3 pb-8 md:pb-12 rounded-sm shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex flex-col items-center gap-2 relative group cursor-pointer hover:scale-105 transition-transform"
              style={{ transform: 'translateZ(1px)' }}
              onClick={onClick}
            >
              <div className="relative aspect-[3/4] w-28 md:w-36 overflow-hidden shadow-inner">
                <Image src={itemData.src} alt="Memory" fill className="object-cover sepia-[.15] contrast-110 transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute bottom-2 w-full text-center left-0 px-2">
                <span className="font-handwriting text-[#3a2f26] text-lg md:text-xl leading-tight whitespace-pre-line block">
                  {itemData.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              {OrnamentComponent && <OrnamentComponent />}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */

// --- 3D Helper Functions ---

// Mathematically constructs a 3D torus (rounded ring) out of stacked DOM circles
const renderTorus = (baseRadius: number, tubeRadius: number, layers: number) => {
  const colorTiers = [
    '#0a0502', // 0 (bottom shadow)
    '#1a0f08', // 1
    '#2c1d11', // 2
    '#3a2517', // 3
    '#4a2e1b', // 4
    '#5a3821', // 5 (equator)
    '#6b4426', // 6
    '#7d5230', // 7
    '#8f603a', // 8
    '#a16f45', // 9
    '#b37e50'  // 10 (top highlight)
  ];

  return Array.from({ length: layers }).map((_, i) => {
    // Math to form a rounded tube cross-section
    const centerI = (layers - 1) / 2;
    const zStep = (tubeRadius * 2) / (layers - 1);
    const z = (i - centerI) * zStep;
    
    // Pythagorean theorem for border width (rounded edges)
    const w = Math.sqrt(Math.max(0, tubeRadius * tubeRadius - z * z));
    const borderWidth = Math.max(1, w * 2);
    
    // Size is adjusted so the tube center is perfectly at baseRadius
    const size = (baseRadius + w) * 2;
    
    // Map layer index to lighting color tier
    const colorIdx = Math.round((i / (layers - 1)) * 10);
    const color = colorTiers[colorIdx];

    return (
      <div 
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderWidth: `${borderWidth}px`,
          borderColor: color,
          transform: `translate(-50%, -50%) translateZ(${z}px)`,
          boxShadow: i === 0 ? '0 30px 40px rgba(0,0,0,0.9)' : 'none',
        }}
      />
    );
  });
};

export default function TravelAstrolabeLayout({ 
  images = [],
  content = {},
  onContentChange 
}: { 
  images?: any[];
  content?: any;
  onContentChange?: (key: string, val: string) => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Carousel physics
  const currentRotation = useMotionValue(0);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    setIsClient(true);
    const loop = () => {
      // Base slow rotation so it always feels alive
      let vel = velocityRef.current;
      if (Math.abs(vel) < 0.05) vel = 0.15; // gentle auto spin

      rotationRef.current += vel;
      velocityRef.current *= 0.95; // friction

      currentRotation.set(rotationRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentRotation]);

  const handleWheel = (e: React.WheelEvent) => {
    // Spin faster on scroll
    velocityRef.current += e.deltaY * 0.05;
  };

  // Prepare source images
  const slotImages = images.filter((img) => img?.position === 3);
  const rawImages = slotImages.length > 0 ? slotImages : [];
  
  let polaroidIndex = 0;
  const mappedItems = CHIME_ITEMS.map((config) => {
    if (config.type === 'polaroid') {
      const img = rawImages[polaroidIndex % Math.max(rawImages.length, 1)];
      const itemData = {
        id: img?.id || `placeholder-${polaroidIndex}`,
        src: img?.displayUrl || img?.originalUrl || img?.url || PLACEHOLDERS[polaroidIndex % PLACEHOLDERS.length],
        label: img?.caption || img?.note || LABELS[polaroidIndex % LABELS.length]
      };
      polaroidIndex++;
      return { config, itemData };
    }
    return { config, itemData: null };
  });

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[120vh] overflow-hidden bg-[#2a221b] select-none"
      onWheel={handleWheel}
    >
      {/* ── BACKGROUND ── */}
      {/* ── BACKGROUND IMAGE & OVERLAYS ── */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url('/images/vintage_travel_bg.jpg')`,
          filter: "blur(12px) sepia(0.2) contrast(1.1)"
        }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#15100a_100%)] pointer-events-none" />

      {/* ── TYPOGRAPHY OVERLAYS ── */}

      <div className="absolute top-32 right-12 md:right-32 z-50 max-w-[150px] rotate-12 pointer-events-auto">
        <div className="font-handwriting text-3xl md:text-5xl text-[#f7e8ce] leading-tight drop-shadow-lg opacity-90">
          <InlineEditableText
            value={content?.mobileQuote || "Let the\nmemories\nsway ♡"}
            onChange={(val) => onContentChange && onContentChange("mobileQuote", val)}
            as="p"
            className="whitespace-pre-line"
          />
        </div>
      </div>

      <div className="absolute bottom-12 w-full flex justify-between px-8 md:px-16 z-50 items-end pointer-events-none">
        <div className="text-[9px] md:text-[10px] text-[#a68a5c] tracking-[0.3em] font-serif leading-loose uppercase">
          PHOTOS<br/>PLACES<br/>PEOPLE<br/>FEELINGS
        </div>
        
        <div className="flex flex-col items-center gap-3 opacity-60">
          <div className="w-5 h-8 border border-[#a68a5c] rounded-full flex justify-center p-1">
            <motion.div 
              className="w-1 h-2 bg-[#a68a5c] rounded-full" 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-[#a68a5c] text-center">
            Scroll to spin<br/>the mobile
          </span>
        </div>

        <div className="text-[9px] md:text-[10px] text-[#a68a5c] tracking-[0.3em] font-serif leading-loose uppercase text-right">
          SOME<br/>MEMORIES<br/>NEVER<br/>STAND STILL
        </div>
      </div>
      
      {/* ── EDITABLE NOTES ON THE LEFT ── */}
      <div className="absolute top-14 md:top-1/2 md:-translate-y-1/2 left-5 right-5 md:right-auto md:left-24 z-50 max-w-none md:max-w-[600px] lg:max-w-[800px] pointer-events-none">
        <div className="font-serif text-4xl sm:text-5xl md:text-8xl lg:text-9xl font-bold mb-4 md:mb-8 text-[#e8d5b7] drop-shadow-xl leading-tight pointer-events-auto">
          <InlineEditableText
            value={content?.sideHeading || "A Journey\nRemembered"}
            onChange={(val) => onContentChange && onContentChange("sideHeading", val)}
            as="p"
            className="whitespace-pre-line"
          />
        </div>
        <div className="hidden sm:block font-sans text-sm md:text-xl text-[#e8d5b7] opacity-90 leading-relaxed font-light tracking-wide pointer-events-auto">
          <InlineEditableText
            value={content?.sideNotes || "These are the moments that shape our story. A gentle breeze carrying the echoes of laughter, the warmth of distant suns, and the quiet beauty of times we never want to forget."}
            onChange={(val) => onContentChange && onContentChange("sideNotes", val)}
            as="p"
            className="whitespace-pre-line"
          />
        </div>
      </div>

      {/* ── THE REALISTIC 3D CAROUSEL STRUCTURE ── */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none scale-[0.5] sm:scale-[0.7] lg:scale-100"
        style={{ perspective: "1500px" }}
      >
        {/* Core Rotator (Tilted slightly forward so we see the rings from an angle) */}
        <motion.div
          className="relative flex items-center justify-center pointer-events-auto"
          style={{ 
            transformStyle: "preserve-3d", 
            rotateX: -10, // Tilt camera down slightly
            rotateY: currentRotation, // The master spin!
            x: isClient && window.innerWidth > 768 ? "15vw" : "0vw", // Shift right on desktop
            y: -350 // Shift entire assembly upwards
          }}
        >
          {/* Upper Suspension Rod / Rope from ceiling (True 3D Square Pillar) */}
          <div 
            className="absolute" 
            style={{ 
              width: '12px', height: '60vh', 
              bottom: '50%', left: '50%', 
              transform: 'translate(-50%, 0)', 
              transformStyle: 'preserve-3d' 
            }}
          >
            {/* Front face */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f08] via-[#4a2e1b] to-[#2c1d11]" style={{ transform: 'translateZ(6px)' }} />
            {/* Back face */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f08] via-[#2c1d11] to-[#1a0f08]" style={{ transform: 'rotateY(180deg) translateZ(6px)' }} />
            {/* Left face */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f08] via-[#3a2517] to-[#1a0f08]" style={{ transform: 'rotateY(-90deg) translateZ(6px)' }} />
            {/* Right face */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f08] via-[#5a3821] to-[#2c1d11]" style={{ transform: 'rotateY(90deg) translateZ(6px)' }} />
          </div>
          
          {/* ── OUTER WOODEN HOOP (Mathematically rounded 3D Torus) ── */}
          <div className="absolute" style={{ transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' }}>
            {renderTorus(240, 20, 11)}
          </div>

          {/* ── INNER WOODEN HOOP (Mathematically rounded 3D Torus) ── */}
          <div className="absolute" style={{ transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' }}>
            {renderTorus(100, 12, 9)}
          </div>

          {/* ── WOODEN SPOKES (True 3D beams connecting rod to hoops) ── */}
          <div className="absolute" style={{ transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' }}>
            {/* Spoke 1 (X axis) stacked */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`s1-${i}`} className="absolute w-[480px] h-[12px]" style={{ backgroundColor: i === 0 || i === 4 ? '#1a0f08' : '#4a2e1b', transform: `translate(-50%, -50%) translateZ(${(i - 2) * 2}px)` }} />
            ))}
            {/* Spoke 2 (Z axis) stacked */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`s2-${i}`} className="absolute w-[480px] h-[12px]" style={{ backgroundColor: i === 0 || i === 4 ? '#1a0f08' : '#4a2e1b', transform: `translate(-50%, -50%) rotate(90deg) translateZ(${(i - 2) * 2}px)` }} />
            ))}
            {/* Central hub */}
            <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br from-[#8b6a38] to-[#4a361c] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.8)]" style={{ transform: 'translate(-50%, -50%) translateZ(6px)' }} />
          </div>

          {/* ── HANGING ITEMS ── */}
          {isClient && mappedItems.map(({ config, itemData }) => {
            const originalIndex = itemData?.id && !String(itemData.id).startsWith('placeholder') 
              ? slotImages.findIndex((img: any) => img.id === itemData.id) 
              : -1;
            return (
              <HangingItem 
                key={config.id}
                config={config} 
                itemData={itemData} 
                globalRotation={currentRotation}
                onClick={originalIndex !== -1 ? () => setSelectedImageIndex(originalIndex) : undefined}
              />
            );
          })}

        </motion.div>
      </div>

      {/* ── LIGHTBOX ── */}
      <Lightbox
        images={slotImages}
        currentIndex={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onNavigate={(newIdx) => setSelectedImageIndex(newIdx)}
      />
    </section>
  );
}
