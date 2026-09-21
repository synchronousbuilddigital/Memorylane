export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/profile";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaperGrain from "@/components/home/PaperGrain";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const viewer = await currentProfile();
  if (!viewer) redirect("/login");
  const session = await auth();

  const handleSignOut = async () => {
    "use server";
    const { signOut } = await import("@/lib/auth");
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917] selection:bg-[#d9cbb8]/50 relative overflow-x-clip">
      <PaperGrain />
      <Navbar signOutAction={handleSignOut} session={session} isAdmin={viewer.isAdmin} viewer={viewer} />

      <main className="relative z-10 w-full pt-28 md:pt-36 pb-20">
        <div className="mx-auto w-full max-w-[760px] px-4 sm:px-6 md:px-12">
          <header className="mb-8 md:mb-10">
            <h1 className="font-serif font-black tracking-tight text-[#1c1917]" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
              Your profile
            </h1>
            <p className="mt-2 text-[#5a4d41]">
              This is yours alone. Nothing here appears on an album you share.
            </p>
          </header>

          <div className="rounded-3xl border border-[#e8e0d5] bg-[#fdfbf7] p-6 md:p-8 shadow-[0_18px_44px_-24px_rgba(28,25,23,0.25)]">
            <ProfileForm viewer={viewer} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
