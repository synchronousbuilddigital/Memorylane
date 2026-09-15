"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSectionDetails } from "@/app/actions/updateSection";
import SlotUploader from "./SlotUploader";
import FamilyClassicLayout from "./purpose-views/FamilyClassicLayout";
import FamilyMosaicLayout from "./purpose-views/FamilyMosaicLayout";
import TravelSuitcaseLayout from "./purpose-views/TravelSuitcaseLayout";
import Birthday3DLayout from "./purpose-views/Birthday3DLayout";
import FamilyFunction3DLayout from "./purpose-views/FamilyFunction3DLayout";
import Link from "next/link";
import { ChevronLeft, Share, X, Edit3 } from "lucide-react";

interface FixedSlotEditorProps {
  section: any;
}

export default function FixedSlotEditor({ section }: FixedSlotEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(section.title || "");
  const [description, setDescription] = useState(section.description || "");
  
  // Parse existing content JSON safely
  const initialContent = typeof section.content === 'string' ? JSON.parse(section.content) : (section.content || {});
  const [content, setContent] = useState<any>(initialContent);
  
  const [isPending, startTransition] = useTransition();
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);

  const handleUploadComplete = () => {
    router.refresh();
  };

  const handleSaveText = (newTitle: string = title, newDesc: string = description, newContent: any = content) => {
    startTransition(async () => {
      await updateSectionDetails(section.id, newTitle, newDesc, newContent);
      router.refresh();
    });
  };

  const handleContentChange = (key: string, value: string) => {
    const newContent = { ...content, [key]: value };
    setContent(newContent);
    handleSaveText(title, description, newContent);
  };

  // Determine configuration based on theme
  let LayoutComponent = null;
  let slotsConfig: { label: string, allowMultiple?: boolean, maxFiles?: number, dbPosition: number }[] = [];

  if (section.theme === "family-classic" || section.theme === "ribbon") {
    LayoutComponent = FamilyClassicLayout;
    slotsConfig = [
      { label: "Hero Background Slideshow", allowMultiple: true, maxFiles: 6, dbPosition: 0 },
      { label: "Animated Photo Ribbon", allowMultiple: true, maxFiles: 20, dbPosition: 1 },
      { label: "Interactive Scrapbook", allowMultiple: true, maxFiles: 20, dbPosition: 3 },
      { label: "Floating 3D Parallax Stack", allowMultiple: true, maxFiles: 15, dbPosition: 4 },
    ];
  } else if (section.theme === "family-mosaic" || section.theme === "everyday") {
    LayoutComponent = FamilyMosaicLayout;
    slotsConfig = [
      { label: "Large Horizontal (Top)", dbPosition: 0 },
      { label: "Small Square 1", dbPosition: 1 },
      { label: "Small Square 2", dbPosition: 2 },
      { label: "Tall Vertical (Right)", dbPosition: 3 },
      { label: "Large Horizontal (Middle)", dbPosition: 4 },
      { label: "Small Square 3", dbPosition: 5 },
      { label: "Tall Vertical (Left)", dbPosition: 6 },
      { label: "Small Square 4", dbPosition: 7 },
    ];
  } else if (section.theme === "travel-suitcase") {
    LayoutComponent = TravelSuitcaseLayout;
    slotsConfig = [
      { label: "Suitcase Polaroids (10-15)", allowMultiple: true, maxFiles: 15, dbPosition: 0 },
      { label: "Map Journey (10-15 images)", allowMultiple: true, maxFiles: 15, dbPosition: 1 },
      { label: "3D Tunnel Experience (8-24 images)", allowMultiple: true, maxFiles: 24, dbPosition: 2 },
      { label: "3D Vintage Astrolabe (up to 12 images)", allowMultiple: true, maxFiles: 12, dbPosition: 3 },
    ];
  } else if (section.theme === "event-birthday") {
    LayoutComponent = Birthday3DLayout;
    slotsConfig = [
      { label: "Floating Lanterns (10-15 images)", allowMultiple: true, maxFiles: 15, dbPosition: 0 },
      { label: "3D Gift Box Unwrap (5-10 images)", allowMultiple: true, maxFiles: 10, dbPosition: 1 },
      { label: "Ferris Wheel (10-24 images)", allowMultiple: true, maxFiles: 24, dbPosition: 2 },
      { label: "Magical Wishing Tree (10-14 images)", allowMultiple: true, maxFiles: 14, dbPosition: 3 },
    ];
  } else if (section.theme === "event-family") {
    LayoutComponent = FamilyFunction3DLayout;
    slotsConfig = [
      { label: "3D Spiraling Filmstrip (up to 50 images)", allowMultiple: true, maxFiles: 50, dbPosition: 0 },
      { label: "3D Hallway Gallery (up to 20 images)", allowMultiple: true, maxFiles: 20, dbPosition: 1 },
      { label: "Vintage Movie Projector (Infinite images)", allowMultiple: true, maxFiles: 100, dbPosition: 2 },
    ];
  }

  if (!LayoutComponent) {
    return <div className="p-8 text-center">Unsupported template.</div>;
  }

  // Ensure images are sorted by position and upload time
  const sortedImages = [...(section.images || [])].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
  });

  // Map images by position as arrays for slots that allow multiple
  const imagesByPosition = sortedImages.reduce((acc: Record<number, any[]>, img) => {
    if (!acc[img.position]) acc[img.position] = [];
    acc[img.position].push(img);
    return acc;
  }, {});

  // The Layout expects an array where index matches the slot.
  // For single-image slots, it passes the single image. For multiple, it passes the array.
  const layoutImages = slotsConfig.map((slot) => {
    const imagesForSlot = imagesByPosition[slot.dbPosition] || [];
    return slot.allowMultiple ? imagesForSlot : (imagesForSlot[0] || null);
  });

  const completedSlots = slotsConfig.filter((slot) => (imagesByPosition[slot.dbPosition] || []).length > 0).length;
  const totalSlots = slotsConfig.length;
  const progress = Math.round((completedSlots / totalSlots) * 100);

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
      
      {/* MOBILE FLOATING ACTION BUTTON */}
      <button 
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-black text-white px-8 py-3.5 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.3)] font-bold tracking-widest text-sm flex items-center gap-2 active:scale-95 transition-transform"
        onClick={() => setIsMobileEditorOpen(true)}
      >
        <Edit3 size={18} /> EDIT ALBUM
      </button>

      {/* LEFT: The Editor Panel (Slide-up Drawer on Mobile, Sidebar on Desktop) */}
      <div className={`
        fixed inset-0 z-40 bg-white flex flex-col transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
        md:relative md:w-[450px] lg:w-[500px] md:translate-y-0 md:h-screen md:border-r md:border-gray-200 md:shadow-2xl md:flex-shrink-0
        ${isMobileEditorOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
      `}>
        
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex justify-between items-center p-5 border-b border-gray-100 bg-white shrink-0">
          <span className="font-bold uppercase tracking-widest text-sm">Edit Album</span>
          <button 
            onClick={() => setIsMobileEditorOpen(false)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-white shrink-0">
          <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 hidden md:flex items-center gap-2 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Album Heading</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveText()}
                className="w-full p-2 border-b-2 border-gray-200 focus:border-black outline-none bg-transparent font-serif text-2xl font-bold text-gray-900 transition-colors"
                placeholder="My Family Memory"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Album Description & Notes</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveText()}
                className="w-full p-2 border-b-2 border-gray-200 focus:border-black outline-none bg-transparent text-sm text-gray-600 resize-none transition-colors"
                placeholder="These are some of my favorite moments..."
                rows={3}
              />
              {isPending && <span className="text-xs text-indigo-500 font-semibold mt-1 block animate-pulse">Saving...</span>}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-6 font-medium">Upload photos to the specific slots below to construct your page.</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-black h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span>{completedSlots} of {totalSlots}</span>
            <span>{progress}%</span>
          </div>
          </div>

          <div className="p-6 space-y-4 bg-gray-50/50 flex-1">
            {slotsConfig.map((slot, index) => {
            const images = imagesByPosition[slot.dbPosition] || [];
            return (
              <SlotUploader 
                key={slot.dbPosition}
                sectionId={section.id}
                position={slot.dbPosition}
                label={slot.label}
                currentImageUrl={images[0]?.displayUrl}
                allowMultiple={slot.allowMultiple}
                maxFiles={slot.maxFiles}
                imageCount={images.length}
                onUploadComplete={handleUploadComplete}
              />
            );
          })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <Link 
            href={`/share/${section.shareSlug || section.id}`}
            target="_blank"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-md transition-all"
          >
            <Share size={18} /> View Final Page
          </Link>
        </div>
      </div>

      {/* RIGHT: Live Preview (Scaled Down to fit) */}
      <div className="flex-1 h-screen overflow-y-auto bg-[#fdfbf7] relative">
        <div className="absolute top-4 left-4 z-20 bg-black/80 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none">
          Live Preview
        </div>
        
        {/* We render the actual layout. It will consume the images we pass it. */}
        <div className="w-full h-full">
          <LayoutComponent 
            images={sortedImages} 
            title={title} 
            description={description} 
            content={content}
            onTitleChange={(newTitle: string) => {
              setTitle(newTitle);
              handleSaveText(newTitle, description, content);
            }}
            onDescriptionChange={(newDescription: string) => {
              setDescription(newDescription);
              handleSaveText(title, newDescription, content);
            }}
            onContentChange={handleContentChange}
          />
        </div>
      </div>

    </div>
  );
}
