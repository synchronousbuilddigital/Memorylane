"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, X } from "lucide-react";

export type AdminAlbum = {
  id: string; title: string; template: string; owner: string; ownerId: string;
  photos: number; created: string; cover: string | null;
};

export default function AlbumsTable({ albums, templates }: { albums: AdminAlbum[]; templates: string[] }) {
  const [q, setQ] = useState("");
  const [template, setTemplate] = useState("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return albums.filter((a) => {
      if (template !== "all" && a.template !== template) return false;
      return !needle || `${a.title} ${a.owner}`.toLowerCase().includes(needle);
    });
  }, [albums, q, template]);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3907a] pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search album or owner…"
            aria-label="Search albums"
            className="w-full pl-9 pr-9 py-2.5 bg-[#fcfbf9] border border-[#e8e0d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1c1917]/15"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#a3907a] hover:bg-[#e8e0d5]">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {["all", ...templates].map((t) => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${template === t ? "bg-[#1c1917] text-white" : "bg-[#fcfbf9] border border-[#e8e0d5] text-[#5a4d41] hover:text-[#1c1917]"}`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e8e0d5]">
        {rows.map((a) => (
          <div key={a.id} className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_9rem_4rem_7rem_auto] items-center gap-3 md:gap-5 px-2 py-4 border-b border-[#e8e0d5] hover:bg-[#fcfbf9] transition-colors">
            <span className="w-11 h-11 rounded-md bg-[#f4eee6] overflow-hidden shrink-0 border border-[#e8e0d5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.cover && <img src={a.cover} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </span>
            <span className="min-w-0">
              <Link href={`/share/${a.id}?from=/admin/albums`} className="block font-semibold text-[#1c1917] text-sm truncate hover:text-[#8a755b] transition-colors">{a.title}</Link>
              <Link href={`/admin/users/${a.ownerId}`} className="block text-xs text-[#8a755b] truncate hover:text-[#1c1917] transition-colors">{a.owner}</Link>
            </span>
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3907a]">{a.template}</span>
            <span className="hidden md:block text-sm text-[#5a4d41] tabular-nums text-right">{a.photos}</span>
            <span className="hidden md:block text-[11px] text-[#a3907a] text-right tabular-nums">{fmt(a.created)}</span>
            <Link href={`/share/${a.id}?from=/admin/albums`} aria-label={`Open ${a.title}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a3907a] hover:text-[#1c1917] hover:bg-[#f4eee6] transition-colors">
              <ExternalLink size={15} />
            </Link>
          </div>
        ))}
        {rows.length === 0 && <p className="py-12 text-center text-sm text-[#a3907a]">No albums match.</p>}
      </div>
    </div>
  );
}
