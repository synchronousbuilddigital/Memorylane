"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import GlobalLoader from "./GlobalLoader";

/* Once-per-session cinematic intro for the home page.
   Shows the loader for `duration` seconds, then fades it away. The hero waits for the
   curtain to lift before it starts its own entrance, so the two animations chain.
   Remembered in sessionStorage so revisiting during the same session skips it. */

const KEY = "memorylane-intro-shown";
const IntroContext = createContext<{ ready: boolean }>({ ready: true });
export const useIntroReady = () => useContext(IntroContext).ready;

export default function HomeIntro({ children, duration = 2.6 }: { children: ReactNode; duration?: number }) {
  const reduce = useReducedMotion();
  // Start hidden on both server and client to keep hydration identical; decide in an effect
  const [phase, setPhase] = useState<"pending" | "intro" | "done">("pending");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch { /* private mode etc. */ }
    if (seen || reduce) { setPhase("done"); return; }
    setPhase("intro");
    const t = setTimeout(() => {
      try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
      setPhase("done");
    }, duration * 1000);
    return () => clearTimeout(t);
  }, [duration, reduce]);

  // Keep the page from scrolling under the curtain
  useEffect(() => {
    if (phase !== "intro") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [phase]);

  return (
    <IntroContext.Provider value={{ ready: phase === "done" }}>
      {/* The page is rendered underneath from the start, hidden until the curtain lifts */}
      <div style={{ visibility: phase === "done" ? "visible" : "hidden" }}>{children}</div>
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div key="intro" exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }} className="fixed inset-0 z-[9999]">
            <GlobalLoader mode="intro" duration={duration} />
          </motion.div>
        )}
      </AnimatePresence>
    </IntroContext.Provider>
  );
}
