export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { viewerIsAdmin } from "@/lib/admin";
import { cleanupEmptySections } from "@/lib/emptySections";
import { SHOWCASE, SCENE_COUNT } from "@/lib/templatesShowcase";
import Navbar from "@/components/Navbar";
import HomeAlbumList from "@/components/HomeAlbumList";
import DashboardPurposeSelector from "@/components/DashboardPurposeSelector";
import DashboardFooterBanner from "@/components/DashboardFooterBanner";
import HomeDoodles from "@/components/HomeDoodles";
import HomeIntro from "@/components/HomeIntro";
import { Reveal } from "@/components/motion/Reveal";
import HomeHero from "@/components/home/HomeHero";
import LiveNumbers from "@/components/home/LiveNumbers";
import TemplateShowcase, { TemplateStage } from "@/components/home/TemplateShowcase";
import HowItWorks from "@/components/home/HowItWorks";
import ScrollProgress from "@/components/home/ScrollProgress";
import PaperGrain from "@/components/home/PaperGrain";

const getGlobalStats = unstable_cache(
  async () => {
    try {
      const [albumCount, photoCount] = await Promise.all([
        prisma.section.count(),
        prisma.image.count(),
      ]);
      return { albumCount, photoCount };
    } catch (e) {
      console.error("Failed to fetch global stats:", e);
      return { albumCount: 0, photoCount: 0 };
    }
  },
  ["global-stats"],
  { revalidate: 60 } // revalidate every 60 seconds
);

async function GlobalStatsAsync() {
  const { albumCount, photoCount } = await getGlobalStats();

  const stats = [
    { label: "Templates", value: SHOWCASE.length, sub: "each a different world" },
    { label: "Cinematic scenes", value: SCENE_COUNT, sub: "built in real 3D" },
    { label: "Albums created", value: albumCount, sub: "and counting" },
    { label: "Photos preserved", value: photoCount, suffix: "+", sub: "shared with the people in them" },
  ];

  return <LiveNumbers stats={stats} />;
}

function GlobalStatsFallback() {
  const stats = [
    { label: "Templates", value: SHOWCASE.length, sub: "each a different world" },
    { label: "Cinematic scenes", value: SCENE_COUNT, sub: "built in real 3D" },
    { label: "Albums created", value: 0, sub: "loading..." },
    { label: "Photos preserved", value: 0, suffix: "+", sub: "loading..." },
  ];
  return <LiveNumbers stats={stats} />;
}

async function UserAlbumsAsync({ userId }: { userId: string }) {
  try {
    // Non-blocking cleanup
    cleanupEmptySections(userId).catch(e => console.error("Cleanup failed:", e));

    const sections = await prisma.section.findMany({
      where: { userId },
      include: { images: { include: { notes: true } }, stickyNotes: true },
      orderBy: { createdAt: "desc" },
    });

    return (
      <Reveal id="albums" className="scroll-mt-28" amount={0.05}>
        <HomeAlbumList sections={sections} layout="strip" />
      </Reveal>
    );
  } catch (error) {
    console.error("Failed to fetch user sections:", error);
    return (
      <div className="py-20 text-center text-[#5a4d41] font-serif italic">
        We ran into an issue loading your albums. Please try refreshing.
      </div>
    );
  }
}

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const admin = await viewerIsAdmin();

  const handleSignOut = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  };

  return (
    <HomeIntro>
      <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917] selection:bg-[#d9cbb8]/50 relative overflow-x-clip">
        <ScrollProgress />
        <PaperGrain />
        <HomeDoodles />

        <Navbar signOutAction={handleSignOut} session={session} isAdmin={admin} />

        <main className="relative z-10 w-full pt-24 md:pt-32 pb-16">
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-12 space-y-20 md:space-y-28">
            <HomeHero templateCount={SHOWCASE.length} sceneCount={SCENE_COUNT} />

            <Reveal amount={0.3}>
              <Suspense fallback={<GlobalStatsFallback />}>
                <GlobalStatsAsync />
              </Suspense>
            </Reveal>

            <TemplateShowcase templates={SHOWCASE} />
          </div>

          {/* the pinned stage runs edge to edge, outside the page gutter */}
          <TemplateStage templates={SHOWCASE} />

          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-12 space-y-20 md:space-y-28 mt-20 md:mt-28">
            <HowItWorks />

            <Reveal id="create" className="scroll-mt-28">
              <DashboardPurposeSelector isLoggedIn={isLoggedIn} />
            </Reveal>

            {isLoggedIn && (
              <Suspense fallback={<div className="py-20 text-center text-[#5a4d41]">Loading your albums...</div>}>
                <UserAlbumsAsync userId={session!.user!.id!} />
              </Suspense>
            )}

            <DashboardFooterBanner />
          </div>
        </main>
      </div>
    </HomeIntro>
  );
}
