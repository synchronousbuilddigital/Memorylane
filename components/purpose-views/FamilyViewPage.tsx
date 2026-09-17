"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FamilyClassicLayout from "./FamilyClassicLayout";
import FamilyMosaicLayout from "./FamilyMosaicLayout";

const TheaterCurtainLoader = () => {
  const [stage, setStage] = useState<"loading" | "opening" | "done">("loading");

  useEffect(() => {
    // Wait 1.5s reading the text, then trigger opening
    const timer = setTimeout(() => setStage("opening"), 1500);
    // Remove from DOM after opening finishes (1.5s animation)
    const cleanup = setTimeout(() => setStage("done"), 3500);
    return () => {
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, []);

  if (stage === "done") return null;

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden pointer-events-none">
      {/* Left Curtain */}
      <motion.div 
        className="h-full w-1/2 bg-[#3e2723] z-20 relative overflow-hidden border-r-2 border-[#5d4037]"
        initial={{ x: "0%" }}
        animate={{ x: stage === "opening" ? "-100%" : "0%" }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1] }}
        style={{ boxShadow: "10px 0 30px rgba(0,0,0,0.6)" }}
      >
        <div className="absolute inset-0 opacity-20 mix-blend-multiply" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/woven-light.png')" }} />
      </motion.div>

      {/* Right Curtain */}
      <motion.div 
        className="h-full w-1/2 bg-[#3e2723] z-20 relative overflow-hidden border-l-2 border-[#5d4037]"
        initial={{ x: "0%" }}
        animate={{ x: stage === "opening" ? "100%" : "0%" }}
        transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1] }}
        style={{ boxShadow: "-10px 0 30px rgba(0,0,0,0.6)" }}
      >
        <div className="absolute inset-0 opacity-20 mix-blend-multiply" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/woven-light.png')" }} />
      </motion.div>

      {/* Center Lock / Text Overlay */}
      <AnimatePresence>
        {stage === "loading" && (
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none"
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 rounded-full border border-[#d4af37]/30 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-[#d4af37]/5 rounded-full blur-md" />
              <Heart size={32} className="text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]" strokeWidth={1} />
            </div>
            <h2 className="font-serif italic text-3xl md:text-5xl text-[#d4af37] tracking-wider drop-shadow-md">
              Unveiling Memories...
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FamilyViewPage({ section }: { section: any }) {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#3e362e] selection:bg-amber-100 overflow-x-hidden font-sans">
      <TheaterCurtainLoader />
      
      {section.customCssUrl && (
        <link rel="stylesheet" href={section.customCssUrl} />
      )}

      {/* Classic Navbar */}
      <nav className="w-full px-8 py-6 flex justify-between items-center relative z-50">
        <Link href="/" className="font-serif italic text-2xl tracking-tight text-[#2c241b]">
          Memory Lane
        </Link>
        <Link 
          href="/login" 
          className="text-sm font-semibold tracking-widest uppercase border border-[#e0d6c8] px-6 py-2 rounded-full hover:bg-[#3e362e] hover:text-[#fdfbf7] transition-all"
        >
          Create Your Own
        </Link>
      </nav>

      {/* Warm Hero Section - Only show for mosaic, since classic handles it internally */}
      {section.theme === "family-mosaic" && (
        <div className="max-w-4xl mx-auto px-8 pt-12 pb-20 text-center relative z-40">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f4ebd8] text-[#8a755b] rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Heart size={12} className="fill-[#8a755b]" />
            Family Album
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#2c241b] tracking-tight mb-6 drop-shadow-sm">
            {section.title}
          </h1>
          
          <p className="text-lg md:text-xl text-[#5a4d41] font-medium leading-relaxed max-w-2xl mx-auto">
            {section.description || "These are some of my favorite moments with family — little pieces of life that make the big picture beautiful."}
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm font-semibold text-[#8a755b] uppercase tracking-widest">
            <span className="flex items-center gap-2"><Camera size={16} /> {section.images?.length || 0} Memories</span>
            <span>•</span>
            <span>{new Date(section.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      )}

      {/* The Gallery Container */}
      <div className="w-full relative z-30">
        {section.theme === "family-mosaic" ? (
          <FamilyMosaicLayout images={section.images || []} />
        ) : (
          <FamilyClassicLayout 
            images={section.images || []} 
            title={section.title} 
            description={section.description} 
          />
        )}
      </div>
    </div>
  );
}
