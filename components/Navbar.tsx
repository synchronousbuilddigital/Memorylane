"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Sun, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { EASE } from "./motion/Reveal";
import { useNavHidden } from "@/lib/navHidden";
import PwaInstallButton from "./PwaInstallButton";

/* Each link carries a small warm texture of the place it goes to. They sit far
   back behind the label — the point is a hint of the destination, not a picture
   you have to look at, and the ink has to stay fully readable on top. */
const LINKS = [
  { href: "/", label: "Home", art: "/nav/home.webp", match: (p: string) => p === "/" },
  { href: "/albums", label: "Albums", art: "/nav/albums.webp", match: (p: string) => p.startsWith("/albums") },
  { href: "/map", label: "Map", art: "/nav/map.webp", match: (p: string) => p.startsWith("/map") },
  { href: "/albums?filter=favorites", label: "Favorites", art: "/nav/favorites.webp", match: () => false },
];

export default function Navbar({ signOutAction, session, isAdmin = false }: { signOutAction?: () => void, session?: any, isAdmin?: boolean }) {
  const isLoggedIn = !!session?.user?.id;
  const reduce = useReducedMotion();
  const pathname = usePathname() ?? "/";
  const current = LINKS.find((l) => l.match(pathname))?.label ?? "Home";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);          // mobile sheet
  const [menuOpen, setMenuOpen] = useState(false);  // profile menu
  const [hovered, setHovered] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // a full-screen pinned section can ask the bar to get out of the way
  const navHidden = useNavHidden();

  // the bar draws in as you leave the top: full-width header → floating rounded pill
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
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
  const links = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin", art: null as string | null, match: (p: string) => p.startsWith("/admin") }]
    : LINKS;

  return (
    <nav
      aria-hidden={navHidden || undefined}
      className={`fixed left-0 right-0 z-50 transition-all duration-500 ${scrolled || open ? "top-2 sm:top-3 px-3 sm:px-5" : "top-0 px-0"} ${
        navHidden ? "-translate-y-[150%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-500 ${
          scrolled || open
            ? "max-w-[1180px] rounded-[1.6rem] border border-white/60 bg-[#fdfbf7]/92 backdrop-blur-2xl shadow-[0_12px_34px_-12px_rgba(28,25,23,0.30)] ring-1 ring-[#1c1917]/[0.04] px-4 sm:px-6 py-2.5"
            : "max-w-[1600px] rounded-none border border-transparent bg-transparent px-4 sm:px-6 md:px-8 py-5 md:py-6"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 md:gap-3 group" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Memory Lane Logo" className={`object-cover rounded-md transition-all duration-500 shadow-sm mix-blend-multiply ${scrolled ? "w-7 h-7" : "w-8 h-8 md:w-10 md:h-10"}`} />
          <span className={`font-serif font-black tracking-tight text-[#2c241b] transition-all duration-500 ${scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`}>Memory Lane</span>
        </Link>

        {/* Centered links with a sliding underline */}
        <div
          className={`hidden md:flex items-center gap-1 text-[#5a4d41] font-medium text-sm tracking-wide rounded-full transition-all duration-500 ${scrolled ? "bg-[#1c1917]/[0.035] p-1" : "p-0"}`}
          onMouseLeave={() => setHovered(null)}
        >
          {links.map((l) => {
            const on = underlineOn === l.label;
            return (
              <Link
                key={l.label}
                href={l.href}
                onMouseEnter={() => setHovered(l.label)}
                className={`relative px-3.5 py-1.5 rounded-full transition-colors ${on ? "text-white" : "hover:text-[#2c241b]"}`}
              >
                {/* The cream pill is one shared element that slides between links,
                    so the artwork cannot ride on it — every link would show the
                    same picture. Each link owns its own layer underneath, and
                    fades it in only while it is the active one. */}
                {l.art && (
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 overflow-hidden rounded-full transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`}
                  >
                    {/* A white label inverts which pixel is dangerous: with dark ink the
                        darkest pixel set the limit, with white text it is the
                        brightest. So the textures are graded dark with their
                        highlights capped, which lets the image run at 90% — nearly
                        full strength, and finally properly visible. Measured, not
                        guessed: the brightest spot in any of the four still leaves
                        the label at 5.07:1 or better, against a 4.5:1 floor. */}
                    <span className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: `url(${l.art})` }} />
                  </span>
                )}
                <span className="relative z-10">{l.label}</span>
                {on && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-[1] rounded-full bg-[#1c1917] shadow-[0_3px_12px_rgba(28,25,23,0.28)] ring-1 ring-[#1c1917]/20"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
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
            <Link href="/login" className="px-5 md:px-6 py-3 md:py-2.5 bg-[#2c241b] text-white rounded-full text-sm font-semibold tracking-wide hover:bg-[#1a1510] transition-colors shadow-md">
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
            className="md:hidden overflow-hidden mx-3 sm:mx-5 mt-2 rounded-[1.4rem] border border-white/60 bg-[#fdfbf7]/95 backdrop-blur-2xl shadow-[0_18px_44px_-14px_rgba(28,25,23,0.35)] ring-1 ring-[#1c1917]/[0.04]"
          >
            <div className="px-4 pt-4 pb-5 flex flex-col gap-2">
              {/* Same treatment as the desktop pills: the destination's picture
                  behind a white label. Here every row shows its own, because the
                  sheet lists them all at once rather than sliding one highlight
                  between them. Rows are taller than the pills so the photograph
                  has room to read as a photograph. */}
              {links.map((l, i) => (
                <motion.div key={l.label} initial={{ opacity: 0, x: reduce ? 0 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: EASE }}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`relative flex items-center overflow-hidden rounded-2xl px-4 min-h-[3.75rem] font-serif text-2xl font-bold transition-transform active:scale-[0.98] ${l.art ? "text-white bg-[#1c1917] ring-1 ring-[#1c1917]/20 shadow-[0_3px_12px_rgba(28,25,23,0.22)]" : "text-[#2c241b]"}`}
                  >
                    {l.art && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-90"
                        style={{ backgroundImage: `url(${l.art})` }}
                      />
                    )}
                    <span className="relative z-10">{l.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              <motion.div initial={{ opacity: 0, x: reduce ? 0 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + links.length * 0.05, duration: 0.3, ease: EASE }}>
                <PwaInstallButton />
              </motion.div>

              {isLoggedIn && signOutAction && (
                <form action={signOutAction} className="mt-3">
                  <button type="submit" className="flex items-center gap-2 min-h-11 text-sm font-bold text-red-600 py-2">
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
