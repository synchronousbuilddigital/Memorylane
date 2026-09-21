"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Globe2, GitBranch } from "lucide-react";

/* Two ways to look at the same albums. The timeline was here first and still
   answers "when"; the globe answers "where". Neither replaces the other, so
   they sit behind a toggle rather than one displacing the other. */
export default function MapTabs({ globe, timeline }: { globe: ReactNode; timeline: ReactNode }) {
  const [tab, setTab] = useState<"globe" | "timeline">("globe");
  const TABS = [
    { id: "globe", label: "Globe", Icon: Globe2 },
    { id: "timeline", label: "Timeline", Icon: GitBranch },
  ] as const;

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div className="inline-flex gap-1 rounded-full border border-[#e8e0d5] bg-[#fcfbf9] p-1">
          {TABS.map((t) => (
            <button
              key={t.id} type="button" onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`relative inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${tab === t.id ? "text-white" : "text-[#5a4d41] hover:text-[#1c1917]"}`}
            >
              {tab === t.id && (
                <motion.span layoutId="map-tab" className="absolute inset-0 rounded-full bg-[#1c1917]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <t.Icon size={15} className="relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* both stay mounted: remounting the globe would reload its texture and
          throw away wherever you had spun it */}
      <div className={tab === "globe" ? "block" : "hidden"}>{globe}</div>
      <div className={tab === "timeline" ? "block" : "hidden"}>{timeline}</div>
    </div>
  );
}
