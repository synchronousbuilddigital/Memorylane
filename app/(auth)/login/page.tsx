export const dynamic = "force-dynamic";
import { signIn } from "@/lib/auth";
import Image from "next/image";
import { Lock, Tent, Heart, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#eee9e0] relative overflow-hidden flex items-center justify-center font-sans selection:bg-[#d9cbb8]/50">
      
      {/* Background Texture Overlay (Subtle Grain) */}
      <div 
        className="absolute inset-0 opacity-60 mix-blend-multiply pointer-events-none z-0" 
        style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/handmade-paper.png")` }}
      ></div>

      {/* SVG Filters for Effects */}
      <svg className="absolute w-0 h-0">
        <filter id="rough-edge">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Decorative Background Flowers, Leaves & Pen Doodles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        
        {/* ===================== */}
        {/* PEN DIAGRAMS / DOODLES */}
        {/* ===================== */}
        
        {/* Top Left Swirl */}
        <svg className="absolute top-20 left-40 w-32 h-32 text-[#a89987] -rotate-12 opacity-60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10,50 Q25,10 40,50 T70,50 T95,30" />
        </svg>

        {/* Center Left Stars */}
        <svg className="absolute top-[40%] left-10 w-20 h-20 text-[#a89987] rotate-12 opacity-50" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z" />
          <path d="M20,20 L25,30 L35,35 L25,40 L20,50 L15,40 L5,35 L15,30 Z" className="scale-50 origin-center translate-x-8 -translate-y-8" />
        </svg>

        {/* Bottom Left Camera Doodle */}
        <svg className="absolute bottom-20 left-32 w-24 h-24 text-[#a89987] -rotate-[15deg] opacity-40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="20" y="35" width="60" height="45" rx="5" />
          <circle cx="50" cy="57" r="12" />
          <path d="M35,35 L40,25 L60,25 L65,35" />
          <circle cx="70" cy="45" r="2" fill="currentColor" />
        </svg>

        {/* Top Right Paper Plane */}
        <svg className="absolute top-10 right-1/4 w-24 h-24 text-[#a89987] rotate-[25deg] opacity-50" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10,50 L90,20 L60,90 L50,60 Z" />
          <path d="M50,60 L90,20" />
          <path d="M10,50 L40,90 L50,60" strokeDasharray="2 4" />
        </svg>

        {/* Center Right Heart */}
        <svg className="absolute top-[60%] right-20 w-16 h-16 text-[#a89987] rotate-[15deg] opacity-60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50,85 C50,85 15,55 15,35 C15,20 30,15 40,25 C50,35 50,35 50,35 C50,35 50,35 60,25 C70,15 85,20 85,35 C85,55 50,85 50,85 Z" />
        </svg>

        {/* Bottom Center Arrows */}
        <svg className="absolute bottom-10 left-[45%] w-32 h-32 text-[#a89987] -rotate-[10deg] opacity-40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20,50 Q50,20 80,50" />
          <path d="M70,40 L80,50 L70,60" />
          <path d="M20,60 Q50,90 80,60" strokeDasharray="4 4" />
          <path d="M70,50 L80,60 L70,70" />
        </svg>

        {/* ===================== */}
        {/* DRIED FLOWERS / IMAGES */}
        {/* ===================== */}
        {/* Top Left Dried Flower */}
        <div className="absolute top-10 left-20 opacity-80 rotate-[-20deg]">
          <Image src="https://images.unsplash.com/photo-1603533867307-b354255e3c32?auto=format&fit=crop&q=80&w=200" alt="Dried flower" width={150} height={150} className="object-cover rounded-full mix-blend-multiply opacity-50 blur-[1px] grayscale sepia" />
        </div>
        {/* Bottom Right Leaves */}
        <div className="absolute bottom-10 right-10 opacity-90 rotate-[15deg] z-50">
          <svg width="120" height="180" viewBox="0 0 100 150" fill="none" stroke="#2c241b" strokeWidth="1.5">
            <path d="M50 150 Q50 80 80 20 Q40 40 50 80 Q20 50 10 90 Q40 90 50 130" fill="#4a5d23" opacity="0.8" stroke="none" />
            <path d="M50 150 Q50 80 80 20" />
            <path d="M80 20 Q90 30 70 50" fill="#4a5d23" opacity="0.6" stroke="none" />
            <path d="M10 90 Q15 100 30 95" fill="#4a5d23" opacity="0.6" stroke="none" />
          </svg>
        </div>
        {/* Center Top Sprig */}
        <div className="absolute top-[-2%] left-[45%] opacity-70 rotate-[80deg]">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="#685a4f" strokeWidth="2">
            <path d="M10 90 Q40 60 90 10" />
            <circle cx="80" cy="20" r="4" fill="#685a4f" />
            <circle cx="60" cy="30" r="3" fill="#685a4f" />
            <circle cx="40" cy="50" r="4" fill="#685a4f" />
            <circle cx="30" cy="70" r="3" fill="#685a4f" />
          </svg>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="relative w-full max-w-[1600px] min-h-screen flex flex-col lg:flex-row items-center justify-between p-4 lg:p-12 z-10 gap-8 lg:gap-32">
        
        {/* ======================= */}
        {/* LEFT SIDE: SCRAPBOOK COLLAGE */}
        {/* ======================= */}
        <div className="w-full lg:w-[55%] h-[700px] lg:h-[900px] relative flex items-center justify-center">
          
          {/* Top Left Handwriting */}
          <div className="absolute top-[8%] left-[2%] font-handwriting text-4xl lg:text-5xl text-[#3b342e] -rotate-6 leading-tight z-10 opacity-90 drop-shadow-sm">
            Little<br/>Moments<br/>Big Stories ♡
          </div>

          {/* Map Snippet Background (Bottom Left) */}
          <div className="absolute bottom-[2%] left-[-5%] w-80 h-96 lg:w-96 lg:h-[420px] bg-[#e8decd] rounded-sm -rotate-12 shadow-sm z-0 overflow-hidden mix-blend-multiply opacity-80 border border-[#d5c7b3]">
            <Image 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
              alt="Vintage Map" 
              fill 
              className="object-cover opacity-60 grayscale sepia-[.5]"
            />
          </div>

          {/* POLAROID 1: Mountains (Top Right/Back) */}
          <div className="absolute top-[2%] right-[2%] w-64 lg:w-80 bg-[#fdfbf7] p-4 pb-14 lg:pb-16 shadow-[0_15px_30px_rgba(0,0,0,0.15)] rounded-sm rotate-[6deg] z-20 border border-[#e5dfd5]">
            {/* Tape */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-6 bg-[#f4ead5]/80 backdrop-blur-sm -rotate-3 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"></div>
            
            <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
              <Image 
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800" 
                alt="Mountains" 
                fill 
                className="object-cover sepia-[.2]"
              />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-handwriting text-3xl text-[#3b342e] whitespace-nowrap -rotate-2">
              Good Vibes
            </div>
          </div>

          {/* POLAROID 2: Sunset Couple (Center/Front) */}
          <div className="absolute top-[22%] left-[10%] w-[320px] lg:w-[500px] bg-[#fdfbf7] p-5 lg:p-6 pb-20 lg:pb-24 shadow-[0_25px_50px_rgba(0,0,0,0.25)] rounded-sm -rotate-[5deg] z-30 border border-[#e5dfd5]">
            {/* Tape */}
            <div className="absolute -top-4 left-8 w-20 h-10 bg-[#f4ead5]/90 backdrop-blur-sm rotate-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"></div>
            
            <div className="relative aspect-square w-full overflow-hidden bg-gray-200 shadow-inner">
              <Image 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800" 
                alt="Sunset Couple" 
                fill 
                className="object-cover sepia-[.1]"
              />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-handwriting text-4xl lg:text-5xl text-[#3b342e] whitespace-nowrap -rotate-3">
              Together Always ♡
            </div>
          </div>

          {/* POLAROID 3: Dog (Bottom Right) */}
          <div className="absolute bottom-[4%] right-[5%] w-72 lg:w-96 bg-[#fdfbf7] p-4 pb-16 lg:pb-20 shadow-[0_20px_40px_rgba(0,0,0,0.18)] rounded-sm rotate-[10deg] z-20 border border-[#e5dfd5]">
             {/* Tape */}
             <div className="absolute top-2 -right-4 w-12 h-6 bg-[#f4ead5]/80 backdrop-blur-sm -rotate-45 shadow-[0_1px_3px_rgba(0,0,0,0.1)]"></div>
             
             <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
              <Image 
                src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=800" 
                alt="Happy Dog" 
                fill 
                className="object-cover sepia-[.15]"
              />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-handwriting text-3xl text-[#3b342e] whitespace-nowrap -rotate-1">
              Furry Happiness ♡
            </div>
          </div>

        </div>

        {/* ======================= */}
        {/* RIGHT SIDE: LOGIN CARD */}
        {/* ======================= */}
        <div className="w-full lg:w-[40%] flex items-center justify-center z-40 relative">
          
          {/* Main Paper Container with Torn Edge Filter and Tilt */}
          <div className="relative w-full max-w-[540px] bg-[#fdfbf7] p-12 lg:p-16 -rotate-[2deg]"
               style={{ 
                 filter: "url(#rough-edge) drop-shadow(0px 20px 30px rgba(0,0,0,0.15))",
               }}>
            
            {/* Inner background to ensure the roughness applies mostly to the edge */}
            <div className="absolute inset-0 bg-[#f9f5ed] border border-[#e8dfcf] opacity-50 mix-blend-multiply"></div>

            {/* Postmark / Stamp */}
            <div className="absolute -top-4 -right-4 w-32 h-32 opacity-40 rotate-[15deg] mix-blend-multiply pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" stroke="#2c241b" strokeWidth="1">
                <circle cx="50" cy="50" r="45" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="35" />
                <path d="M10 40 L90 40 M10 50 L90 50 M10 60 L90 60" strokeWidth="0.5" />
                <path d="M20 20 L80 80 M80 20 L20 80" opacity="0.3" />
                <text x="50" y="30" fontSize="12" textAnchor="middle" fill="#2c241b" stroke="none">POST</text>
              </svg>
            </div>

            {/* Flower Icon */}
            <div className="w-full flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#8c6762] rounded-full flex items-center justify-center shadow-inner opacity-90">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  <circle cx="12" cy="12" r="3" fill="white" />
                  <path d="M12 2 A4 4 0 0 1 16 6 A4 4 0 0 1 12 10 A4 4 0 0 1 8 6 A4 4 0 0 1 12 2 Z" fill="#8c6762" />
                  <path d="M22 12 A4 4 0 0 1 18 16 A4 4 0 0 1 14 12 A4 4 0 0 1 18 8 A4 4 0 0 1 22 12 Z" fill="#8c6762" />
                  <path d="M12 22 A4 4 0 0 1 8 18 A4 4 0 0 1 12 14 A4 4 0 0 1 16 18 A4 4 0 0 1 12 22 Z" fill="#8c6762" />
                  <path d="M2 12 A4 4 0 0 1 6 8 A4 4 0 0 1 10 12 A4 4 0 0 1 6 16 A4 4 0 0 1 2 12 Z" fill="#8c6762" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-10 relative z-10">
              <h1 className="font-serif text-4xl font-bold text-[#1e2330] mb-2 tracking-tight">
                Memory Lane
              </h1>
              <p className="text-[#685a4f] text-sm">
                Your story. Our canvas.
              </p>
            </div>

            <div className="text-center mb-6">
               <p className="text-[#5a4d41] font-medium">Sign in to continue your journey.</p>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/continue" });
              }}
              className="relative z-10"
            >
              <button
                type="submit"
                className="w-full py-4 px-6 bg-white hover:bg-[#fcfbf9] text-[#3c4043] rounded-2xl transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.08)] border border-[#e0e0e0] font-bold text-base flex justify-between items-center group hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
              >
                {/* Custom Google 'G' Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                
                <span className="flex-1 text-center pr-2">Continue with Google</span>
                
                <ArrowRight size={18} className="text-[#5a4d41] group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Trust Indicators */}
            <div className="mt-12 mb-8 flex justify-between items-center px-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-[#d5c7b3] flex items-center justify-center bg-[#fdfbf7]">
                  <Lock size={16} className="text-[#5a4d41]" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#685a4f] font-semibold">Secure</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-[#d5c7b3] flex items-center justify-center bg-[#fdfbf7]">
                  <Tent size={16} className="text-[#5a4d41]" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#685a4f] font-semibold">Private</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-[#d5c7b3] flex items-center justify-center bg-[#fdfbf7]">
                  <Heart size={16} className="text-[#5a4d41]" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#685a4f] font-semibold">Yours</span>
              </div>
            </div>

            {/* Bottom Right Handwriting */}
            <div className="mt-10 flex justify-end relative">
               <div className="font-handwriting text-3xl text-[#3b342e] -rotate-6 opacity-90 pr-6 text-right leading-tight drop-shadow-sm">
                 "Memories<br/>make life beautiful" ♡
               </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
