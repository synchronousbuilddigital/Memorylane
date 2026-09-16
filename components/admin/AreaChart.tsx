"use client";

import { useRef, useState } from "react";
import { VIZ, niceMax } from "./viz";

/* One series over time. No legend — the card's title names the series. The last
   point is direct-labelled so a value is readable without hovering; the crosshair
   and tooltip are an enhancement on top of that, never the only way to read it. */
type Point = { label: string; value: number };

const W = 640, H = 220, PAD_L = 40, PAD_R = 18, PAD_T = 18, PAD_B = 34;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function AreaChart({ data, unit = "" }: { data: Point[]; unit?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-sm text-[#a3907a] py-10 text-center">Nothing to plot yet.</p>;
  }

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const n = data.length;
  const x = (i: number) => PAD_L + (n === 1 ? PLOT_W / 2 : (i * PLOT_W) / (n - 1));
  const y = (v: number) => PAD_T + PLOT_H - (v / max) * PLOT_H;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)} L${x(0).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)} Z`;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  // enough room for the labels not to collide on a narrow card
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  const onMove = (clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const svgX = ((clientX - r.left) / r.width) * W;
    const i = Math.round(((svgX - PAD_L) / PLOT_W) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  };

  const last = data[n - 1];
  const point = active !== null ? data[active] : null;

  return (
    <div ref={wrap} className="relative w-full" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block touch-none"
        role="img"
        aria-label={`${last.value}${unit} on ${last.label}; ${n} points from ${data[0].label}`}
        onMouseMove={(e) => onMove(e.clientX)}
      >
        {/* recessive solid hairlines — never dashed */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth={1} />
            <text x={PAD_L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={VIZ.muted} style={{ fontVariantNumeric: "tabular-nums" }}>{t}</text>
          </g>
        ))}

        <path d={area} fill={VIZ.seriesSoft} />
        <path d={line} fill="none" stroke={VIZ.series} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* the endpoint carries the direct label */}
        <circle cx={x(n - 1)} cy={y(last.value)} r={4.5} fill={VIZ.series} stroke={VIZ.surface} strokeWidth={2} />
        <text x={x(n - 1) - 6} y={y(last.value) - 12} textAnchor="end" fontSize={12} fontWeight={700} fill={VIZ.ink}>
          {last.value}{unit}
        </text>

        {data.map((d, i) => (
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={d.label} x={x(i)} y={H - 12} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={VIZ.muted}>
              {d.label}
            </text>
          ) : null
        ))}

        {active !== null && point && (
          <g pointerEvents="none">
            <line x1={x(active)} x2={x(active)} y1={PAD_T} y2={PAD_T + PLOT_H} stroke={VIZ.axis} strokeWidth={1} />
            <circle cx={x(active)} cy={y(point.value)} r={5} fill={VIZ.series} stroke={VIZ.surface} strokeWidth={2} />
          </g>
        )}
      </svg>

      {active !== null && point && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-[#1c1917] text-white px-2.5 py-1.5 shadow-lg whitespace-nowrap"
          style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(point.value) / H) * 100}%`, marginTop: -10 }}
        >
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{point.label}</div>
          <div className="text-sm font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{point.value}{unit}</div>
        </div>
      )}
    </div>
  );
}
