"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plane, Calendar } from "lucide-react";
import Image from "next/image";

const BANNERS = [
  {
    id: "family",
    title: "Family Memories",
    subtitle: "A warm, nostalgic scrapbook for your loved ones. Featuring hanging polaroids and cinematic opening curtains.",
    icon: Heart,
    bgImage: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2400/memory_lane/stock/photo-1511895426328-dc8714191300",
    color: "from-amber-900/90 to-amber-950/90",
    accent: "text-amber-200",
    font: "font-serif italic"
  },
  {
    id: "travel",
    title: "Travel & Adventures",
    subtitle: "Build a cinematic filmstrip of your journeys. Smooth scrolling, massive photography, and interactive maps.",
    icon: Plane,
    bgImage: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2400/memory_lane/stock/photo-1436491865332-7a61a109cc05",
    color: "from-blue-900/90 to-indigo-950/90",
    accent: "text-blue-200",
    font: "font-sans font-bold"
  },
  {
    id: "event",
    title: "Events & Celebrations",
    subtitle: "Toss together a fun, chaotic polaroid pile from the party. Interactive physics and bouncy animations.",
    icon: Calendar,
    bgImage: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2400/memory_lane/stock/photo-1511795409834-ef04bbd61622",
    color: "from-purple-900/90 to-fuchsia-950/90",
    accent: "text-purple-200",
    font: "font-sans font-extrabold"
  }
];

export default function DashboardBannerSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[320px] md:h-[400px] rounded-3xl overflow-hidden relative shadow-2xl mb-12">
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image with slow zoom effect */}
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 10, ease: "linear" }}
          >
            <Image 
              src={BANNERS[currentIndex].bgImage}
              alt={BANNERS[currentIndex].title}
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${BANNERS[currentIndex].color} mix-blend-multiply`} />
          <div className="absolute inset-0 bg-black/20" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24 text-white z-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className={`p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 ${BANNERS[currentIndex].accent}`}>
                {(() => {
                  const Icon = BANNERS[currentIndex].icon;
                  return <Icon size={24} />;
                })()}
              </div>
              <span className={`text-sm font-bold tracking-widest uppercase ${BANNERS[currentIndex].accent}`}>
                Featured Template
              </span>
            </motion.div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className={`text-5xl md:text-7xl tracking-tight mb-6 drop-shadow-lg ${BANNERS[currentIndex].font}`}
            >
              {BANNERS[currentIndex].title}
            </motion.h2>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="text-lg md:text-2xl text-white/90 max-w-2xl leading-relaxed"
            >
              {BANNERS[currentIndex].subtitle}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-12 md:left-24 flex gap-4 z-20">
        {BANNERS.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="group/btn relative h-1.5 w-16 bg-white/30 rounded-full overflow-hidden hover:bg-white/50 transition-colors"
          >
            {currentIndex === idx && (
              <motion.div 
                key={`progress-${idx}`}
                className="absolute inset-0 bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
