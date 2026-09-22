"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slideImages = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2070/memory_lane/stock/photo-1475924156734-496f6cac6ec1",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2070/memory_lane/stock/photo-1550684848-fac1c5b4e853",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2070/memory_lane/stock/photo-1493246507139-91e8fad9978e",
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_2070/memory_lane/stock/photo-1476514525535-07fb3b4ae5f1"
];

export default function LoginSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideImages.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={slideImages[currentIndex]}
          alt="Memory Lane Aesthetic"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.8, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
}
