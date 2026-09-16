export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import HomeAlbumList from "@/components/HomeAlbumList";
import DashboardPurposeSelector from "@/components/DashboardPurposeSelector";
import DashboardHero from "@/components/DashboardHero";
import DashboardFooterBanner from "@/components/DashboardFooterBanner";
import HomeDoodles from "@/components/HomeDoodles";
import { Reveal } from "@/components/motion/Reveal";
import HomeIntro from "@/components/HomeIntro";
import { cleanupEmptySections } from "@/lib/emptySections";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  let sections: any[] = [];
  if (isLoggedIn) {
    await cleanupEmptySections(session!.user!.id!);
    sections = await prisma.section.findMany({
      where: { userId: session!.user!.id! },
      include: { 
        images: { include: { notes: true } },
        stickyNotes: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const handleSignOut = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  };

  return (
    <HomeIntro>
    <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917] selection:bg-[#d9cbb8]/50 relative overflow-hidden">
      {/* Background doodles: sketched on, drifting with the scroll */}
      <HomeDoodles />

      <Navbar signOutAction={handleSignOut} session={session} />

      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 pt-24 md:pt-32 pb-16 space-y-10 md:space-y-12">
        <DashboardHero isLoggedIn={isLoggedIn} />

        <Reveal id="create" className="scroll-mt-28">
          <DashboardPurposeSelector isLoggedIn={isLoggedIn} />
        </Reveal>

        {isLoggedIn && (
          <Reveal id="albums" className="scroll-mt-28" amount={0.05}>
            <HomeAlbumList sections={sections} layout="strip" />
          </Reveal>
        )}

        <DashboardFooterBanner />
      </main>
    </div>
    </HomeIntro>
  );
}
