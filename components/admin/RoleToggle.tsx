"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Shield, Loader2, AlertTriangle } from "lucide-react";
import { setUserRole } from "@/app/actions/setUserRole";

/* Promote or demote an account. Both directions ask for confirmation, because
   both are consequential: one hands over the whole panel, the other takes it
   away. The server refuses to demote the last admin regardless of what this
   sends, so a stale page cannot cause a lockout. */
export default function RoleToggle({
  userId, initialIsAdmin, isSelf, label,
}: { userId: string; initialIsAdmin: boolean; isSelf: boolean; label: string }) {
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const apply = () => start(async () => {
    setError(null);
    const res = await setUserRole(userId, !isAdmin);
    if (!res.ok) { setError(res.error); setConfirming(false); return; }
    setIsAdmin(res.role === "ADMIN");
    setConfirming(false);
    router.refresh();
  });

  if (confirming) {
    return (
      <div className="rounded-xl border border-[#e8e0d5] bg-[#fcfbf9] p-4">
        <p className="text-sm text-[#1c1917]">
          {isAdmin
            ? <>Remove admin access from <strong>{label}</strong>? They will lose the panel straight away.</>
            : <>Make <strong>{label}</strong> an admin? They will be able to see every account and album, and grant admin to others.</>}
          {isAdmin && isSelf && <span className="mt-1.5 block text-amber-700">This is your own account — you will be signed out of the panel.</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button" onClick={apply} disabled={pending}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${isAdmin ? "bg-red-600 hover:bg-red-700" : "bg-[#1c1917] hover:bg-black"}`}
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {isAdmin ? "Remove admin" : "Make admin"}
          </button>
          <button
            type="button" onClick={() => setConfirming(false)} disabled={pending}
            className="inline-flex min-h-11 items-center rounded-lg border border-[#e8e0d5] px-4 text-sm font-semibold text-[#5a4d41] transition-colors hover:text-[#1c1917] disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isAdmin ? "bg-[#1c1917] text-[#e6c56d]" : "bg-[#f4eee6] text-[#5a4d41]"}`}>
          {isAdmin ? <ShieldCheck size={13} /> : <Shield size={13} />}
          {isAdmin ? "Admin" : "Member"}
        </span>
        <button
          type="button" onClick={() => { setError(null); setConfirming(true); }}
          className="inline-flex min-h-11 items-center text-xs font-semibold text-[#5a4d41] underline-offset-4 transition-colors hover:text-[#1c1917] hover:underline"
        >
          {isAdmin ? "Remove admin access" : "Make this account an admin"}
        </button>
      </div>
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-700">
          <AlertTriangle size={13} className="mt-px shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
