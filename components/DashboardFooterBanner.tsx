import Image from "next/image";
import { Sun, Heart } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./motion/Reveal";

export default function DashboardFooterBanner() {
  return (
    <div className="w-full flex flex-col pt-8 md:pt-12 pb-8">
      {/* Cinematic banner: portrait on phones, wide on desktop */}
      <Reveal amount={0.15}>
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[4/1] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-10 md:mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] group">
          <Image
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=2000"
            alt="Mountains Landscape"
            fill
            sizes="(max-width: 768px) 100vw, 1600px"
            className="object-cover animate-kenburns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl text-white/90 font-medium tracking-tight text-center drop-shadow-lg max-w-lg leading-tight mb-4">
              Memories are the stories we carry with us
            </h2>
            <div className="w-16 h-0.5 bg-white/50 rounded-full" />
            {/* the note sits under the title on phones… */}
            <p className="sm:hidden mt-8 font-handwriting text-2xl text-[#f4ebd8] text-center leading-[1.2] -rotate-3 drop-shadow">
              Collect Moments<br />Not Things ♡
            </p>
          </div>

          {/* …and floats beside it on larger screens */}
          <div className="hidden sm:flex absolute left-[5%] lg:left-[10%] top-1/2 -translate-y-1/2 w-32 md:w-56 aspect-[3/4] bg-[#f4ebd8] rotate-[-8deg] shadow-xl p-4 md:p-6 items-center justify-center pointer-events-none">
            <div className="absolute inset-0 border-[3px] border-dashed border-[#e5d5be]/50 opacity-50 m-1" />
            <p className="font-handwriting text-2xl md:text-4xl text-[#2c241b] text-center leading-[1.2] -rotate-3">
              Collect<br />Moments<br />Not Things<br /><span className="text-xl">♡</span>
            </p>
          </div>
        </div>
      </Reveal>

      {/* <footer className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Sun size={20} className="text-[#2c241b] fill-[#2c241b]" />
          <span className="font-serif text-xl font-black tracking-tight text-[#2c241b]">Memory Lane</span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[#5a4d41] font-semibold text-xs tracking-wider uppercase">
          <Link href="/" className="hover:text-[#1c1917] transition-colors">Home</Link>
          <Link href="/#albums" className="hover:text-[#1c1917] transition-colors">Albums</Link>
          <Link href="/#map" className="hover:text-[#1c1917] transition-colors">Map</Link>
          <Link href="/#favorites" className="hover:text-[#1c1917] transition-colors">Favorites</Link>
        </div>

        <p className="text-[#8a755b] text-xs font-medium flex items-center gap-1 text-center">
          Made with <Heart size={12} className="text-[#2c241b] fill-[#2c241b]" /> for beautiful moments.
        </p>
      </footer> */}
    </div>
  );
}
