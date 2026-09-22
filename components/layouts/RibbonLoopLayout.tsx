"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "framer-motion";
import ImageCard from "@/components/ImageCard";

import { Image as PrismaImage } from "@prisma/client";

interface RibbonLoopLayoutProps {
  images: PrismaImage[];
}

export default function RibbonLoopLayout({ images }: RibbonLoopLayoutProps) {
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [isHovered, setIsHovered] = useState(false);
  const time = useMotionValue(0);

  useEffect(() => {
    const updateDims = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, []);

  // Drive the animation automatically!
  useAnimationFrame((t, delta) => {
    if (!isHovered) {
      // Slowly increment the progress. 0.0005 * 16ms = 0.008 per frame.
      // It takes about 10 seconds for an image to complete the entire loop.
      time.set(time.get() + delta * 0.0005);
    }
  });

  return (
    <div 
      className="w-[100vw] h-[85vh] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-transparent mt-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
        
        {/* We calculate how many items are needed to fill the infinite track */}
        {Array.from({ length: 75 }).map((_, i) => {
          // If the user has 5 images, we cycle through them continuously 
          // to create an unbroken train of photos!
          const image = images[i % images.length];
          return (
            <RibbonItem 
              key={`${image.id}-${i}`} 
              image={image} 
              index={i} 
              time={time}
              dimensions={dimensions}
            />
          );
        })}

        {/* Optional helper overlay */}
        <div className="absolute bottom-10 text-gray-500 font-bold uppercase tracking-widest text-sm pointer-events-none animate-pulse">
          {isHovered ? "Paused to view" : "Hover to pause the ride"}
        </div>
      </div>
    </div>
  );
}

// Separate component to handle individual hooks
function RibbonItem({ 
  image, 
  index, 
  time,
  dimensions 
}: { 
  image: PrismaImage, 
  index: number, 
  time: any,
  dimensions: { width: number, height: number }
}) {
  // A mathematically perfect Gaussian-damped Cycloid!
  // This creates a completely flat horizontal line that seamlessly swells 
  // into a beautiful loop in the exact center, then flattens out again.
  const T_START = -10;
  const T_END = 10;
  const T_LENGTH = T_END - T_START; // 20
  
  // Total virtual items on the infinite track
  const TOTAL_ITEMS = 75;
  const SPACING = T_LENGTH / TOTAL_ITEMS;
  
  // localT loops seamlessly from -10 to 10
  const localT = useTransform(time, (tVal: number) => {
    const absoluteT = tVal + (index * SPACING);
    let wrapped = absoluteT % T_LENGTH;
    if (wrapped < 0) wrapped += T_LENGTH;
    return T_START + wrapped;
  });

  // Track shape parameters
  const R = dimensions.width * 0.2; // Horizontal stretch (speed)
  const A = Math.min(dimensions.height * 0.45, 400); // Loop radius (amplitude)

  const x = useTransform(localT, (t: number) => {
    // x(t) = R*t - A * exp(-(t/2.5)^2) * sin(t)
    const expTerm = Math.exp(-Math.pow(t / 2.5, 2));
    return R * t - A * expTerm * Math.sin(t);
  });

  const y = useTransform(localT, (t: number) => {
    // y(t) = -A * exp(-(t/2.5)^2) * cos(t)
    // Negative Y goes UP in screen coords, so the loop goes up!
    const expTerm = Math.exp(-Math.pow(t / 2.5, 2));
    // Offset slightly down so the horizontal tails sit lower on screen
    return -A * expTerm * Math.cos(t) + 100;
  });

  // Calculate perfect 3D banking rotation!
  const rotate = useTransform(localT, (t: number) => {
    const expTerm = Math.exp(-Math.pow(t / 2.5, 2));
    const factor = -2 * t / Math.pow(2.5, 2); // Derivative of the Gaussian exponent
    
    // dx/dt and dy/dt
    const dx = R - A * (expTerm * Math.cos(t) + factor * expTerm * Math.sin(t));
    const dy = -A * (-expTerm * Math.sin(t) + factor * expTerm * Math.cos(t));
    
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle * 0.6; // Scale down banking so photos are easier to read
  });

  // 3D Depth Scale: The top of the loop (y is negative) goes back into the screen
  const scale = useTransform(y, (yVal: number) => {
    return 1.0 + ((yVal - 100) / 2000); 
  });
  
  // Z-index: The exit of the loop naturally crosses OVER the entrance
  const zIndex = useTransform(localT, (t: number) => {
    return Math.round(t * 100) + 10000;
  });

  // Opacity: Fade out smoothly at the horizontal extremes
  const opacity = useTransform(localT, (t: number) => {
    const fadeRange = 2.0;
    if (t < T_START + fadeRange) return (t - T_START) / fadeRange;
    if (t > T_END - fadeRange) return (T_END - t) / fadeRange;
    return 1;
  });

  return (
    <motion.div
      className="absolute flex items-center justify-center will-change-transform"
      style={{
        x,
        y,
        rotate,
        scale,
        zIndex,
        opacity
      }}
    >
      <div className="w-40 h-48 shadow-[0_10px_40px_rgb(0,0,0,0.5)] rounded-lg pointer-events-auto">
        <ImageCard image={image} index={index} layoutType="filmstrip" />
      </div>
    </motion.div>
  );
}
