"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search, ChevronDown, MoreHorizontal, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { deleteSection } from "@/app/actions/deleteSection";

const PURPOSES = [
  { value: "all", label: "All Albums" },
  { value: "family", label: "Family" },
  { value: "travel", label: "Travel" },
  { value: "event", label: "Events" },
  { value: "favorites", label: "Favorites", icon: Heart },
];

export default function HomeAlbumList({ sections }: { sections: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If clicking outside the active dropdown, close it
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this memory lane? This cannot be undone.")) {
      setDeletingId(id);
      startTransition(async () => {
        await deleteSection(id);
        router.refresh();
        setDeletingId(null);
      });
    }
  };

  const filteredSections = filter === "all" 
    ? sections 
    : filter === "favorites" ? sections // Add actual favorite logic if exists
    : sections.filter(s => s.purpose === filter);

  return (
    <div className="space-y-8 w-full">
      {/* Top Header & View All */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-[#e8e0d5] pt-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-[#1c1917] tracking-tight mb-2">
            Your Albums
          </h2>
          <p className="text-[#5a4d41] text-sm">Little pieces of life that make the big picture beautiful.</p>
        </div>
        <Link href="#all" className="text-sm font-semibold text-[#5a4d41] hover:text-[#1c1917] flex items-center gap-1 transition-colors">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {/* Filter & Search Bar */}
      {sections.length > 0 && (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6">
          
          {/* Left: Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {PURPOSES.map((p) => {
              const Icon = p.icon;
              const isActive = filter === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setFilter(p.value)}
                  className={`px-5 py-2.5 rounded-full font-semibold transition-all text-sm tracking-wide border flex items-center gap-2 ${
                    isActive
                      ? "bg-[#2c241b] text-white border-[#2c241b] shadow-md" 
                      : "bg-[#fcfbf9] text-[#5a4d41] border-[#e8e0d5] hover:bg-white hover:text-[#1c1917] hover:border-[#d9cbb8]"
                  }`}
                >
                  {Icon && <Icon size={14} className={isActive ? "text-white" : "text-rose-500"} />}
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Right: Search & Sort */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a755b]" />
              <input 
                type="text" 
                placeholder="Search your memories..." 
                className="pl-10 pr-4 py-2.5 bg-[#fcfbf9] border border-[#e8e0d5] rounded-full text-sm font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#2c241b] transition-shadow placeholder:font-normal"
              />
            </div>
            <button className="px-5 py-2.5 bg-[#fcfbf9] border border-[#e8e0d5] rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-white transition-colors">
              Latest <ChevronDown size={14} className="text-[#8a755b]" />
            </button>
          </div>
        </div>
      )}

      {/* Album List Grid - 4 Columns */}
      <div ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {filteredSections.map((section) => {
          let coverImage = "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800"; // Default (family)
          
          if (section.purpose === "travel") {
            coverImage = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800"; // Lake/Boat travel vibe
          } else if (section.purpose === "birthday" || section.theme?.includes("birthday")) {
            coverImage = "/wishing-tree-bg.jpg"; // The beautiful wishing tree for birthday
          } else if (section.purpose === "events") {
            coverImage = "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=800"; // Party/Event vibe
          }
          const photoCount = section.images?.length || 0;
          
          return (
            <div key={section.id} className="group flex flex-col bg-[#fcfbf9] rounded-[1.5rem] border border-[#e8e0d5] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              
              {/* Image Header */}
              <Link href={`/share/${section.id}`} className="relative aspect-[4/3] w-full overflow-hidden block rounded-t-[1.5rem]">
                <img 
                  src={coverImage} 
                  alt={section.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10"></div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-xs font-bold tracking-wide">{photoCount} Photos</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300" />
                </div>
              </Link>

              {/* Card Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/share/${section.id}`}>
                    <h3 className="font-bold text-[#1c1917] text-lg leading-tight hover:text-indigo-600 transition-colors">
                      {section.title}
                    </h3>
                  </Link>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === section.id ? null : section.id);
                      }}
                      className="text-[#8a755b] hover:text-[#1c1917] p-2 -m-1 rounded-md hover:bg-[#e8e0d5] transition-colors relative z-10"
                    >
                      <MoreHorizontal size={18} className="rotate-90" />
                    </button>
                    
                    {activeDropdown === section.id && (
                      <div className="absolute right-0 top-8 w-40 bg-white border border-[#e8e0d5] rounded-xl shadow-xl overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200">
                        <Link 
                          href={`/section/${section.id}`}
                          className="px-4 py-2 text-sm text-[#1c1917] font-medium hover:bg-[#fcfbf9] transition-colors"
                        >
                          Edit Album
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(window.location.origin + `/share/${section.id}`);
                            alert("Link copied to clipboard!");
                            setActiveDropdown(null);
                          }}
                          className="px-4 py-2 text-sm text-[#1c1917] font-medium hover:bg-[#fcfbf9] text-left transition-colors"
                        >
                          Share Link
                        </button>
                        <div className="h-px bg-[#e8e0d5] my-1 mx-2" />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(section.id);
                            setActiveDropdown(null);
                          }}
                          disabled={deletingId === section.id}
                          className="px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 text-left transition-colors flex items-center justify-between"
                        >
                          Delete
                          {deletingId === section.id && <Loader2 size={12} className="animate-spin" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-[#5a4d41] text-xs leading-relaxed line-clamp-2 mb-6">
                  {section.description || "These are some of my favorite moments—little pieces of life that make the big picture beautiful."}
                </p>
                
                <div className="mt-auto">
                  <span className="text-[10px] font-bold text-[#8a755b] uppercase tracking-widest">
                    {new Date(section.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-[#e8e0d5] rounded-3xl bg-[#fcfbf9]">
          <h3 className="text-[#2c241b] font-serif text-2xl font-bold mb-2">No memory lanes yet</h3>
          <p className="text-[#8a755b]">Click above to start your first collection.</p>
        </div>
      )}
    </div>
  );
}
