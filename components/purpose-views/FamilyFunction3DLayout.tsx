"use client";

import React from "react";
import FamilyFunctionFilmstripLayout from "./FamilyFunctionFilmstripLayout";
import FamilyFunctionHallwayGallery from "./FamilyFunctionHallwayGallery";
import FamilyFunctionMovieProjector from "./FamilyFunctionMovieProjector";

export default function FamilyFunction3DLayout({
  images = [],
  title = "Our Family",
  description = "A lifetime of beautiful moments.",
  onTitleChange,
  onDescriptionChange,
}: any) {
  // Each slot gets its own position-based images (matched to dbPosition in FixedSlotEditor)
  const slot1Imgs = images.filter((img: any) => img.position === 0);
  const slot2Imgs = images.filter((img: any) => img.position === 1);
  const slot3Imgs = images.filter((img: any) => img.position === 2);

  return (
    <div className="w-full">
      {/* ── SECTION 1: 3D Spiraling Filmstrip ── */}
      <section className="w-full h-screen">
        <FamilyFunctionFilmstripLayout
          images={slot1Imgs}
          title={title}
          description={description}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
        />
      </section>

      {/* ── SECTION 2: 3D Hallway Gallery — split layout ── */}
      <section className="w-full h-screen flex overflow-hidden" style={{ background: '#1e0e05' }}>

        {/* LEFT PANEL: Title + description + notes */}
        <div className="relative flex flex-col justify-center h-full px-10 md:px-14 flex-shrink-0" style={{ width: '36%', background: 'linear-gradient(135deg, #160a03 0%, #2a1208 60%, #3a1a0a 100%)' }}>
          {/* Decorative top-left accent */}
          <div className="absolute top-8 left-10 flex items-center gap-2 opacity-50">
            <div className="w-6 h-[1px] bg-amber-400" />
            <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-amber-400">Family Gallery</span>
          </div>

          <div>
            <h2
              className="font-serif font-extrabold leading-tight text-white mb-5"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 4rem)', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}
            >
              Walk Through<br />Our Memories
            </h2>
            <p className="text-amber-200/70 font-sans text-sm leading-relaxed mb-8 max-w-xs">
              Every photograph on these walls is a real moment — a laugh, a celebration, a quiet afternoon together. Walk through and let the memories come alive.
            </p>

            {/* Memory notes / captions */}
            <div className="space-y-3">
              {['Family is everything ♡', 'Every moment matters', 'Together is our favourite place'].map((note, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <p className="text-amber-100/60 text-xs font-serif italic">{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-10 flex items-center gap-2 text-white/30">
            <span className="text-[9px] tracking-[0.3em] uppercase font-bold">Scroll to continue</span>
            <div className="w-8 h-[1px] bg-white/20" />
          </div>

          {/* Decorative vertical line */}
          <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-gradient-to-b from-transparent via-amber-700/40 to-transparent" />
        </div>

        {/* RIGHT PANEL: The 3D Hallway Gallery */}
        <div className="flex-1 h-full overflow-hidden">
          <FamilyFunctionHallwayGallery images={slot2Imgs} />
        </div>
      </section>

      {/* ── SECTION 3: 3D Vintage Family Movie Projector ── */}
      <section className="w-full h-screen">
        <FamilyFunctionMovieProjector images={slot3Imgs} />
      </section>
    </div>
  );
}
