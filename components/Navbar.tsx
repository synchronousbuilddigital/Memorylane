"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Sun, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { EASE } from "./motion/Reveal";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/albums", label: "Albums", match: (p: string) => p.startsWith("/albums") },
  { href: "/#map", label: "Map", match: () => false },
  { href: "/albums?filter=favorites", label: "Favorites", match: () => false },
];

export default function Navbar({ signOutAction, session }: { signOutAction?: () => void, session?: any }) {
  const isLoggedIn = !!session?.user?.id;
  const reduce = useReducedMotion();
  const pathname = usePathname() ?? "/";
  const current = LINKS.find((l) => l.match(pathname))?.label ?? "Home";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);          // mobile sheet
  const [menuOpen, setMenuOpen] = useState(false);  // profile menu
  const [hovered, setHovered] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // A paper-toned blur behind the bar once the hero scrolls away
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Profile menu opens on tap and closes on a click anywhere else
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const underlineOn = hovered ?? current;

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-[padding,background-color,box-shadow] duration-300 ${scrolled || open ? "py-3 bg-[#f8f6f3]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "py-5 md:py-6 bg-transparent"}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 md:gap-3 group" onClick={() => setOpen(false)}>
          <Sun size={22} className="text-[#2c241b] fill-[#2c241b] transition-transform duration-500 group-hover:rotate-90" />
          <span className="font-serif text-xl md:text-2xl font-black tracking-tight text-[#2c241b]">Memory Lane</span>
        </Link>

        {/* Centered links with a sliding underline */}
        <div className="hidden md:flex items-center gap-8 text-[#5a4d41] font-medium text-sm tracking-wide" onMouseLeave={() => setHovered(null)}>
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onMouseEnter={() => setHovered(l.label)}
              className={`relative py-1 transition-colors ${underlineOn === l.label ? "text-[#2c241b]" : "hover:text-[#2c241b]"}`}
            >
              {l.label}
              {underlineOn === l.label && (
                <motion.span layoutId="nav-underline" className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-[#2c241b]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              )}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                className="flex items-center gap-2 text-[#2c241b] p-1 pr-3 rounded-full transition-colors duration-300 hover:bg-black/5 min-h-11"
              >
                <div className="w-8 h-8 bg-[#e8e0d5] text-[#5a4d41] rounded-full flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://ui-avatars.com/api/?name=User&background=e8e0d5&color=5a4d41" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-semibold tracking-wide hidden sm:inline">Profile</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.97 }}
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl border border-[#e8e0d5] rounded-2xl shadow-xl origin-top-right z-50"
                  >
                    <div className="p-2">
                      {signOutAction && (
                        <form action={signOutAction}>
                          <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors">
                            <LogOut size={18} />
                            Sign out securely
                          </button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="px-5 md:px-6 py-2.5 bg-[#2c241b] text-white rounded-full text-sm font-semibold tracking-wide hover:bg-[#1a1510] transition-colors shadow-md">
              Sign In
            </Link>
          )}

          {/* Hamburger (phones and small tablets) */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden w-11 h-11 -mr-1 rounded-full flex items-center justify-center text-[#2c241b] hover:bg-black/5 transition-colors"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.35, ease: EASE }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 sm:px-6 pt-4 pb-6 flex flex-col gap-1 border-t border-[#e8e0d5]/70 mt-3">
              {LINKS.map((l, i) => (
                <motion.div key={l.label} initial={{ opacity: 0, x: reduce ? 0 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: EASE }}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="block py-3 font-serif text-2xl font-bold text-[#2c241b]">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              {isLoggedIn && signOutAction && (
                <form action={signOutAction} className="mt-3">
                  <button type="submit" className="flex items-center gap-2 text-sm font-bold text-red-600 py-2">
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
