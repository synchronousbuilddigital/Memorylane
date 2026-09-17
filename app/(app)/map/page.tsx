import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JourneyMap from "@/components/map/JourneyMap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { viewerIsAdmin } from "@/lib/admin";
import PaperGrain from "@/components/home/PaperGrain";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/"); // Or to a login page
  }

  const admin = await viewerIsAdmin();
  const userId = session.user.id;

  const handleSignOut = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  };

  // Fetch all user albums ordered from oldest to newest (Journey timeline)
  const sections = await prisma.section.findMany({
    where: { userId },
    include: { images: { take: 3, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917] selection:bg-[#d9cbb8]/50 relative overflow-x-clip">
      <PaperGrain />
      <Navbar signOutAction={handleSignOut} session={session} isAdmin={admin} />
      
      <main className="relative z-10 w-full pt-32 pb-32">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-24">
            <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-black text-[#1c1917] leading-[1.1] tracking-tighter mb-4">
              Your Journey of Life
            </h1>
            <p className="text-[#5a4d41] text-lg font-medium max-w-xl mx-auto">
              Every memory is a stop along the way. Follow the path you've built.
            </p>
          </div>
          
          <JourneyMap sections={sections} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
