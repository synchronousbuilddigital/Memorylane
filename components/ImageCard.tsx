"use client";

import { Image, Note } from "@prisma/client";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { deleteImageAction } from "@/app/actions/deleteImage";
import { useState, useRef, useTransition } from "react";
import { addNoteAction } from "@/app/actions/addNote";

interface ImageCardProps {
  image: Image & { notes?: Note[] };
  index: number;
  layoutType: string;
  onClick?: () => void;
  readOnly?: boolean;
}

export default function ImageCard({ image, index, layoutType, onClick, readOnly = false }: ImageCardProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Slider layout now also acts as a Polaroid card
  const isPolaroid = layoutType === "polaroid" || layoutType === "slider";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this memory?")) {
      startDeleteTransition(async () => {
        await deleteImageAction(image.id);
      });
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip if we are clicking a button or form element inside the card
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('form')) {
      return;
    }
    
    // Toggle flip state
    setIsFlipped(!isFlipped);
    
    // Also trigger the external onClick (which might trigger lightbox, though we might want to disable lightbox if they just want to flip)
    // Actually, if they want to read notes, clicking should flip. Maybe double click for lightbox? Or a button for lightbox.
    // For now, let's let it flip. 
    if (onClick && !isFlipped) {
      // maybe don't call onClick if we are flipping to read notes, to avoid opening lightbox immediately
      // onClick(); 
    }
  };

  const handleAddNote = async (formData: FormData) => {
    const text = formData.get("text") as string;
    if (!text.trim()) return;
    
    setIsAddingNote(true);
    try {
      await addNoteAction(image.id, text);
      formRef.current?.reset();
    } finally {
      setIsAddingNote(false);
    }
  };

  // Hydration-safe date formatter
  const formatDate = (dateString: Date | string) => {
    const d = new Date(dateString);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px) grayscale(100%)" }}
      whileInView={{ opacity: 1, filter: "blur(0px) grayscale(0%)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      className={clsx(
        "relative group h-full w-full",
        isPolaroid 
          ? "transition-transform duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:z-20 z-10"
          : "transition-all duration-300 hover:-translate-y-1 rounded-sm"
      )}
      style={{ perspective: "1000px" }}
    >
      <div 
        onClick={handleCardClick}
        className={clsx(
          "w-full h-full relative transition-transform duration-700 cursor-pointer shadow-md group-hover:shadow-xl",
          isPolaroid ? "rounded-sm" : "rounded-sm"
        )}
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* === FRONT OF CARD === */}
        <div 
          className={clsx(
            "absolute inset-0 w-full h-full backface-hidden",
            isPolaroid ? "bg-[#FCFBFA] p-3 pb-14 border border-black/5" : "overflow-hidden rounded-sm"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* The Pushpin */}
          {isPolaroid && (
            <div className="absolute -top-3 right-4 w-6 h-6 z-30 drop-shadow-md">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-inner relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-100 shadow-sm absolute top-1 left-1 blur-[1px]"></div>
              </div>
              <div className="w-8 h-2 bg-black/20 rounded-full blur-[2px] absolute -bottom-1 -left-2 transform rotate-12"></div>
            </div>
          )}

          <img
            src={image.thumbUrl}
            alt={`Photo uploaded on ${formatDate(image.uploadedAt)}`}
            className={clsx(
              "w-full h-full object-cover",
              !isPolaroid && "rounded-sm",
              isDeleting && "opacity-50"
            )}
          />

          {/* Delete Button (Visible on Hover) */}
          {!readOnly && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="absolute top-4 left-4 z-40 bg-gray-50 hover:bg-red-600 text-gray-900 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md backdrop-blur-sm"
              title="Delete this memory"
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* Date Stamp */}
          {image.takenAt && (
            isPolaroid ? (
              <div className="absolute bottom-4 right-4 text-ink/70 text-sm font-serif transform rotate-[-2deg]">
                {formatDate(image.takenAt)}
              </div>
            ) : (
              <div className="absolute bottom-2 right-2 bg-stamp text-ink text-xs font-serif px-2 py-1 transform rotate-[-2deg] opacity-80 shadow-sm border border-black/10">
                {formatDate(image.takenAt)}
              </div>
            )
          )}
        </div>

        {/* === BACK OF CARD === */}
        <div 
          className={clsx(
            "absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center bg-[#FDFCF0] border border-black/10 shadow-inner p-6",
            isPolaroid ? "rounded-sm" : "rounded-sm"
          )}
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(180deg)",
            backgroundImage: "radial-gradient(#00000010 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        >
          <div className="w-full h-full flex flex-col">
            <h4 className="font-serif italic text-black/40 border-b border-black/10 pb-2 mb-4 text-center">Memories</h4>
            
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
              {image.notes && image.notes.length > 0 ? (
                image.notes.map((note) => (
                  <p key={note.id} className="font-serif italic text-lg text-black/80 leading-relaxed" style={{ color: note.color }}>
                    &ldquo;{note.text}&rdquo;
                  </p>
                ))
              ) : (
                <p className="text-black/30 font-serif italic text-center mt-10">No notes written yet...</p>
              )}
            </div>

            {!readOnly && (
              <form ref={formRef} action={handleAddNote} className="mt-4 pt-4 border-t border-black/10 flex flex-col gap-2">
                <input 
                  type="text" 
                  name="text" 
                  placeholder="Write a memory..." 
                  required
                  className="w-full bg-transparent border-b border-black/20 focus:outline-none focus:border-black/60 font-serif italic text-black placeholder:text-black/30 px-2 py-1"
                />
                <button 
                  type="submit" 
                  disabled={isAddingNote}
                  className="self-end text-xs font-bold uppercase tracking-wider text-black/50 hover:text-black transition-colors disabled:opacity-50"
                >
                  {isAddingNote ? "Saving..." : "Add Note"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
