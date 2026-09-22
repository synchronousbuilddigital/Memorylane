"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, CheckCircle, Loader2 } from "lucide-react";
import { uploadImageToSlotAction } from "@/app/actions/uploadImageToSlot";

interface SlotUploaderProps {
  sectionId: string;
  position: number;
  label: string;
  currentImageUrl?: string;
  onUploadComplete: () => void;
  allowMultiple?: boolean;
  maxFiles?: number;
  imageCount?: number;
}

export default function SlotUploader({ 
  sectionId, 
  position, 
  label, 
  currentImageUrl, 
  onUploadComplete,
  allowMultiple = false,
  maxFiles = 20,
  imageCount = 0
}: SlotUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    let imageFiles = files.filter(f => f.type.startsWith("image/"));

    if (allowMultiple && imageFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images for this slot.`);
      imageFiles = imageFiles.slice(0, maxFiles);
    }

    if (imageFiles.length === 0) return;

    setIsUploading(true);
    setProgress({ done: 0, total: imageFiles.length });
    setFailed(0);

    /* Three things used to go wrong here, and they compounded.

       Each file fetched its own signature, and presign allows 60 a minute —
       so the slots that invite 100, 60 or 50 files at once did not risk
       failing partway, they did it every time. The loop then threw on the
       first failure, skipping onUploadComplete(), which is what refreshes
       the page — so the images already saved stayed invisible. Re-picking
       the same files to recover uploaded the successful ones a second time,
       because a slot that allows multiple images always creates a new row.

       So: one signature for the whole batch (verified — Cloudinary accepts
       the same signature for several uploads, each getting its own id), one
       try per file so a bad one cannot end the run, and the refresh in
       `finally` so whatever did save is on screen either way. */
    let saved = 0;
    const problems: string[] = [];

    try {
      const signRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      });
      if (!signRes.ok) {
        const { error } = await signRes.json().catch(() => ({ error: "" }));
        throw new Error(
          signRes.status === 429
            ? "Too many uploads at once. Please wait a moment."
            : error || "Could not start the upload",
        );
      }
      const { signature, timestamp, apiKey, cloudName, folder, allowedFormats } = await signRes.json();

      for (const file of imageFiles) {
        try {
          // Every field here is part of what the server signed, so the
          // browser cannot widen what it is allowed to send.
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);
          formData.append("folder", folder);
          formData.append("allowed_formats", allowedFormats);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) throw new Error("upload rejected");
          const uploadData = await uploadRes.json();

          await uploadImageToSlotAction({
            url: uploadData.secure_url,
            sectionId,
            position,
            width: uploadData.width,
            height: uploadData.height,
            allowMultiple,
          });
          saved++;
        } catch (err) {
          console.error(`Upload failed for ${file.name}`, err);
          problems.push(file.name);
        } finally {
          setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
        }
      }

      if (problems.length) {
        const named = problems.slice(0, 3).join(", ");
        const rest = problems.length > 3 ? ` and ${problems.length - 3} more` : "";
        alert(
          `${saved} of ${imageFiles.length} uploaded.\n\nThese did not: ${named}${rest}.\n` +
          `The ones that worked are saved — only add the missing files again.`,
        );
      }
    } catch (err) {
      // the batch never started, so nothing was saved
      console.error("Upload failed", err);
      alert(err instanceof Error ? err.message : "Failed to upload images. Please try again.");
    } finally {
      setFailed(problems.length);
      setIsUploading(false);
      setProgress(null);
      // always: whatever did save has to appear, success or not
      onUploadComplete();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between transition-all hover:border-gray-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${currentImageUrl || (allowMultiple && imageCount > 0) ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
          {currentImageUrl || (allowMultiple && imageCount > 0) ? <CheckCircle size={24} /> : <ImageIcon size={24} />}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Slot {position + 1}: {label}</h4>
          <p className="text-xs text-gray-500">
            {allowMultiple 
              ? `${imageCount} image(s) assigned`
              : currentImageUrl ? "Image assigned" : "Awaiting image..."}
          </p>
          {/* The summary alert is gone as soon as it is dismissed, and a
              part-finished batch is exactly when someone needs to see what
              happened after the fact. */}
          {failed > 0 && !isUploading && (
            <p className="text-xs font-semibold text-amber-600 mt-0.5">
              {failed} file{failed === 1 ? "" : "s"} did not upload — add {failed === 1 ? "it" : "them"} again
            </p>
          )}
        </div>
      </div>

      <input 
        type="file" 
        className="hidden" 
        accept="image/*" 
        ref={fileInputRef}
        onChange={handleUpload}
        multiple={allowMultiple}
      />

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
          currentImageUrl && !allowMultiple
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
            : "bg-black text-white hover:bg-gray-800"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {progress && progress.total > 1 ? `${progress.done} / ${progress.total}` : "Uploading..."}
          </>
        ) : (
          <><UploadCloud size={16} /> {allowMultiple ? "Add Photos" : (currentImageUrl ? "Replace" : "Upload")}</>
        )}
      </button>
    </div>
  );
}
