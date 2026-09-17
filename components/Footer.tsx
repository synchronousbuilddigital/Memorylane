"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#1c1917] rounded-[1.5rem] md:rounded-[2rem] mx-4 sm:mx-6 md:mx-12 mb-8 pt-16 pb-8 px-6 sm:px-12 md:px-20 overflow-hidden shadow-2xl">
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#3d3329] to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 relative z-10">
        
        {/* Left Side: Polaroid & Branding */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start text-center lg:text-left gap-8 lg:gap-12">
          {/* Polaroid Graphic Cluster */}
          <div className="relative shrink-0 w-64 h-60 mt-4 mx-auto lg:mx-0">
            {/* Background sticky note */}
            <div className="absolute top-0 left-12 w-28 h-32 bg-[#f4ebd8] rotate-[-6deg] shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-[#e5d5be] p-3 pt-4 text-center font-handwriting text-xl text-[#2c241b] leading-tight z-0">
              New<br/>Stories<br/>Await ♡
            </div>

            {/* Left Polaroid */}
            <div className="absolute top-10 -left-2 rotate-[-12deg] shadow-[0_12px_24px_rgba(0,0,0,0.4)] bg-white p-2 pb-7 w-32 border border-[#e8e0d5] z-10 transition-transform duration-500 hover:rotate-[-8deg] hover:scale-105 hover:z-30">
              <div className="relative w-full aspect-[3/4] bg-[#f4eee6] overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=300" alt="Good Memories" fill className="object-cover" />
              </div>
              <div className="absolute bottom-1.5 left-0 right-0 text-center font-handwriting text-[#2c241b] text-base rotate-[-2deg]">Good Memories</div>
            </div>

            {/* Right Polaroid */}
            <div className="absolute top-12 left-28 rotate-[10deg] shadow-[0_12px_24px_rgba(0,0,0,0.4)] bg-white p-2 pb-7 w-32 border border-[#e8e0d5] z-10 transition-transform duration-500 hover:rotate-[6deg] hover:scale-105 hover:z-30">
              <div className="relative w-full aspect-[3/4] bg-[#f4eee6] overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=300" alt="Brighter Days" fill className="object-cover" />
              </div>
              <div className="absolute bottom-1.5 left-0 right-0 text-center font-handwriting text-[#2c241b] text-base rotate-[1deg]">Brighter Days</div>
            </div>

            {/* Middle Polaroid */}
            <div className="absolute top-4 left-10 rotate-[-2deg] shadow-[0_16px_32px_rgba(0,0,0,0.5)] bg-white p-2.5 pb-8 w-[150px] border border-[#e8e0d5] z-20 transition-transform duration-500 hover:rotate-[0deg] hover:scale-105">
              <div className="relative w-full aspect-[4/5] bg-[#f4eee6] overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=300" alt="Just Moment" fill className="object-cover" />
              </div>
              <div className="absolute bottom-1.5 left-0 right-0 text-center font-handwriting text-[#2c241b] text-lg">Just Moment</div>
              {/* Tape detail on middle polaroid */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-5 bg-[#f4ebd8]/90 backdrop-blur-sm shadow-sm rotate-1 border border-white/40" />
            </div>
          </div>

          <div className="max-w-sm mt-4 lg:mt-10">
            <h3 className="font-serif font-black text-white text-2xl mb-3">Memory Lane</h3>
            <p className="text-[#d9cbb8] text-sm leading-relaxed">
              Preserve your most cherished moments in cinematic, beautiful 3D albums. 
              Because memories are the stories we carry with us.
            </p>
          </div>
        </div>

        {/* Right Side: Details & Contact */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right mt-8 md:mt-6">
          <h4 className="font-serif font-bold text-white text-lg mb-6 md:mb-4">Get in touch</h4>
          
          <ul className="space-y-6 md:space-y-4 text-sm text-[#d9cbb8]">
            <li>
              <a href="mailto:synchronousbuilddigital@gmail.com" className="group flex flex-col md:flex-row items-center md:justify-end gap-3 hover:text-white transition-colors">
                <span className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-[#2c241b] flex items-center justify-center text-[#e6c56d] group-hover:bg-white group-hover:text-[#1c1917] transition-colors md:order-last mb-2 md:mb-0">
                  <Mail size={16} className="md:w-3.5 md:h-3.5" />
                </span>
                <span className="group-hover:underline underline-offset-4 decoration-[#e6c56d]">synchronousbuilddigital@gmail.com</span>
              </a>
            </li>
            <li className="flex flex-col md:flex-row items-center md:justify-end gap-3">
              <span className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-[#2c241b] flex items-center justify-center text-[#e6c56d] md:order-last mb-2 md:mb-0">
                <Heart size={16} className="md:w-3.5 md:h-3.5" />
              </span>
              <span>Made with love by Synchronous</span>
            </li>
          </ul>

        </div>

      </div>

      <div className="max-w-[1400px] mx-auto border-t border-[#3d3329] mt-16 md:mt-12 pt-8 md:pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 text-xs text-[#a3907a] font-medium uppercase tracking-widest relative z-10 text-center sm:text-left">
        <p>© {new Date().getFullYear()} Memory Lane. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
