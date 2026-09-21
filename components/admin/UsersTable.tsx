"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, X, ShieldCheck } from "lucide-react";

export type AdminUser = {
  id: string; name: string | null; email: string | null; image: string | null;
  isAdmin: boolean;
  joined: string; albums: number; photos: number; lastAlbum: string | null;
};

const SORTS = [
  { value: "admins", label: "Admins" },
  { value: "recent", label: "Newest" },
  { value: "albums", label: "Most albums" },
  { value: "photos", label: "Most photos" },
  { value: "name", label: "A – Z" },
] as const;

export default function UsersTable({ users }: { users: AdminUser[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("recent");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = users.filter((u) => !needle || `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(needle));
    return [...list].sort((a, b) => {
      if (sort === "admins") {
        if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
        return new Date(b.joined).getTime() - new Date(a.joined).getTime();
      }
      if (sort === "albums") return b.albums - a.albums;
      if (sort === "photos") return b.photos - a.photos;
      if (sort === "name") return (a.name ?? a.email ?? "").localeCompare(b.name ?? b.email ?? "");
      return new Date(b.joined).getTime() - new Date(a.joined).getTime();
    });
  }, [users, q, sort]);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3907a] pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            aria-label="Search users"
            className="w-full pl-9 pr-9 py-2.5 bg-[#fcfbf9] border border-[#e8e0d5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1c1917]/15"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#a3907a] hover:bg-[#e8e0d5]">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${sort === s.value ? "bg-[#1c1917] text-white" : "bg-[#fcfbf9] border border-[#e8e0d5] text-[#5a4d41] hover:text-[#1c1917]"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#e8e0d5]">
        {rows.map((u) => (
          <Link
            key={u.id}
            href={`/admin/users/${u.id}`}
            className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_5rem_5rem_8rem_auto] items-center gap-3 md:gap-5 px-2 py-4 border-b border-[#e8e0d5] hover:bg-[#fcfbf9] transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-[#f4eee6] overflow-hidden flex items-center justify-center text-xs font-bold text-[#8a755b] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : (u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-[#1c1917] text-sm truncate">{u.name ?? "No name"}</span>
                {u.isAdmin && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1c1917] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#e6c56d]">
                    <ShieldCheck size={10} /> Admin
                  </span>
                )}
              </span>
              <span className="block text-xs text-[#8a755b] truncate">{u.email}</span>
            </span>
            <span className="hidden md:block text-sm text-[#5a4d41] tabular-nums text-right">{u.albums}<span className="text-[10px] text-[#a3907a] ml-1">alb</span></span>
            <span className="hidden md:block text-sm text-[#5a4d41] tabular-nums text-right">{u.photos}<span className="text-[10px] text-[#a3907a] ml-1">ph</span></span>
            <span className="hidden md:block text-[11px] text-[#a3907a] text-right tabular-nums">{fmt(u.joined)}</span>
            <ArrowRight size={15} className="text-[#a3907a] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
        {rows.length === 0 && <p className="py-12 text-center text-sm text-[#a3907a]">No users match “{q}”.</p>}
      </div>
    </div>
  );
}
