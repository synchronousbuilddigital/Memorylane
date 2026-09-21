"use client";

import { useState, useTransition } from "react";
import { Globe, Lock, Copy, RefreshCw, Check, ExternalLink } from "lucide-react";
import { setSharing, regenerateShareLink } from "@/app/actions/shareSection";

/* Sharing is off until the owner turns it on. The link carries a random slug,
   so turning sharing off, or minting a new link, stops every link already sent. */
export default function ShareControl({
  sectionId, initialIsPublic, initialSlug,
}: { sectionId: string; initialIsPublic: boolean; initialSlug: string | null }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  const url = slug && typeof window !== "undefined" ? `${window.location.origin}/share/${slug}` : "";

  const say = (m: string) => { setNote(m); setTimeout(() => setNote(null), 2600); };

  const toggle = () => start(async () => {
    const res = await setSharing(sectionId, !isPublic);
    if (!res.ok) return say(res.error);
    setIsPublic(res.isPublic);
    setSlug(res.shareSlug);
    say(res.isPublic ? "Anyone with the link can now view this album" : "Sharing is off — existing links no longer work");
  });

  const regenerate = () => start(async () => {
    const res = await regenerateShareLink(sectionId);
    if (!res.ok) return say(res.error);
    setIsPublic(res.isPublic);
    setSlug(res.shareSlug);
    say("New link created — the old one no longer works");
  });

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); say("Link copied"); }
    catch { say("Couldn't copy — select the link and copy it"); }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            {isPublic ? <Globe size={15} className="text-green-600" /> : <Lock size={15} className="text-gray-400" />}
            {isPublic ? "Shared with anyone who has the link" : "Private to you"}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {isPublic
              ? "Anyone holding the link can open this album. No sign-in needed."
              : "Only you can open this album. Turn sharing on to get a link."}
          </p>
        </div>
        <button
          type="button" onClick={toggle} disabled={pending} role="switch" aria-checked={isPublic}
          aria-label={isPublic ? "Turn sharing off" : "Turn sharing on"}
          className={`relative shrink-0 h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${isPublic ? "bg-green-600" : "bg-gray-300"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${isPublic ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {isPublic && slug && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Share link"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-none focus:border-black"
            />
            <button type="button" onClick={copy} aria-label="Copy link"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
              <Copy size={16} />
            </button>
            <a href={`/share/${slug}`} target="_blank" rel="noreferrer" aria-label="Open the shared page"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
              <ExternalLink size={16} />
            </a>
          </div>
          <button type="button" onClick={regenerate} disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50">
            <RefreshCw size={13} className={pending ? "animate-spin" : ""} /> Create a new link and break the old one
          </button>
        </div>
      )}

      {note && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <Check size={13} className="text-green-600" /> {note}
        </p>
      )}
    </div>
  );
}
