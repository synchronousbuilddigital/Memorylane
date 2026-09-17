export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { viewerIsAdmin } from "@/lib/admin";
import { cleanupEmptySections } from "@/lib/emptySections";
import { SHOWCASE, SCENE_COUNT } from "@/lib/templatesShowcase";
import Navbar from "@/components/Navbar";
import HomeAlbumList, { type AlbumSection } from "@/components/HomeAlbumList";
import DashboardPurposeSelector from "@/components/DashboardPurposeSelector";
import DashboardFooterBanner from "@/components/DashboardFooterBanner";
import HomeDoodles from "@/components/HomeDoodles";
import HomeIntro from "@/components/HomeIntro";
import { Reveal } from "@/components/motion/Reveal";
import HomeHero from "@/components/home/HomeHero";
import LiveNumbers from "@/components/home/LiveNumbers";
import TemplateShowcase from "@/components/home/TemplateShowcase";
import HowItWorks from "@/components/home/HowItWorks";
import ScrollProgress from "@/components/home/ScrollProgress";
import PaperGrain from "@/components/home/PaperGrain";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const admin = await viewerIsAdmin();

  // the page's numbers are the platform's real numbers
  const [albumCount, photoCount] = await Promise.all([prisma.section.count(), prisma.image.count()]);

  let sections: AlbumSection[] = [];
  if (isLoggedIn) {
    await cleanupEmptySections(session!.user!.id!);
    sections = await prisma.section.findMany({
      where: { userId: session!.user!.id! },
      include: { images: { include: { notes: true } }, stickyNotes: true },
      orderBy: { createdAt: "desc" },
    });
  }

  const handleSignOut = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  };

  const stats = [
    { label: "Templates", value: SHOWCASE.length, sub: "each a different world" },
    { label: "Cinematic scenes", value: SCENE_COUNT, sub: "built in real 3D" },
    { label: "Albums created", value: albumCount, sub: "and counting" },
    { label: "Photos preserved", value: photoCount, suffix: "+", sub: "shared with the people in them" },
  ];

  return (
    <HomeIntro>
      <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917] selection:bg-[#d9cbb8]/50 relative overflow-hidden">
        <ScrollProgress />
        <PaperGrain />
        <HomeDoodles />

        <Navbar signOutAction={handleSignOut} session={session} isAdmin={admin} />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 pt-24 md:pt-32 pb-16 space-y-20 md:space-y-28">
          <HomeHero templateCount={SHOWCASE.length} sceneCount={SCENE_COUNT} />

          <Reveal amount={0.3}>
            <LiveNumbers stats={stats} />
          </Reveal>

          <TemplateShowcase templates={SHOWCASE} />

          <HowItWorks />

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
