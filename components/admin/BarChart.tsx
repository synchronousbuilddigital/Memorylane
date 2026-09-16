"use client";

import { useState } from "react";
import { VIZ } from "./viz";

/* Magnitude across named categories. The category is already on the axis, so every
   bar is the same colour — a hue ramp here would double-encode length and say nothing.
   Values are direct-laboured at the bar end, so nothing depends on the hover state. */
export default function BarChart({ data, unit = "" }: { data: { label: string; value: number }[]; unit?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  if (data.length === 0) return <p className="text-sm text-[#a3907a] py-10 text-center">Nothing to plot yet.</p>;

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-3.5">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <li
            key={d.label}
            onMouseEnter={() => setHover(d.label)}
            onMouseLeave={() => setHover(null)}
            className="grid grid-cols-[minmax(6.5rem,auto)_1fr_auto] items-center gap-3"
          >
            <span className={`text-xs font-semibold transition-colors ${hover === d.label ? "text-[#1c1917]" : "text-[#5a4d41]"}`}>
              {d.label}
            </span>
            <span className="relative block h-2.5 rounded-full" style={{ background: VIZ.grid }}>
              <span
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(pct, d.value > 0 ? 3 : 0)}%`, background: VIZ.series, opacity: hover && hover !== d.label ? 0.55 : 1 }}
              />
            </span>
            <span className="text-xs font-bold text-[#1c1917] w-10 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
              {d.value}{unit}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
