"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/* Four real numbers from the database, counting up the first time they scroll into view.
   Proportional figures on the big number — tabular digits read loose at this size. */
type Stat = { label: string; value: number; suffix?: string; sub: string };

function Counter({ value, suffix = "", run }: { value: number; suffix?: string; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!run || reduce) { setN(value); return; }
    const controls = animate(0, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [run, value, reduce]);
  return <>{n.toLocaleString()}{suffix}</>;
}

export default function LiveNumbers({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-15% 0px" });
  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 border-y border-[#e8e0d5]">
      {stats.map((s, i) => (
        <div key={s.label} className={`py-8 md:py-10 px-4 md:px-8 ${i % 2 === 1 ? "border-l border-[#e8e0d5]" : ""} ${i >= 2 ? "border-t lg:border-t-0 border-[#e8e0d5]" : ""} ${i >= 2 ? "lg:border-l" : ""}`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#a3907a]">{s.label}</div>
          <div className="font-sans font-bold text-[2.6rem] md:text-[3.4rem] leading-none text-[#1c1917] mt-3">
            <Counter value={s.value} suffix={s.suffix} run={inView} />
          </div>
          <div className="text-xs md:text-sm text-[#5a4d41] mt-2">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
