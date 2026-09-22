"use client";

/* The Memory Lane loading screen: brand, a scrolling filmstrip of memories, a progress bar.
   Two modes:
   - "loading" (default): shown by app/loading.tsx while a page's data is fetched. The bar
     sweeps until the page is ready, so it never pretends to know how long that takes.
   - "intro": the once-per-session curtain on the home page. The bar fills over `duration`
     seconds, then the screen fades away. */

const LOADER_IMAGES = [
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1500835556837-99ac94a94552", // Travel
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511795409834-ef04bbd61622", // Event/Party
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1511895426328-dc8714191300", // Friends/Family
  "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_800/memory_lane/stock/photo-1469474968028-56623f02e42e", // Nature
];

// Duplicate for seamless infinite scrolling
const FILMSTRIP_IMAGES = [...LOADER_IMAGES, ...LOADER_IMAGES];

export default function GlobalLoader({ mode = "loading", duration = 2.6 }: { mode?: "loading" | "intro"; duration?: number }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f6f3] flex flex-col items-center justify-center p-4" role="status" aria-live="polite" aria-label="Loading Memory Lane">
      {/* Injecting CSS Keyframes directly so it runs without React hydration */}
      <style>{`
        @keyframes fillBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes sweepBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes scrollFilmstrip {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ml-loader-strip { animation-duration: 60s !important; }
        }
      `}</style>

      {/* Paper grain, like the login page */}
      <div className="absolute inset-0 opacity-50 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")' }} />

      <div className="w-full flex flex-col items-center justify-center h-full relative overflow-hidden">
        {/* Brand Header */}
        <div className="absolute top-10 md:top-12 left-0 right-0 w-full flex justify-center z-50 pointer-events-none">
          <span
            className="font-serif italic font-bold text-4xl sm:text-5xl md:text-7xl text-[#1c1917] drop-shadow-sm tracking-tight"
            style={{ animation: "pulseText 3s infinite ease-in-out" }}
          >
            Memory Lane
          </span>
        </div>

        {/* Full-width Cinematic Filmstrip Area */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-36 md:h-56 overflow-hidden bg-[#1c1917]/5 shadow-2xl">
          {/* sprocket holes */}
          <div className="absolute inset-x-0 top-0 h-2 md:h-3 bg-[repeating-linear-gradient(90deg,#1c1917_0_10px,transparent_10px_22px)] opacity-20" />
          <div className="absolute inset-x-0 bottom-0 h-2 md:h-3 bg-[repeating-linear-gradient(90deg,#1c1917_0_10px,transparent_10px_22px)] opacity-20" />

          {/* Scrolling Track */}
          <div className="ml-loader-strip flex h-full w-max py-2 md:py-3" style={{ animation: "scrollFilmstrip 20s linear infinite" }}>
            {FILMSTRIP_IMAGES.map((src, index) => (
              <div key={index} className="h-full aspect-video p-1 md:p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl shadow-md sepia-[.15]" />
              </div>
            ))}
          </div>

          {/* Cinematic Vignette Overlay */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.3)] z-10 pointer-events-none" />
          {/* Edge Fades for smooth entry/exit */}
          <div className="absolute inset-y-0 left-0 w-20 md:w-32 bg-gradient-to-r from-[#f8f6f3] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 md:w-32 bg-gradient-to-l from-[#f8f6f3] to-transparent z-10 pointer-events-none" />
        </div>

        {/* Loading Text and Progress Bar, anchored just under the filmstrip */}
        <div className="absolute inset-x-0 top-[calc(50%+5.5rem)] md:top-[calc(50%+8.5rem)] z-20 flex flex-col items-center">
          <h2 className="font-serif italic text-2xl md:text-3xl text-[#1c1917] mb-2 tracking-wide" style={{ animation: "pulseText 2s infinite ease-in-out" }}>
            Gathering Memories...
          </h2>
          <p className="font-handwriting text-[#8a755b] text-xl md:text-2xl mb-8">
            Almost there
          </p>

          {/* Progress Bar */}
          <div className="w-56 sm:w-64 md:w-96 h-1.5 bg-[#e8e0d5] rounded-full overflow-hidden shadow-inner">
            {mode === "intro" ? (
              <div className="h-full bg-[#1c1917] rounded-full" style={{ animation: `fillBar ${duration}s cubic-bezier(0.22, 1, 0.36, 1) forwards` }} />
            ) : (
              <div className="h-full w-1/3 bg-[#1c1917] rounded-full" style={{ animation: "sweepBar 1.4s ease-in-out infinite" }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
