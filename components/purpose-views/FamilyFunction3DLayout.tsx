"use client";

import React from "react";
import FamilyFunctionFilmstripLayout from "./FamilyFunctionFilmstripLayout";
import FamilyFunctionHallwayGallery from "./FamilyFunctionHallwayGallery";
import FamilyFunctionMovieProjector from "./FamilyFunctionMovieProjector";
import FamilyFunctionFlipCubeWall from "./FamilyFunctionFlipCubeWall";
import { FF_TEXT_FIELDS, parseContent, textOf, lines } from "./familyFunctionText";

export default function FamilyFunction3DLayout({
  images = [],
  title = "Our Family",
  description = "A lifetime of beautiful moments.",
  onTitleChange,
  onDescriptionChange,
  content,
}: any) {
  // Editable words for each section (defaults when nothing has been written yet)
  const c = parseContent(content);
  const t = (key: string) => {
    const f = [...FF_TEXT_FIELDS.hall, ...FF_TEXT_FIELDS.projector, ...FF_TEXT_FIELDS.wall].find((x) => x.key === key)!;
    return textOf(c, key, f.defaultValue);
  };
  const hallNotes = ["hall.note1", "hall.note2", "hall.note3"].map(t).filter((n) => n.trim().length > 0);
  // Each slot gets its own position-based images (matched to dbPosition in FixedSlotEditor)
  const slot1Imgs = images.filter((img: any) => img.position === 0);
  const slot2Imgs = images.filter((img: any) => img.position === 1);
  const slot3Imgs = images.filter((img: any) => img.position === 2);
  const slot4Imgs = images.filter((img: any) => img.position === 3);

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

      {/* ── SECTION 2: 3D Hallway Gallery — split layout (scrolling over the 3D pane walks the hall) ── */}
      <section className="w-full min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: '#1e0e05' }}>

        {/* LEFT PANEL: Title + description + notes.
            Below lg this becomes a band above the hallway rather than a column
            beside it — a 36% column on a phone left ~60px of usable text width. */}
        <div className="relative flex flex-col justify-center w-full lg:w-[36%] h-auto lg:h-full px-6 sm:px-10 md:px-14 py-12 lg:py-0 lg:flex-shrink-0" style={{ background: 'linear-gradient(135deg, #160a03 0%, #2a1208 60%, #3a1a0a 100%)' }}>
          {/* Decorative top-left accent */}
          <div className="relative mb-5 lg:mb-0 lg:absolute lg:top-8 lg:left-10 flex items-center gap-2 opacity-50">
            <div className="w-6 h-[1px] bg-amber-400" />
            <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-amber-400">{t("hall.label")}</span>
          </div>

          <div>
            <h2
              className="font-serif font-extrabold leading-tight text-white mb-5"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 4rem)', textShadow: '0 4px 20px rgba(0,0,0,0.9)' }}
            >
              {lines(t("hall.heading")).map((line, i) => (
                <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
              ))}
            </h2>
            <p className="text-amber-200/70 font-sans text-sm leading-relaxed mb-8 max-w-lg lg:max-w-xs whitespace-pre-line">
              {t("hall.body")}
            </p>

            {/* Memory notes / captions */}
            <div className="space-y-3">
              {hallNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  <p className="text-amber-100/60 text-xs font-serif italic">{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="relative mt-8 lg:mt-0 lg:absolute lg:bottom-8 lg:left-10 flex items-center gap-2 text-white/30">
            <span className="text-[9px] tracking-[0.3em] uppercase font-bold">Scroll to continue</span>
            <div className="w-8 h-[1px] bg-white/20" />
          </div>

          {/* Decorative vertical line — it divides two columns, so it only exists
              once there are two columns */}
          <div className="hidden lg:block absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-gradient-to-b from-transparent via-amber-700/40 to-transparent" />
        </div>

        {/* RIGHT PANEL: The 3D Hallway Gallery */}
        <div className="h-[62vh] lg:h-full lg:flex-1 overflow-hidden">
          <FamilyFunctionHallwayGallery images={slot2Imgs} />
        </div>
      </section>

      {/* ── SECTION 3: 3D Vintage Family Movie Projector (tall: scrolling drives the camera) ── */}
      <section className="w-full">
        <FamilyFunctionMovieProjector images={slot3Imgs} heading={t("projector.heading")} subtitle={t("projector.subtitle")} />
      </section>

      {/* ── SECTION 4: Flip-Cube Photo Wall ── */}
      <section className="w-full h-screen">
        <FamilyFunctionFlipCubeWall images={slot4Imgs} label={t("wall.label")} heading={t("wall.heading")} subtitle={t("wall.subtitle")} />
      </section>
    </div>
  );
}
