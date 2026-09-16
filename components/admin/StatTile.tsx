import type { LucideIcon } from "lucide-react";

/* A number that needs no plot. Proportional figures on the value (tabular digits
   make a large standalone number read loose) and the same sans as the rest of the UI. */
export default function StatTile({
  label, value, sub, Icon, accent = false,
}: { label: string; value: string | number; sub?: string; Icon?: LucideIcon; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-[#1c1917] border-[#1c1917]" : "bg-[#fcfbf9] border-[#e8e0d5]"}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${accent ? "text-white/60" : "text-[#a3907a]"}`}>{label}</span>
        {Icon && <Icon size={15} className={accent ? "text-white/50" : "text-[#a3907a]"} />}
      </div>
      <div className={`font-sans font-bold text-[2rem] leading-none ${accent ? "text-white" : "text-[#1c1917]"}`}>{value}</div>
      {sub && <div className={`mt-2 text-xs ${accent ? "text-white/55" : "text-[#5a4d41]"}`}>{sub}</div>}
    </div>
  );
}
