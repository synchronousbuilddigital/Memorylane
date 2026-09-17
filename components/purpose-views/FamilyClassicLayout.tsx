"use client";

import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Lightbox from "@/components/Lightbox";

interface FamilyClassicLayoutProps {
  images: any[];
  title?: string;
  description?: string;
  onTitleChange?: (newTitle: string) => void;
  onDescriptionChange?: (newDescription: string) => void;
  content?: any;
  onContentChange?: (key: string, value: string) => void;
}

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop", // Hero
  "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=1954&auto=format&fit=crop", // Detail L
  "https://images.unsplash.com/photo-1609220136736-443140cffec6?q=80&w=2070&auto=format&fit=crop", // Detail R
  "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?q=80&w=2070&auto=format&fit=crop", // Landscape
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=2038&auto=format&fit=crop"  // Portrait
];

// ---------------------------------------------------------
// Hanging Mobile Background Component
// ---------------------------------------------------------

const PendulumCard = ({ image, index, content, onContentChange, stringOffset, onClick }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const duration = 4 + index * 0.7; // Different swing speeds
  const stringLength = 100 + (index % 3) * 60; // Varying drop heights

  // Only two fit a phone rail and three a tablet's; the rest would hang off-screen.
  const visibility = index >= 3 ? "hidden lg:flex" : index >= 2 ? "hidden sm:flex" : "flex";

  return (
    <div 
      className={`relative flex-col items-center ${visibility}`}
      style={{ marginTop: stringOffset }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <motion.div
        className="flex flex-col items-center origin-top cursor-pointer"
        animate={{ 
          rotateZ: isHovered ? [-4, 4, -4] : 0 
        }}
        transition={{ 
          duration: duration, 
          repeat: isHovered ? Infinity : 0, 
          ease: "easeInOut" 
        }}
        onClick={onClick}
      >
        {/* The String */}
        <div 
          className="w-[2px] bg-[#4a3b32]" 
          style={{ height: stringLength, minHeight: stringLength }}
        />
        
        {/* The Clip */}
        <div className="w-4 h-5 bg-[#8b6508] rounded-t-sm shadow-md -mt-1 z-10 pointer-events-none" />

        {/* The Polaroid Card */}
        <div 
          className="relative w-32 sm:w-40 lg:w-48 aspect-[4/5] bg-[#f4ebd8] p-2 sm:p-3 pb-8 sm:pb-10 lg:pb-12 shadow-2xl rounded-sm cursor-pointer border border-[#e8ddc5]"
          style={{ marginTop: -2 }}
        >
          <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }} />
          
          <div className="relative w-full h-full bg-gray-200">
            <Image src={image} alt={`Hanging Mobile ${index}`} fill className="object-cover" />
          </div>

          {/* Handwritten Note on the front */}
          <div className="absolute bottom-3 left-0 right-0 text-center px-2">
            <span 
              className={`font-serif italic text-[#4a3b32] text-[11px] sm:text-xs lg:text-sm leading-tight inline-block ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-1 transition-colors outline-none" : ""}`}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning={true}
              onBlur={(e) => onContentChange?.(`hangingNote_${index}`, e.currentTarget.textContent || "")}
            >
              {content?.[`hangingNote_${index}`] || "Life is brighter with you all ♡"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HangingBranchMobile = ({ images, fullImages, content, onContentChange, onImageClick }: any) => {
  // Use first 4 images safely
  const safeImages = images.slice(0, 4);
  while(safeImages.length < 4) safeImages.push(PLACEHOLDERS[safeImages.length]);

  // Adjust these offsets to exactly match the bottom edge of the undulating branch SVG
  const STRING_OFFSETS = [140, 110, 100, 80];

  return (
    <div className="absolute top-0 left-0 w-full h-[29rem] sm:h-[35rem] lg:h-[44rem] overflow-hidden pointer-events-none z-10 opacity-90 transition-opacity duration-1000">
      
      {/* The Hanging Cards (Behind the branch) — kept to the left 60% so they never meet the photo stack */}
      <div className="absolute top-0 left-0 w-full lg:w-[60%] flex justify-around px-4 sm:px-8 lg:px-16 pointer-events-auto z-10">
        {safeImages.map((img: any, i: number) => {
          const originalIndex = fullImages ? fullImages.findIndex((orig: any) => orig.displayUrl === img || orig.url === img) : -1;
          return (
            <PendulumCard 
              key={`hanging-${i}`} 
              index={i} 
              image={img.displayUrl || img} 
              content={content} 
              onContentChange={onContentChange} 
              stringOffset={STRING_OFFSETS[i]}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (originalIndex !== -1 && onImageClick) {
                  onImageClick(originalIndex);
                }
              }}
            />
          );
        })}
      </div>

      {/* The Organic Wooden Branch (SVG, in front of the strings) */}
      <svg 
        className="absolute top-4 left-0 w-[95%] h-32 md:h-48 z-20 pointer-events-none drop-shadow-xl" 
        preserveAspectRatio="none" 
        viewBox="0 0 1000 200"
      >
        <defs>
          <pattern id="wood-texture" patternUnits="userSpaceOnUse" width="1000" height="200">
            {/* Solid color fallback */}
            <rect width="1000" height="200" fill="#4a2e15" />
            {/* Very warm, beautiful brown wood texture */}
            <image href="https://images.unsplash.com/photo-1581417478175-a8eeee2ba154?q=80&w=2400" x="0" y="0" width="1000" height="200" preserveAspectRatio="none" opacity="0.65" />
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.4" floodColor="#2a1b12"/>
          </filter>
        </defs>
        
        {/* Main tapered, flying branch */}
        {/* Starts thick on the left (0,0 to 0,160), undulates across, and tapers to a point at (980, 80) */}
        <path 
          d="M0,0 
             L0,160 
             C 150,180 300,100 450,140 
             C 600,180 750,100 950,110 
             C 980,112 990,90 980,80 
             C 750,60 600,120 450,80 
             C 300,40 150,80 0,0 Z" 
          fill="url(#wood-texture)" 
          filter="url(#shadow)"
        />
        
        {/* Tiny knots/twigs for realism */}
        <path d="M 220,110 C 230,160 250,170 260,130 Z" fill="url(#wood-texture)" />
        <path d="M 550,140 C 560,180 575,185 580,150 Z" fill="url(#wood-texture)" />
        <path d="M 820,105 C 825,130 835,135 840,110 Z" fill="url(#wood-texture)" />
      </svg>
    </div>
  );
};


export default function FamilyClassicLayout({ images, title, description, onTitleChange, onDescriptionChange, content = {}, onContentChange }: FamilyClassicLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Extract images by their designated position slot
  const heroImages = images.filter(img => img.position === 0);
  const displayHeroImages = heroImages.length > 0 ? heroImages.map(i => i.displayUrl) : [PLACEHOLDERS[0]];

  const scrapbookImages = React.useMemo(() =>
    images.filter(img => img.position === 3).map(i => i.displayUrl),
    [images]);
  const slot4Images = React.useMemo(() =>
    images.filter(img => img.position === 4).map(i => i.displayUrl),
  [images]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax for the cinematic break
  const yLandscape = useTransform(scrollYProgress, [0.4, 0.8], [0, -100]);
  const scaleLandscape = useTransform(scrollYProgress, [0.4, 0.8], [1.1, 1]);

  const [isPhotoDetailOpen, setIsPhotoDetailOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState<any>(null);

  // Slideshow Logic
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayHeroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayHeroImages.length) % displayHeroImages.length);
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center overflow-hidden pt-12 bg-transparent">

      {/* The New Hanging Mobile Background Layer */}
      <HangingBranchMobile 
        images={displayHeroImages} 
        fullImages={images} 
        content={content} 
        onContentChange={onContentChange} 
        onImageClick={(idx: number) => setLightboxIndex(idx)}
      />

      {/* 1. Split Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 mb-20 lg:mb-32 min-h-[70vh] flex flex-col lg:flex-row items-center gap-10 lg:gap-16 relative z-20 mt-[30rem] sm:mt-[36rem] lg:mt-[24rem]">

        {/* Left Side: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full lg:w-5/12 flex flex-col justify-center text-center lg:text-left relative z-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[#8a755b] text-xs font-bold uppercase tracking-widest mb-6 w-max mx-auto lg:mx-0 tracking-[0.2em]">
            Family Album
          </div>
          <h1
            style={{ fontSize: "clamp(2.6rem, 4.6vw, 4.5rem)" }}
            className={`font-serif font-bold text-[#2c241b] tracking-tight mb-8 leading-[1.08] ${onTitleChange ? "cursor-text hover:bg-black/5 rounded-lg -mx-4 px-4 py-2 transition-colors outline-none border border-transparent focus:border-gray-200" : ""}`}
            contentEditable={!!onTitleChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onTitleChange?.(e.currentTarget.textContent || "")}
          >
            {title || "Our Beautiful Moments ♡"}
          </h1>
          <p
            className={`text-lg md:text-xl text-[#5a4d41] font-medium leading-relaxed mb-12 ${onDescriptionChange ? "cursor-text hover:bg-black/5 rounded-lg -mx-4 px-4 py-2 transition-colors outline-none border border-transparent focus:border-gray-200" : ""}`}
            contentEditable={!!onDescriptionChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onDescriptionChange?.(e.currentTarget.textContent || "")}
          >
            {description || "These are some of my favorite moments with family — little pieces of life that make the big picture beautiful."}
          </p>

          {/* Stat Boxes */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <div className="bg-white border border-[#f4ebd8] rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-sm flex flex-col items-center justify-center min-w-[104px] sm:min-w-[120px]">
              <span className="font-bold text-2xl text-[#2c241b] mb-1">{images.length}</span>
              <span className="text-xs text-[#8a755b] uppercase font-semibold">Photos</span>
            </div>
            <div className="bg-white border border-[#f4ebd8] rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-sm flex flex-col items-center justify-center min-w-[104px] sm:min-w-[120px]">
              <span className="font-bold text-2xl text-[#2c241b] mb-1">∞</span>
              <span className="text-xs text-[#8a755b] uppercase font-semibold">Memories</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: 3D Stacked Deck */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="w-full lg:w-7/12 relative perspective-[2000px] flex items-center justify-center lg:justify-end pr-0 lg:pr-8"
        >
          {/* Aesthetic Note */}
          <div className="absolute -top-2 left-0 hidden lg:block z-50 pointer-events-none opacity-80">
            <div className="font-serif italic text-2xl text-[#8a755b] -rotate-6">
              Different memories,<br />Same love ♡
            </div>
            <svg className="w-12 h-12 ml-10 -mt-1 text-[#8a755b]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20,20 Q40,80 80,60" />
              <path d="M70,50 L80,60 L65,65" />
            </svg>
          </div>

          <div className="relative w-[min(100%,480px)] lg:w-[min(100%,520px)] aspect-[11/12] mt-10 lg:mt-14 mr-6 lg:mr-10">
            <AnimatePresence initial={false}>
              {displayHeroImages.map((src, index) => {
                // Calculate position relative to current slide
                let offset = index - currentSlide;
                if (offset < 0) offset += displayHeroImages.length; // wrap around for cards behind

                // Only render the front card and up to 3 cards behind it
                if (offset > 3) return null;

                const isFront = offset === 0;

                return (
                  <motion.div
                    key={`${src}-${index}`}
                    initial={{
                      x: isFront ? -50 : offset * 14,
                      y: offset * 12,
                      scale: 1 - offset * 0.05,
                      rotate: offset * 4,
                      opacity: 0,
                      zIndex: 10 - offset
                    }}
                    animate={{
                      x: isFront ? 0 : offset * 14,
                      y: offset * 12,
                      scale: 1 - offset * 0.05,
                      rotate: offset * 4,
                      opacity: 1 - offset * 0.15,
                      zIndex: 10 - offset
                    }}
                    exit={{
                      x: -200,
                      opacity: 0,
                      rotate: -10,
                      transition: { duration: 0.4 }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    whileHover={isFront && displayHeroImages.length > 1 ? { scale: 1.02 } : {}}
                    whileTap={isFront && displayHeroImages.length > 1 ? { scale: 0.98 } : {}}
                    onTap={() => {
                      if (isFront && displayHeroImages.length > 1) {
                        nextSlide();
                      }
                    }}
                    className={`absolute inset-y-0 left-0 w-[calc(100%-2.5rem)] rounded-[2rem] overflow-hidden border-8 border-white shadow-[0_20px_50px_rgb(0,0,0,0.2)] bg-gray-100 ${isFront ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
                    style={{ transformOrigin: "bottom left" }}
                  >
                    <Image
                      src={src}
                      alt={`Hero Slide ${index + 1}`}
                      fill
                      className="object-cover pointer-events-none"
                      priority={isFront}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Wavy Line Divider */}
      <div className="w-full max-w-7xl mx-auto px-8 mb-32 flex items-center justify-center relative opacity-80">
        <svg className="w-full h-10" preserveAspectRatio="none" viewBox="0 0 1000 40" fill="none" stroke="#d5c8b5" strokeWidth="1.5">
          <path d="M0,20 C250,50 250,-10 500,20 C750,50 750,-10 1000,20" />
        </svg>
        <div className="absolute bg-[#fdfbf7] px-4 sm:px-8 text-[#8a755b] font-serif italic text-sm sm:text-lg lg:text-xl tracking-wide whitespace-nowrap">
          A lifetime of little moments ♡
        </div>
      </div>

      {/* 2. Animated Looping Ribbon Section */}
      <div className="w-full h-[460px] sm:h-[640px] lg:h-[900px] bg-[#fdfbf7] overflow-hidden relative group">

        {/* Left Text Content (Floating) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-8 md:top-20 left-5 sm:left-8 md:left-16 right-5 sm:right-auto z-30 max-w-xl pointer-events-none"
        >
          <div
            className={`inline-flex items-center gap-2 text-[#8a755b] text-xs font-bold uppercase tracking-[0.2em] mb-4 pointer-events-auto ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-2 -mx-2 transition-colors outline-none" : ""}`}
            contentEditable={!!onContentChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onContentChange?.('ribbonDate', e.currentTarget.textContent || "")}
          >
            {content?.ribbonDate || "Aug 02"}
          </div>
          <h2 className="text-5xl sm:text-6xl md:text-[9rem] font-serif font-black text-[#2c241b] tracking-tighter leading-[0.85] mb-6 md:mb-8 pointer-events-auto flex flex-col items-start gap-0 drop-shadow-sm">
            <span
              className={`${onContentChange ? "cursor-text hover:bg-black/5 rounded px-2 -mx-2 transition-colors outline-none block" : "block"}`}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning={true}
              onBlur={(e) => onContentChange?.('ribbonTitle1', e.currentTarget.textContent || "")}
            >
              {content?.ribbonTitle1 || "A Lifetime"}
            </span>
            <span 
              className={`font-handwriting text-6xl sm:text-8xl md:text-9xl lg:text-[13rem] text-[#c87b1e] italic mt-2 md:mt-4 block drop-shadow-lg leading-none ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-2 transition-colors outline-none pointer-events-auto" : ""}`}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning={true}
              onBlur={(e) => onContentChange?.('ribbonTitle2', e.currentTarget.textContent || "")}
            >
              {content?.ribbonTitle2 || "Of Love"}
            </span>
          </h2>
          <motion.p 
            className="mt-8 md:mt-16 text-sm md:text-lg text-[#5c4a3d] font-medium max-w-lg md:max-w-2xl px-4 bg-[#f8f6f3]/90 py-3 rounded-full backdrop-blur-sm shadow-sm"
            style={{ y: yLandscape }}
          >
            <span 
              className={`inline-block w-full ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-2 transition-colors outline-none pointer-events-auto" : ""}`}
              contentEditable={!!onContentChange}
              suppressContentEditableWarning={true}
              onBlur={(e) => onContentChange?.('ribbonDesc', e.currentTarget.textContent || "")}
            >
            {content?.ribbonDesc || "May every year bring you closer to everything you're chasing."}
            </span>
            </motion.p>
        </motion.div>

        {/* Full Screen Ribbon Animation */}
        <div className="absolute inset-0 w-full h-full flex justify-center">

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes ribbonMove {
              0% { offset-distance: 0%; }
              100% { offset-distance: 100%; }
            }
            .ribbon-outer {
              position: absolute;
              width: 80px;
              height: 80px;
              offset-path: path("M -1000 800 C 0 800, 500 700, 700 700 C 1000 700, 1000 100, 700 100 C 400 100, 400 700, 700 700 C 900 700, 1400 400, 2000 0");
              animation: ribbonMove 40s linear infinite;
              animation-delay: calc(-40s / var(--total) * var(--index));
              will-change: offset-distance;
              top: 0; left: 0;
              offset-rotate: auto 90deg;
            }
            @media (min-width: 768px) {
              .ribbon-outer { width: 112px; height: 112px; }
            }
            .ribbon-inner {
              width: 100%; height: 100%;
              border-radius: 2px;
              overflow: hidden;
              position: relative;
              filter: grayscale(100%);
              transition: filter 0.4s ease;
              pointer-events: auto;
              cursor: pointer;
            }
            .ribbon-inner:hover {
              filter: grayscale(0%);
              z-index: 50;
            }
            .ribbon-outer:hover {
              z-index: 50;
            }
          `}} />

          {/* Centered Track Container */}
          <div 
            className="relative w-[1000px] h-full ribbon-track scale-[0.42] sm:scale-[0.62] lg:scale-100"
            onMouseEnter={(e) => {
              const anims = e.currentTarget.getAnimations({ subtree: true });
              anims.forEach(anim => {
                if ((anim as any).animationName === 'ribbonMove') {
                  anim.playbackRate = 0.15; // Slow motion!
                }
              });
            }}
            onMouseLeave={(e) => {
              const anims = e.currentTarget.getAnimations({ subtree: true });
              anims.forEach(anim => {
                if ((anim as any).animationName === 'ribbonMove') {
                  anim.playbackRate = 1.0; // Normal speed
                }
              });
            }}
          >
            {(() => {
              const baseRibbonImages = images.filter(img => img.position === 1);
              let displayImages: any[] = [];

              if (baseRibbonImages.length > 0) {
                displayImages = [...baseRibbonImages];
                while (displayImages.length < 35) {
                  displayImages = [...displayImages, ...baseRibbonImages];
                }
              } else {
                displayImages = Array.from({ length: 35 }).map((_, idx) => ({ displayUrl: PLACEHOLDERS[1], id: `ph-${idx}` }));
              }

              return displayImages.map((img, i, arr) => (
                <div
                  key={`${img.id}-${i}`}
                  className="ribbon-outer"
                  style={{ '--total': arr.length, '--index': i } as any}
                >
                  <div
                    className="ribbon-inner cursor-pointer"
                    style={{ '--wave-index': i } as any}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      let originalIndex = images.findIndex(original => original.id === img.id);
                      if (originalIndex === -1) {
                        originalIndex = images.findIndex(original => original.url === img.url || original.displayUrl === img.displayUrl);
                      }
                      if (originalIndex !== -1) {
                        setLightboxIndex(originalIndex);
                      }
                    }}
                  >
                    <Image
                      src={img.displayUrl}
                      alt={`Ribbon photo ${i}`}
                      fill
                      className="object-cover pointer-events-none"
                    />
                  </div>
                </div>
              ));
            })()}

          </div>
        </div>
      </div>

      {/* 3. The Interactive Scrapbook (Replaces Cinematic Break) */}
      <ScrapbookViewer 
        images={scrapbookImages.length > 0 ? scrapbookImages : [PLACEHOLDERS[2], PLACEHOLDERS[3], PLACEHOLDERS[4], PLACEHOLDERS[1]]} 
        content={content} 
        onContentChange={onContentChange}
      />

      {/* 4. The Parallax Floating Stack (Replaces Sign-off Portrait) */}
      <FloatingParallaxStack images={slot4Images} content={content} onContentChange={onContentChange} />

    </div>
  );
}

// ---------------------------------------------------------
// Parallax Floating Stack Sub-Component
// ---------------------------------------------------------

const CARD_POSITIONS = [
  // 1. Center Hero (Most prominent)
  { top: "50%", left: "50%", rotate: 2, scale: 1.4, zIndex: 50, blur: 0, depth: 2.5 },
  // 2. Left Wing (Slightly behind, overlapping)
  { top: "48%", left: "35%", rotate: -8, scale: 1.1, zIndex: 40, blur: 0, depth: 1.8 },
  // 3. Right Wing (Slightly behind, overlapping)
  { top: "45%", left: "65%", rotate: 10, scale: 1.15, zIndex: 45, blur: 0, depth: 2.0 },
  // 4. Far Left
  { top: "55%", left: "20%", rotate: -15, scale: 0.9, zIndex: 30, blur: 1, depth: 1.2 },
  // 5. Far Right
  { top: "52%", left: "80%", rotate: 15, scale: 0.9, zIndex: 35, blur: 1, depth: 1.4 },
  // 6. Bottom Left
  { top: "70%", left: "30%", rotate: 8, scale: 0.8, zIndex: 32, blur: 1, depth: 1.3 },
  // 7. Bottom Right
  { top: "72%", left: "70%", rotate: -6, scale: 0.85, zIndex: 38, blur: 1, depth: 1.5 },
  // 8. Back Left Blurry
  { top: "40%", left: "15%", rotate: 12, scale: 0.6, zIndex: 20, blur: 3, depth: 0.8 },
  // 9. Back Right Blurry
  { top: "35%", left: "85%", rotate: -10, scale: 0.65, zIndex: 22, blur: 4, depth: 0.9 },
  // 10. Far Bottom Blurry
  { top: "85%", left: "45%", rotate: -15, scale: 0.5, zIndex: 15, blur: 5, depth: 0.5 },
  // 11. Far Top Blurry
  { top: "25%", left: "55%", rotate: 20, scale: 0.55, zIndex: 10, blur: 4, depth: 0.6 },
  // 12. Mid Back Left
  { top: "30%", left: "28%", rotate: -5, scale: 0.7, zIndex: 25, blur: 2, depth: 1.0 },
  // 13. Mid Back Right
  { top: "60%", left: "88%", rotate: 5, scale: 0.7, zIndex: 28, blur: 2, depth: 1.1 },
  // 14. Extreme Left
  { top: "65%", left: "8%", rotate: -18, scale: 0.45, zIndex: 5, blur: 6, depth: 0.3 },
  // 15. Extreme Right
  { top: "75%", left: "92%", rotate: 15, scale: 0.45, zIndex: 8, blur: 6, depth: 0.4 },
];

const ParallaxCard = ({ image, index, mouseX, mouseY, content, onContentChange }: any) => {
  const pos = CARD_POSITIONS[index] || CARD_POSITIONS[0];
  const [isHovered, setIsHovered] = useState(false);
  
  // Parallax physics based on depth
  const xOffset = useTransform(mouseX, (v: number) => v * pos.depth * 0.15);
  const yOffset = useTransform(mouseY, (v: number) => v * pos.depth * 0.15);
  
  // Smooth out the movement
  const springX = useSpring(xOffset, { stiffness: 50, damping: 20 });
  const springY = useSpring(yOffset, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute flex flex-col bg-[#f4ebd8] p-3 pb-12 shadow-2xl pointer-events-auto cursor-pointer"
      initial={{ scale: pos.scale, filter: `blur(${pos.blur}px)`, opacity: pos.blur > 3 ? 0.8 : 1 }}
      animate={{
        scale: isHovered ? pos.scale * 1.15 : pos.scale,
        filter: isHovered ? "blur(0px)" : `blur(${pos.blur}px)`,
        opacity: isHovered ? 1 : (pos.blur > 3 ? 0.8 : 1),
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        top: pos.top,
        left: pos.left,
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        rotate: pos.rotate,
        zIndex: isHovered ? 100 : pos.zIndex,
      }}
    >
      <div 
        className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}
      />
      <div className="relative w-56 aspect-[4/5] overflow-hidden bg-gray-200 pointer-events-none">
        <Image src={image} alt={`Parallax Memory ${index}`} fill className="object-cover" />
      </div>
      
      {/* Handwritten Text fades in if hovered or if it's already in the foreground */}
      <div className={`absolute bottom-3 left-0 right-0 text-center pointer-events-auto z-10 transition-opacity duration-300 ${pos.blur < 3 || isHovered ? "opacity-100" : "opacity-0"}`}>
        <span 
          className={`font-serif italic text-[#4a3b32] text-lg opacity-80 ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-1 transition-colors outline-none" : ""}`}
          contentEditable={!!onContentChange}
          suppressContentEditableWarning={true}
          onBlur={(e) => onContentChange?.(`parallaxCaption_${index}`, e.currentTarget.textContent || "")}
        >
          {content?.[`parallaxCaption_${index}`] || "A beautiful memory ♡"}
        </span>
      </div>
    </motion.div>
  );
};

const FloatingParallaxStack = ({ images, content, onContentChange }: { images: string[], content?: any, onContentChange?: (key: string, value: string) => void }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    mouseX.set(e.clientX - rect.left - centerX);
    mouseY.set(e.clientY - rect.top - centerY);
  };

  const safeImages = images && images.length > 0 ? images : [
    PLACEHOLDERS[2], PLACEHOLDERS[3], PLACEHOLDERS[4], PLACEHOLDERS[1], PLACEHOLDERS[2]
  ];

  return (
    <div 
      className="relative w-full h-[120vh] bg-[#2a2118] overflow-hidden flex items-center justify-center cursor-crosshair group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      {/* Background Cinematic Texture (Warm Wooden Desk) */}
      <div 
        className="absolute inset-0 opacity-60 mix-blend-overlay pointer-events-none transition-transform duration-[10s] ease-out group-hover:scale-105"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?q=80&w=2400')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(42,33,24,0.8)_100%)] pointer-events-none" />

      {/* Top Header */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center z-50 pointer-events-auto">
        <p className="text-[#a89b8d] tracking-[0.3em] text-xs font-bold uppercase mb-4">A Collection Of</p>
        <h2 
          className={`text-6xl md:text-8xl font-serif font-bold text-[#fdfbf7] tracking-tight mb-4 drop-shadow-2xl ${onContentChange ? "cursor-text hover:bg-white/10 rounded px-2 transition-colors outline-none" : ""}`}
          contentEditable={!!onContentChange}
          suppressContentEditableWarning={true}
          onBlur={(e) => onContentChange?.('parallaxMainTitle', e.currentTarget.textContent || "")}
        >
          {content?.parallaxMainTitle || "Memories"}
        </h2>
        <p 
          className={`font-serif italic text-xl text-[#d4c8b8] max-w-lg mx-auto ${onContentChange ? "cursor-text hover:bg-white/10 rounded px-2 transition-colors outline-none" : ""}`}
          contentEditable={!!onContentChange}
          suppressContentEditableWarning={true}
          onBlur={(e) => onContentChange?.('parallaxSubTitle', e.currentTarget.textContent || "")}
        >
          {content?.parallaxSubTitle || "Different moments. Same people. Always special."}
        </p>
      </div>

      {/* Floating Annotations */}
      <div className="absolute top-32 left-16 md:left-32 z-50 pointer-events-none opacity-0 md:opacity-80 transition-opacity duration-1000">
        <p className="font-serif italic text-[#fdfbf7] text-xl -rotate-6">Move your<br/>mouse around<br/>to explore</p>
        <svg className="w-16 h-16 text-[#fdfbf7] mt-2 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="m10 18 4-4-4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      <div className="absolute bottom-32 left-16 md:left-32 z-50 pointer-events-none opacity-0 md:opacity-80 transition-opacity duration-1000">
        <p className="font-serif italic text-[#fdfbf7] text-2xl -rotate-12">Collect<br/>moments<br/>Not Things<br/>♡</p>
      </div>

      <div className="absolute bottom-40 right-16 md:right-32 z-50 pointer-events-none opacity-0 md:opacity-80 transition-opacity duration-1000 text-right">
        <p className="font-serif italic text-[#fdfbf7] text-2xl rotate-6">Memories<br/>look better<br/>in layers<br/>♡</p>
      </div>

      {/* Mouse Icon indicator */}
      <div className="hidden md:flex absolute bottom-12 left-1/2 -translate-x-1/2 flex-col items-center gap-4 z-50 pointer-events-none opacity-60">
        <div className="w-6 h-10 border border-[#fdfbf7] rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-[#fdfbf7] rounded-full animate-bounce" />
        </div>
        <p className="text-[#fdfbf7] text-[10px] uppercase tracking-[0.2em] text-center">Move your mouse<br/>Feel the depth</p>
      </div>

      {/* The 3D Parallax Images */}
      <div className="absolute inset-0 perspective-1000">
        {safeImages.map((img, index) => (
          <ParallaxCard 
            key={`parallax-${index}`} 
            image={img} 
            index={index} 
            mouseX={mouseX} 
            mouseY={mouseY}
            content={content}
            onContentChange={onContentChange}
          />
        ))}
      </div>

    </div>
  );
};

// ---------------------------------------------------------
// Scrapbook Sub-Component
// ---------------------------------------------------------

const SCRAPBOOK_QUOTES = [
  "You are the stars in my dark and cold nights—shining and unwavering.",
  "May the flowers remind us why the rain was so necessary.",
  "Little pieces of life that make the big picture beautiful.",
  "A lifetime of little moments.",
  "Hold onto the memories, they will hold onto you.",
];

const STICKERS = ["⭐", "🎀", "✨", "🌸", "💌", "🦋", "🍄", "🧸"];

// ---------------------------------------------------------
// Flip Page
// ---------------------------------------------------------

const FlipPage = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => {
  return (
    <div
      ref={ref}
      data-density="soft"
      className="page relative w-full h-full overflow-hidden bg-white select-none"
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
});

FlipPage.displayName = "FlipPage";

// ---------------------------------------------------------
// Scrapbook Page
// ---------------------------------------------------------

function ScrapbookPage({
  isLeft,
  image,
  index,
  content,
  onContentChange
}: {
  isLeft: boolean;
  image: string;
  index: number;
  content?: any;
  onContentChange?: (key: string, value: string) => void;
}) {
  const spreadIndex = Math.floor(index / 2);

  const quoteIndex = spreadIndex % SCRAPBOOK_QUOTES.length;

  const sticker1 = STICKERS[spreadIndex % STICKERS.length];

  const sticker2 = STICKERS[(spreadIndex + 3) % STICKERS.length];

  // -------------------------------------------------------
  // LEFT PAGE
  // -------------------------------------------------------

  if (isLeft) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#e4ded0] shadow-inner select-none flex flex-col items-center justify-center">
        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
          }}
        />

        {/* Binding Rings (Left Half) */}
        <div className="absolute top-4 bottom-4 right-0 w-[14px] z-50 flex flex-col justify-between py-2 pointer-events-none drop-shadow-md">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`ring-l-${i}`} className="w-full h-2.5 bg-gradient-to-r from-[#666] via-[#bbb] to-[#ddd] rounded-l-full border-y border-l border-[#333] shadow-inner" />
          ))}
        </div>

        {/* Polaroid (Left Page) */}
        <div className="relative bg-[#f9f9f9] p-3 pb-10 shadow-xl rotate-[2deg] z-10 w-[75%] max-w-[320px] select-none pointer-events-none transition-transform duration-500 hover:rotate-0">
          <div className="relative w-full aspect-square bg-gray-200 overflow-hidden border border-gray-100">
            <Image
              src={image}
              alt="Scrapbook memory"
              fill
              draggable={false}
              priority={index < 2}
              className="object-cover"
            />
          </div>
          {/* Top tape */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-[#e0d6c8] opacity-70 rotate-[-1deg] shadow-sm" />
        </div>

        {/* Taped Note (Left Page) */}
        <div className="mt-8 bg-[#dfcfbd] px-6 py-4 shadow-sm -rotate-1 relative z-10 w-[80%] max-w-[320px] pointer-events-auto">
          {/* Tape */}
          <div className="absolute -top-2 -left-2 w-10 h-4 bg-[#e0d6c8] opacity-70 rotate-[30deg] shadow-sm pointer-events-none" />
          <div className="absolute -top-2 -right-2 w-10 h-4 bg-[#e0d6c8] opacity-70 rotate-[-30deg] shadow-sm pointer-events-none" />

          <h3
            className={`font-serif italic font-bold text-sm text-[#4a3b32] mb-1 ${onContentChange ? "cursor-text hover:bg-black/5 rounded outline-none transition-colors" : ""}`}
            contentEditable={!!onContentChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onContentChange?.(`scrapbookTitle_${index}`, e.currentTarget.textContent || "")}
          >
            {content?.[`scrapbookTitle_${index}`] || "A Memory to Keep"}
          </h3>
          <p
            className={`font-serif text-sm text-[#5c4a3d] leading-snug ${onContentChange ? "cursor-text hover:bg-black/5 rounded outline-none transition-colors" : ""}`}
            contentEditable={!!onContentChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onContentChange?.(`scrapbookDesc_${index}`, e.currentTarget.textContent || "")}
          >
            {content?.[`scrapbookDesc_${index}`] || `"You are the stars in my dark and cold nights—shining and unwavering."`}
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // RIGHT PAGE
  // -------------------------------------------------------

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fbfbfa] shadow-inner select-none flex flex-col items-center justify-center">
      {/* Grid paper texture */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: "linear-gradient(transparent 19px, #a39b8f 20px), linear-gradient(90deg, transparent 19px, #a39b8f 20px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Paper grain */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
        }}
      />

      {/* Binding Rings (Right Half) */}
      <div className="absolute top-4 bottom-4 left-0 w-[14px] z-50 flex flex-col justify-between py-2 pointer-events-none drop-shadow-md">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={`ring-r-${i}`} className="w-full h-2.5 bg-gradient-to-l from-[#666] via-[#bbb] to-[#ddd] rounded-r-full border-y border-r border-[#333] shadow-inner" />
        ))}
      </div>

      {/* Polaroid (Right Page) */}
      <div className="relative bg-[#f9f9f9] p-3 pb-12 shadow-2xl rotate-[-3deg] z-10 w-[75%] max-w-[300px] ml-6 mt-8 select-none pointer-events-none transition-transform duration-500 hover:rotate-0">
        <div className="relative w-full aspect-[4/5] bg-gray-200 overflow-hidden border border-gray-100">
          <Image
            src={image}
            alt="Scrapbook memory"
            fill
            draggable={false}
            priority={index < 2}
            className="object-cover"
          />
        </div>

        {/* Diagonal Tape */}
        <div className="absolute -top-3 -right-3 w-12 h-5 bg-[#e0d6c8] opacity-70 rotate-45 shadow-sm" />
        <div className="absolute -bottom-3 -left-3 w-12 h-5 bg-[#e0d6c8] opacity-70 rotate-45 shadow-sm" />
      </div>

      {/* Stickers */}
      <div className="absolute top-12 left-16 text-2xl rotate-12 drop-shadow-md z-20 pointer-events-none opacity-80">
        ⭐
      </div>
      <div className="absolute bottom-20 left-12 text-3xl -rotate-12 drop-shadow-md z-20 pointer-events-none opacity-90">
        🌸
      </div>

      {/* Bottom Message (Right Page) */}
      <div
        className={`absolute bottom-8 right-8 font-serif italic font-medium text-[#c05e5e] text-lg -rotate-3 pointer-events-auto ${onContentChange ? "cursor-text hover:bg-black/5 rounded outline-none transition-colors" : ""}`}
        contentEditable={!!onContentChange}
        suppressContentEditableWarning={true}
        onBlur={(e) => onContentChange?.(`scrapbookRightMsg_${index}`, e.currentTarget.textContent || "")}
      >
        {content?.[`scrapbookRightMsg_${index}`] || "~ Unforgettable ~"}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Scrapbook Viewer
// ---------------------------------------------------------

const ScrapbookViewer = React.memo(function ScrapbookViewer({ images, content, onContentChange }: { images: string[], content?: any, onContentChange?: (key: string, value: string) => void }) {
  const [FlipBook, setFlipBook] = useState<any>(null);
  const flipBookRef = useRef<any>(null);

  /* A two-page spread needs room for two pages side by side. Below that the book
     runs single-page instead of overflowing — same book, same pages, one at a
     time. Starts true so the server and first client paint agree. */
  const [spread, setSpread] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setSpread(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    import("react-pageflip").then((mod) => {
      setFlipBook(() => mod.default);
    });
  }, []);

  const fallbackImage = "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=1954";
  const safeImages = images && images.length > 0 ? images : [fallbackImage];
  let paddedImages = [...safeImages];

  // Ensure we have at least 4 pages so there is actually something to flip to!
  // If we only have 2 pages, the book opens to the only spread and cannot flip forward.
  while (paddedImages.length < 4) {
    paddedImages.push(fallbackImage);
  }

  if (paddedImages.length % 2 !== 0) {
    paddedImages.push(fallbackImage);
  }

  const handleNext = () => flipBookRef.current?.pageFlip()?.flipNext();
  const handlePrevious = () => flipBookRef.current?.pageFlip()?.flipPrev();

  if (!FlipBook) {
    return (
      <div className="w-full relative py-32 flex justify-center items-center h-[500px]">
        <div className="animate-pulse text-white/50">Loading Scrapbook...</div>
      </div>
    );
  }

  return (
    <div className="w-full relative py-32 bg-[#fdfbf7] overflow-hidden mb-40 scrapbook-flipbook-wrapper">
      
      {/* Background Doodles */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-60">
        {/* Top left heart */}
        <svg className="absolute top-10 left-10 w-20 h-20 text-[#cbb59c] -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50,85 C50,85 15,55 15,35 C15,20 30,15 40,25 C50,35 50,35 50,35 C50,35 50,35 60,25 C70,15 85,20 85,35 C85,55 50,85 50,85 Z" />
        </svg>

        {/* Top right stars */}
        <svg className="absolute top-20 right-20 w-16 h-16 text-[#cbb59c] rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z" />
          <path d="M20,20 L25,30 L35,35 L25,40 L20,50 L15,40 L5,35 L15,30 Z" className="scale-50 origin-center translate-x-8 -translate-y-8" />
        </svg>

        {/* Bottom left swirl */}
        <svg className="absolute bottom-20 left-[15%] w-24 h-24 text-[#cbb59c] rotate-45" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10,50 Q25,10 40,50 T70,50 T95,30" />
        </svg>

        {/* Bottom right paper plane */}
        <svg className="absolute bottom-10 right-[10%] w-24 h-24 text-[#cbb59c] -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10,50 L90,10 L50,90 L40,60 Z" />
          <path d="M40,60 L55,45" />
          <path d="M10,50 Q30,60 50,90" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="relative w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row items-center lg:items-center gap-12 lg:gap-32 xl:gap-40 px-4 md:px-12 z-10">

        {/* Editable Header for Scrapbook Section (Left Side) */}
        <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f4ebd8] text-[#8a755b] rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="fill-[#8a755b]"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            Interactive Scrapbook
          </div>
          <h2
            className={`text-5xl lg:text-6xl font-serif font-bold text-[#2c241b] tracking-tight mb-6 leading-tight ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-2 -mx-2 transition-colors outline-none block" : "block"}`}
            contentEditable={!!onContentChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onContentChange?.('scrapbookSectionTitle', e.currentTarget.textContent || "")}
          >
            {content?.scrapbookSectionTitle || "Flip Through Our Memories"}
          </h2>
          <p
            className={`text-lg text-[#5a4d41] font-medium leading-relaxed ${onContentChange ? "cursor-text hover:bg-black/5 rounded px-2 -mx-2 transition-colors outline-none block" : "block"}`}
            contentEditable={!!onContentChange}
            suppressContentEditableWarning={true}
            onBlur={(e) => onContentChange?.('scrapbookSectionDesc', e.currentTarget.textContent || "")}
          >
            {content?.scrapbookSectionDesc || "Turn the pages below to explore some of the most precious moments we've captured together."}
          </p>
        </div>

        {/* The Scrapbook Flipbook (Right Side) */}
        <div className="w-full lg:w-2/3 relative flex justify-center items-center">
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Previous page"
            className="absolute left-0 sm:-left-4 lg:-left-8 top-1/2 -translate-y-1/2 w-12 h-12 z-[100] flex items-center justify-center outline-none group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </div>
          </button>

          {/* The aspect ratio wrapper keeps the book responsive while maintaining 10/7 layout */}
          <div className={`relative w-full max-w-[900px] z-10 ${spread ? "aspect-[10/7]" : "aspect-[5/7] max-w-[320px]"}`}>

            <div
              className="absolute inset-0 z-10 select-none flex justify-center items-center"
              /* pan-y on touch: sideways swipes flip pages, vertical still scrolls
                 the page. "none" here used to swallow both and strand the reader. */
              style={{ touchAction: spread ? "none" : "pan-y", overscrollBehavior: "none" }}
            >
              <FlipBook
                key={`${paddedImages.join(',')}-${spread ? "spread" : "single"}`}
                ref={flipBookRef}
                width={450}
                height={630}
                size="stretch"
                minWidth={spread ? 300 : 220}
                maxWidth={450}
                minHeight={spread ? 400 : 300}
                maxHeight={630}
                showCover={false}
                usePortrait={!spread}
                useMouseEvents={true}
                mobileScrollSupport={!spread}
                clickEventForward={true}
                flippingTime={1000}
                drawShadow={true}
                maxShadowOpacity={0.5}
                className="scrapbook-flipbook mx-auto select-none drop-shadow-2xl"
              >
                {paddedImages.map((img, i) => (
                  <FlipPage key={`scrapbook-page-${i}`}>
                    <ScrapbookPage isLeft={i % 2 === 0} image={img} index={i} content={content} onContentChange={onContentChange} />
                  </FlipPage>
                ))}
              </FlipBook>
            </div>

            {/* Center Binding Shadow */}
            {spread && <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 z-30 pointer-events-none bg-gradient-to-r from-black/10 via-black/30 to-black/10 mix-blend-multiply" />}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next page"
            className="absolute right-0 sm:-right-4 lg:-right-8 top-1/2 -translate-y-1/2 w-12 h-12 z-[100] flex items-center justify-center outline-none group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </div>
          </button>
        </div> {/* Closes w-full lg:w-2/3 Right Side wrapper */}
      </div> {/* Closes max-w-[1400px] flex-row wrapper */}

    </div>
  );
});
