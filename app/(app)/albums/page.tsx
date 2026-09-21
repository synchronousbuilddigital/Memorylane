export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { currentProfile } from "@/lib/profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import HomeAlbumList from "@/components/HomeAlbumList";
import DashboardFooterBanner from "@/components/DashboardFooterBanner";
import HomeDoodles from "@/components/HomeDoodles";
import { cleanupEmptySections } from "@/lib/emptySections";

/* Every album the user owns, with the full toolbar. `?filter=favorites` etc. preselects a pill. */
export default async function AlbumsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const viewer = await currentProfile();
  const admin = !!viewer?.isAdmin;

  await cleanupEmptySections(session.user.id);
  const sections = await prisma.section.findMany({
    where: { userId: session.user.id },
    include: { images: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const handleSignOut = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917] selection:bg-[#d9cbb8]/50 relative overflow-hidden">
      <HomeDoodles />
      <Navbar signOutAction={handleSignOut} session={session} isAdmin={admin} viewer={viewer} />

      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 pt-28 md:pt-36 pb-16 space-y-10 md:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#8a755b]">Your collection</span>
          <Link href="/#create" className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#1c1917] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[#3d3329] transition-colors">
            <Plus size={16} /> New memory lane
          </Link>
        </div>

        <HomeAlbumList
          sections={sections}
          layout="grid"
          initialFilter={searchParams.filter}
          title="All your albums"
          subtitle="Every lane you have made, in one place. Filter, search, and keep your favourites close."
        />

        <DashboardFooterBanner />
      </main>
    </div>
  );
}
