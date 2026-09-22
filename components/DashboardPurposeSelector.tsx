"use client";

import { motion, useReducedMotion } from "framer-motion";
import { staggerParent, staggerChild } from "./motion/Reveal";
import Link from "next/link";
import Image from "next/image";
import { Users, Plane, Calendar, ArrowRight, Sparkles } from "lucide-react";

/* One card per purpose. Each carries a distinctive photo, a handwriting caption that
   appears on hover, and chips naming the scenes the template actually builds. */
const PURPOSES = [
  {
    id: "family",
    label: "Family",
    icon: Users,
    image: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_1000/memory_lane/stock/photo-1609220136736-443140cffec6",
    alt: "A father laughing with his two children",
    position: "center 30%",
    caption: "Little moments, big stories ♡",
    description: "A warm, nostalgic scrapbook of the people you love.",
    chips: ["Hero slideshow", "Photo ribbon", "Scrapbook", "3D stack"],
    cta: "Start a Family lane",
    tag: "Most loved",
  },
  {
    id: "travel",
    label: "Travel",
    icon: Plane,
    image: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_1000/memory_lane/stock/photo-1488646953014-85cb44e25828",
    alt: "A map, field notes, a camera and a backpack laid out for a trip",
    position: "center",
    caption: "Somewhere new ♡",
    description: "A cinematic journey — suitcase, map and a tunnel of memories.",
    chips: ["Suitcase", "Map journey", "3D tunnel", "Astrolabe"],
    cta: "Start a Travel lane",
  },
  {
    id: "event",
    label: "Event",
    icon: Calendar,
    image: "https://res.cloudinary.com/ttntkum2/image/upload/f_auto,q_auto,w_1000/memory_lane/stock/photo-1464349095431-e9a21285b5f3",
    alt: "A sprinkle-covered birthday cake with candles",
    position: "center 45%",
    caption: "Let's celebrate ♡",
    description: "Lanterns, a ferris wheel, a gallery hall and a movie night.",
    chips: ["Lanterns", "Ferris wheel", "3D hallway", "Movie night"],
    subOptions: [
      { id: "birthday", label: "Birthday Party" },
      { id: "family-function", label: "Family Function" },
      // The general party template isn't built yet, so the option is shown but not linked
      { id: "party", label: "General Party", soon: true },
    ],
  },
] as const;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function DashboardPurposeSelector({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const reduce = useReducedMotion();
  void isLoggedIn; // the cards link to the preview pages, which handle sign-in themselves

  return (
    <div className="relative bg-[#faf7f2] rounded-[1.5rem] md:rounded-[2rem] p-6 sm:p-10 md:p-14 mb-10 md:mb-16 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
      {/* Decorative text */}
      <div className="hidden lg:block absolute right-16 top-10 font-handwriting text-3xl text-[#8a755b] -rotate-6">
        New<br />Stories<br />Await ♡
      </div>

      <div className="mb-6 md:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#1c1917] tracking-tight mb-2">
          Create a New Memory Lane
        </h2>
        <p className="text-[#5a4d41] text-sm">Choose a theme to start your next story</p>
      </div>

      {/* Phones and tablets: a snap-scrolling row of cards. Laptops and up: a three-column grid. */}
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="flex lg:grid lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory hide-scrollbar -mx-6 px-6 sm:-mx-10 sm:px-10 md:-mx-14 md:px-14 lg:mx-0 lg:px-0 pb-2 lg:pb-0"
      >
        {PURPOSES.map((purpose) => {
          const Icon = purpose.icon;
          const hasSub = "subOptions" in purpose;

          const card = (
            <motion.div
              whileHover={reduce ? undefined : { y: -6, rotateX: 2.5, rotateY: -2.5 }}
              transition={{ duration: 0.45, ease: EASE }}
              style={{ transformPerspective: 1000 }}
              className="group relative flex flex-col h-full rounded-2xl overflow-hidden bg-[#fcfbf9] border border-[#e8e0d5]/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-500 group-hover:shadow-[0_24px_50px_-12px_rgba(28,25,23,0.18)] hover:shadow-[0_24px_50px_-12px_rgba(28,25,23,0.18)]"
            >
              {/* Photo */}
              <div className="relative w-full aspect-[4/3] md:aspect-[5/4] overflow-hidden">
                <Image
                  src={purpose.image}
                  alt={purpose.alt}
                  fill
                  sizes="(max-width: 1024px) 82vw, 33vw"
                  style={{ objectPosition: purpose.position }}
                  className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                />
                {/* the photo melts into the panel: no exposed strips at the sides */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9]/60 to-transparent" />
                <div className="absolute inset-0 bg-[#1c1917]/10 group-hover:bg-transparent transition-colors duration-500" />

                {/* icon badge, bounces on hover */}
                <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-110">
                  <Icon size={18} className="text-[#2c241b]" />
                </div>

                {"tag" in purpose && purpose.tag && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[#1c1917]/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                    <Sparkles size={10} /> {purpose.tag}
                  </span>
                )}

                {/* handwriting caption: a note beside the title, appears on hover */}
                <span className="absolute right-5 bottom-2 font-handwriting text-2xl md:text-[1.7rem] text-[#2c241b] -rotate-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out pointer-events-none">
                  {purpose.caption}
                </span>
              </div>

              {/* Panel */}
              <div className="relative flex flex-col flex-1 px-5 md:px-6 pb-5 md:pb-6 -mt-6">
                <h3 className="font-serif font-black text-[#1c1917] text-3xl md:text-4xl tracking-tight mb-2 leading-none mt-1">{purpose.label}</h3>
                <p className="text-[#5a4d41] text-sm leading-relaxed mb-4">{purpose.description}</p>

                {/* what you get */}
                <ul className="flex flex-wrap gap-1.5 mb-5">
                  {purpose.chips.map((chip) => (
                    <li key={chip} className="text-[10px] font-bold uppercase tracking-wider text-[#5a4d41] bg-[#f4eee6] border border-[#e8e0d5] rounded-full px-2.5 py-1">
                      {chip}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {hasSub ? (
                    <div className="flex flex-wrap gap-2">
                      {purpose.subOptions.map((sub) =>
                        "soon" in sub && sub.soon ? (
                          <span key={sub.id} aria-disabled className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#d9cbb8] text-[#8a755b] text-xs font-semibold px-3.5 py-2 cursor-not-allowed">
                            {sub.label} <span className="text-[9px] uppercase tracking-widest opacity-70">soon</span>
                          </span>
                        ) : (
                          <Link key={sub.id} href={`/purpose/${sub.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1917] text-white text-xs font-semibold px-3.5 py-2 hover:bg-[#3d3329] transition-colors">
                            {sub.label} <ArrowRight size={12} />
                          </Link>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#1c1917] text-white text-sm font-semibold px-4 py-2.5 transition-colors group-hover:bg-[#3d3329]">
                      {purpose.cta}
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );

          return (
            <motion.div key={purpose.id} variants={staggerChild(reduce)} className="snap-center shrink-0 w-[82vw] sm:w-[58vw] md:w-[44vw] lg:w-auto lg:shrink">
              {hasSub ? card : (
                <Link href={`/purpose/${purpose.id}`} className="block h-full" aria-label={purpose.cta}>
                  {card}
                </Link>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
