"use client";

import { useState } from "react";
import Link from "next/link";
import { createSectionAction } from "@/app/actions/createSection";

export default function CreateAlbumForm() {
  const [purpose, setPurpose] = useState("everyday");
  const [isPending, setIsPending] = useState(false);

  // Dynamic themes based on selected purpose
  const getAvailableThemes = () => {
    switch (purpose) {
      case "travel":
        return [
          { value: "ribbon", label: "3D Ribbon Loop (WebGL)" },
          { value: "travel", label: "Filmstrip Reel (Scrolling)" },
          { value: "cover-flow", label: "Cover Flow (3D)" },
        ];
      case "event":
        return [
          { value: "carousel", label: "3D Carousel (Rotating Cylinder)" },
          { value: "event", label: "Polaroid Pile Layout" },
          { value: "spotlight", label: "Spotlight Gallery" },
        ];
      case "family":
        return [
          { value: "tunnel", label: "3D Tunnel Grid" },
          { value: "everyday", label: "Mosaic Grid Layout" },
          { value: "scrapbook", label: "Vintage Scrapbook" },
        ];
      case "everyday":
        return [
          { value: "everyday", label: "Mosaic Grid Layout" },
          { value: "tunnel", label: "3D Tunnel Grid" },
          { value: "bubbles", label: "Floating Bubbles" },
        ];
      default:
        return [
          { value: "everyday", label: "Mosaic Grid Layout" },
          { value: "travel", label: "Filmstrip Layout" },
          { value: "event", label: "Polaroid Pile Layout" },
          { value: "tunnel", label: "3D Tunnel Grid" },
          { value: "ribbon", label: "3D Ribbon Loop (Wavy)" },
          { value: "carousel", label: "3D Carousel" },
          { value: "cover-flow", label: "Cover Flow (3D)" },
          { value: "scrapbook", label: "Vintage Scrapbook" },
          { value: "spotlight", label: "Spotlight Gallery" },
          { value: "bubbles", label: "Floating Bubbles" },
        ];
    }
  };

  const availableThemes = getAvailableThemes();

  return (
    <div className="max-w-2xl mx-auto p-10 mt-20 bg-white backdrop-blur-md border border-gray-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden">
      {/* Subtle glow inside the form card */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard"
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="font-serif italic text-4xl font-semibold text-gray-900 drop-shadow-md tracking-wide">Create New Album</h1>
        </div>
        <form 
          action={async (formData) => {
            setIsPending(true);
            await createSectionAction(formData);
          }} 
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2 uppercase tracking-wider">Album Title</label>
            <input type="text" name="title" required placeholder="e.g. Summer Vacation 2026" className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-white/30 focus:outline-none focus:border-gray-400 focus:bg-white transition-all shadow-inner" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2 uppercase tracking-wider">Album Purpose</label>
            <select 
              name="purpose" 
              required 
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-gray-100 transition-all shadow-inner appearance-none cursor-pointer"
            >
              <option value="everyday">Everyday Memories</option>
              <option value="travel">Travel & Vacations</option>
              <option value="event">Event & Parties</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2 uppercase tracking-wider">Your Thoughts (Optional)</label>
            <textarea 
              name="description" 
              placeholder="These are some of my favorite moments..." 
              rows={3}
              className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all shadow-inner resize-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2 uppercase tracking-wider">Starting Theme (3D Layout)</label>
            <select 
              name="theme" 
              required
              className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-gray-100 transition-all shadow-inner appearance-none cursor-pointer"
            >
              {availableThemes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Don&apos;t worry, you can always change the layout later in the album settings!
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-white shadow-sm hover:bg-gray-50 shadow-sm text-gray-900 px-6 py-4 rounded-xl font-semibold transition-all shadow-sm border border-gray-300 hover:shadow-lg mt-8 disabled:opacity-50"
          >
            {isPending ? "Creating Album..." : "Create Album"}
          </button>
        </form>
      </div>
    </div>
  );
}
