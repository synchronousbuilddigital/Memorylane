"use client";

import { useEffect, useState } from "react";

/* True when the primary input cannot hover — a phone or tablet.

   Scenes in this app are driven by wheel and hover on desktop. Those gestures
   do not exist on touch, so each scene needs a second, equivalent control
   rather than a different design. This hook says when to offer it.

   It starts false so the server and the first client paint agree, then
   corrects on mount; every caller uses it only to ADD a touch affordance, so
   a one-frame false is never visible. */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return coarse;
}
