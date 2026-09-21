"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, AlertTriangle, Mail, Phone, MapPin, User as UserIcon } from "lucide-react";
import { updateProfile } from "@/app/actions/updateProfile";
import type { Viewer } from "@/lib/profile";

const BIO_MAX = 280;

export default function ProfileForm({ viewer }: { viewer: Viewer }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(viewer.name ?? "");
  const [phone, setPhone] = useState(viewer.phone ?? "");
  const [location, setLocation] = useState(viewer.location ?? "");
  const [bio, setBio] = useState(viewer.bio ?? "");
  const [image, setImage] = useState(viewer.image ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, startSave] = useTransition();
  const [note, setNote] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [badField, setBadField] = useState<string | null>(null);

  const say = (kind: "ok" | "bad", text: string) => {
    setNote({ kind, text });
    if (kind === "ok") setTimeout(() => setNote(null), 3000);
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";                       // so the same file can be picked twice
    if (!file) return;
    if (!file.type.startsWith("image/")) return say("bad", "Please choose an image file");
    if (file.size > 8 * 1024 * 1024) return say("bad", "That image is over 8MB — please pick a smaller one");

    setUploading(true);
    setNote(null);
    try {
      const signRes = await fetch("/api/upload/avatar", { method: "POST" });
      if (!signRes.ok) {
        throw new Error(signRes.status === 429 ? "Too many uploads — wait a moment" : "Could not start the upload");
      }
      const { signature, timestamp, apiKey, cloudName, folder, allowedFormats } = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);
      form.append("allowed_formats", allowedFormats);

      const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
      if (!up.ok) throw new Error("The image could not be uploaded");
      const { secure_url } = await up.json();

      // a square thumbnail, built by Cloudinary rather than shipped full-size
      setImage(String(secure_url).replace("/upload/", "/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/"));
      say("ok", "Picture ready — press Save to keep it");
    } catch (err) {
      say("bad", err instanceof Error ? err.message : "The image could not be uploaded");
    } finally {
      setUploading(false);
    }
  };

  const save = () => startSave(async () => {
    setBadField(null);
    const res = await updateProfile({ name, phone, location, bio, image });
    if (!res.ok) { setBadField(res.field ?? null); return say("bad", res.error); }
    say("ok", "Profile saved");
    router.refresh();                          // the bar reads the profile fresh
  });

  const initial = (name || viewer.email || "?").charAt(0).toUpperCase();
  const field = "w-full rounded-xl border bg-[#fcfbf9] px-4 py-3 text-base text-[#1c1917] outline-none transition-colors focus:border-[#1c1917] placeholder:text-[#a3907a]";
  const ok = "border-[#e8e0d5]";
  const bad = "border-red-400";

  return (
    <div className="space-y-8">
      {/* picture */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-[#f4eee6] text-[#8a755b] flex items-center justify-center text-3xl font-bold ring-1 ring-[#e8e0d5]">
            {image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              : initial}
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#1c1917]/60 text-white">
              <Loader2 size={22} className="animate-spin" />
            </div>
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <button
            type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1c1917] px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            <Camera size={16} /> {image ? "Change picture" : "Add a picture"}
          </button>
          <p className="mt-2 text-xs text-[#8a755b]">JPG, PNG or WebP. Up to 8MB.</p>
        </div>
      </div>

      {/* fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5a4d41]"><UserIcon size={12} /> Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${field} ${badField === "name" ? bad : ok}`} placeholder="Your name" />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5a4d41]"><Phone size={12} /> Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={`${field} ${badField === "phone" ? bad : ok}`} placeholder="+91 98765 43210" />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5a4d41]"><MapPin size={12} /> Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={`${field} ${badField === "location" ? bad : ok}`} placeholder="City, country" />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-[#5a4d41]">About you</span>
          <textarea
            value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} rows={3}
            className={`${field} resize-none ${badField === "bio" ? bad : ok}`} placeholder="A line or two about yourself"
          />
          <span className="mt-1 block text-right text-xs tabular-nums text-[#a3907a]">{bio.length} / {BIO_MAX}</span>
        </label>

        {/* read-only: this is the identity Google signs you in with */}
        <label className="block sm:col-span-2">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5a4d41]"><Mail size={12} /> Email</span>
          <input value={viewer.email ?? ""} readOnly disabled className={`${field} ${ok} cursor-not-allowed opacity-70`} />
          <span className="mt-1 block text-xs text-[#8a755b]">This comes from the Google account you sign in with, so it cannot be changed here.</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-[#e8e0d5] pt-6">
        <button
          type="button" onClick={save} disabled={saving || uploading}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1c1917] px-6 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {saving && <Loader2 size={15} className="animate-spin" />} Save changes
        </button>
        {note && (
          <p className={`flex items-center gap-1.5 text-sm font-medium ${note.kind === "ok" ? "text-[#1c1917]" : "text-red-700"}`}>
            {note.kind === "ok" ? <Check size={15} className="text-green-600" /> : <AlertTriangle size={15} />}
            {note.text}
          </p>
        )}
      </div>
    </div>
  );
}
