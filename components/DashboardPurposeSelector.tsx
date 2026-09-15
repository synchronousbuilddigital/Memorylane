"use client";

import { useState } from "react";

import Link from "next/link";
import { Users, Plane, Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";

const PURPOSES = [
  {
    id: "family",
    label: "Family",
    icon: Users,
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
    description: "Create a warm, nostalgic scrapbook."
  },
  {
    id: "travel",
    label: "Travel",
    icon: Plane,
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800",
    description: "Build a cinematic travel filmstrip."
  },
  {
    id: "event",
    label: "Event",
    icon: Calendar,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    description: "Toss together a fun polaroid pile.",
    subOptions: [
      { id: "birthday", label: "Birthday Party" },
      { id: "family-function", label: "Family Function" },
      { id: "party", label: "General Event / Party" }
    ]
  }
];

export default function DashboardPurposeSelector({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  return (
    <div className="relative bg-[#faf7f2] rounded-[2rem] p-10 md:p-14 mb-16 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
      
      {/* Decorative text */}
      <div className="hidden lg:block absolute right-16 top-10 font-handwriting text-3xl text-[#8a755b] -rotate-6">
        New<br/>Stories<br/>Await ♡
      </div>

      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-black text-[#1c1917] tracking-tight mb-2">
          Create a New Memory Lane
        </h2>
        <p className="text-[#5a4d41] text-sm">Choose a theme to start your next story</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PURPOSES.map((purpose) => {
          const Icon = purpose.icon;
          const isDropdownOpen = openDropdownId === purpose.id;

          const CardContent = (
            <>
              {/* Image Header */}
              <div className="relative w-full h-48 md:h-56">
                <Image 
                  src={purpose.image} 
                  alt={purpose.label} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                
                {/* Floating Icon */}
                <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                  <Icon size={18} className="text-[#2c241b]" />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[#fcfbf9] m-2 -mt-8 p-6 rounded-xl shadow-sm border border-white/50 relative z-10 flex flex-col">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-[#1c1917] text-lg mb-1">{purpose.label}</h3>
                    <p className="text-[#5a4d41] text-xs max-w-[80%] leading-relaxed">{purpose.description}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#d9cbb8] flex items-center justify-center group-hover:bg-[#1c1917] group-hover:border-[#1c1917] group-hover:text-white transition-colors shrink-0">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>

              {/* Dropdown Overlay (If applicable) */}
              {purpose.subOptions && (
                <div className={`absolute inset-0 bg-[#1c1917]/90 backdrop-blur-md z-20 flex flex-col justify-center items-center gap-3 transition-opacity duration-300 ${isDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                  <h3 className="text-[#f4eee6] font-serif text-xl mb-4 font-bold">Choose Event Type</h3>
                  {purpose.subOptions.map(sub => (
                    <Link 
                      key={sub.id} 
                      href={`/purpose/${sub.id}`} 
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold w-3/4 text-center transition-all hover:scale-105"
                    >
                      {sub.label}
                    </Link>
                  ))}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} 
                    className="absolute top-4 right-4 text-white/50 hover:text-white p-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </>
          );

          if (purpose.subOptions) {
            return (
              <div
                key={purpose.id}
                onClick={() => setOpenDropdownId(purpose.id)}
                className="group flex flex-col relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] bg-[#f4eee6] cursor-pointer"
              >
                {CardContent}
              </div>
            )
          }

          return (
            <Link
              key={purpose.id}
              href={`/purpose/${purpose.id}`}
              className="group flex flex-col relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] bg-[#f4eee6]"
            >
              {CardContent}
            </Link>
          )
        })}
      </div>
    </div>
  );
}
