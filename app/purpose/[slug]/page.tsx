import { notFound } from "next/navigation";
import { createFixedTemplateAction } from "@/app/actions/createFixedTemplate";
import FamilyClassicLayout from "@/components/purpose-views/FamilyClassicLayout";
import TravelSuitcaseLayout from "@/components/purpose-views/TravelSuitcaseLayout";
import Birthday3DLayout from "@/components/purpose-views/Birthday3DLayout";
import FamilyFunction3DLayout from "@/components/purpose-views/FamilyFunction3DLayout";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";

// Temporary mapping for purpose defaults
const PURPOSE_DEFAULTS: Record<string, { theme: string, Layout: any, label: string }> = {
  family: {
    theme: "family-classic",
    Layout: FamilyClassicLayout,
    label: "Family"
  },
  travel: {
    theme: "travel-suitcase",
    Layout: TravelSuitcaseLayout,
    label: "Travel"
  },
  birthday: {
    theme: "event-birthday",
    Layout: Birthday3DLayout,
    label: "Birthday Party"
  },
  "family-function": {
    theme: "event-family",
    Layout: FamilyFunction3DLayout,
    label: "Family Function"
  },
  party: {
    theme: "event-party",
    Layout: Birthday3DLayout, // Temp fallback
    label: "General Event / Party"
  }
};

export default async function PurposeHubPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const config = PURPOSE_DEFAULTS[params.slug];
  if (!config) notFound();

  const { Layout, label, theme } = config;

  return (
    <div className="relative bg-[#fdfbf7] min-h-screen">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-start pointer-events-none">
        <Link 
          href="/" 
          className="pointer-events-auto bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 text-sm font-semibold hover:bg-white transition-all text-gray-700"
        >
          <ChevronLeft size={16} /> Home
        </Link>
      </nav>

      {/* 
        The Fixed CTA Overlay 
        This is what the user clicks to actually create their album after viewing the default animations
      */}
      <div className={`fixed bottom-0 left-0 w-full p-6 z-50 flex justify-center pb-8 pointer-events-none ${
        theme === 'travel-suitcase' ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-gradient-to-t from-white via-white/80 to-transparent'
      }`}>
        <div className={`pointer-events-auto p-6 rounded-3xl shadow-2xl border max-w-md w-full text-center flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-500 ${
          theme === 'travel-suitcase' ? 'bg-[#1f120c]/90 backdrop-blur-md border-[#3a2215]' : 'bg-white border-gray-100'
        }`}>
          <div>
            <h3 className={`font-serif font-bold text-xl ${theme === 'travel-suitcase' ? 'text-[#f7f1e6]' : 'text-gray-900'}`}>Make this your own</h3>
            <p className={`text-sm mt-1 ${theme === 'travel-suitcase' ? 'text-[#b49877]' : 'text-gray-500'}`}>Swap these placeholder images with your own memories.</p>
          </div>
          
          {isLoggedIn ? (
            <form action={createFixedTemplateAction} className="w-full">
              <input type="hidden" name="purpose" value={params.slug} />
              <input type="hidden" name="theme" value={theme} />
              <button 
                type="submit"
                className={`w-full py-3 rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                  theme === 'travel-suitcase' ? 'bg-[#f7f1e6] text-[#1f120c] hover:bg-white' : 'bg-[#2c241b] text-white hover:bg-black'
                }`}
              >
                Create My {label} Album
              </button>
            </form>
          ) : (
            <Link 
              href="/login"
              className={`w-full py-3 rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center ${
                theme === 'travel-suitcase' ? 'bg-[#f7f1e6] text-[#1f120c] hover:bg-white' : 'bg-[#2c241b] text-white hover:bg-black'
              }`}
            >
              Log in to Create
            </Link>
          )}
        </div>
      </div>

      {/* Render the default beautiful layout with empty images (which triggers the gorgeous placeholders we set up) */}
      <Layout images={[]} />
    </div>
  );
}
