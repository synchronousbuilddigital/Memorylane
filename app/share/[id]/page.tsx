import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import FamilyViewPage from "@/components/purpose-views/FamilyViewPage";
import DefaultViewPage from "@/components/purpose-views/DefaultViewPage";
import TravelSuitcaseLayout from "@/components/purpose-views/TravelSuitcaseLayout";
import Birthday3DLayout from "@/components/purpose-views/Birthday3DLayout";
import FamilyFunction3DLayout from "@/components/purpose-views/FamilyFunction3DLayout";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const idOrSlug = params.id;
  const section = await prisma.section.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { shareSlug: idOrSlug }
      ]
    },
    include: {
      images: {
        take: 1,
        orderBy: { position: "asc" }
      }
    }
  });

  if (!section) {
    return { title: "Album Not Found | Memory Lane" };
  }

  const imageUrl = section.images.length > 0 ? section.images[0].displayUrl : null;

  return {
    title: `${section.title} | Memory Lane`,
    description: "Check out my memory album!",
    openGraph: {
      title: section.title,
      description: "View my memory album created with Memory Lane.",
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: section.title,
      description: "View my memory album created with Memory Lane.",
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function PublicSharePage({ params }: Props) {
  const idOrSlug = params.id;

  const section = await prisma.section.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { shareSlug: idOrSlug }
      ]
    },
    include: { 
      images: { include: { notes: true }, orderBy: { position: "asc" } },
      stickyNotes: true,
    },
  });

  if (!section) notFound();

  // Dispatch to Dedicated Purpose Views
  let ViewComponent = <DefaultViewPage section={section} />;
  
  if (section.purpose === "family") {
    ViewComponent = <FamilyViewPage section={section} />;
  } else if (section.purpose === "travel") {
    ViewComponent = <TravelSuitcaseLayout images={section.images} />;
  } else if (section.purpose === "birthday" || section.theme === "event-birthday") {
    ViewComponent = (
      <Birthday3DLayout 
        images={section.images} 
        title={section.title} 
        description={section.description} 
        content={section.content}
      />
    );
  } else if (section.theme === "event-family") {
    ViewComponent = (
      <FamilyFunction3DLayout 
        images={section.images} 
        title={section.title} 
        description={section.description} 
        content={section.content}
      />
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#080510]">
      {/* Floating Back Button */}
      <Link 
        href="/"
        className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/90 text-sm font-medium rounded-full transition-all border border-white/10 shadow-lg"
      >
        <ChevronLeft size={16} />
        Back to Home
      </Link>
      
      {ViewComponent}
    </div>
  );
}
