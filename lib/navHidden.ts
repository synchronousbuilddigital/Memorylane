"use client";

import { useSyncExternalStore } from "react";

/* A one-bit channel between a full-screen pinned section and the Navbar.
   The pinned template stage owns the whole viewport while it is stuck, so the
   floating bar would sit on top of the artwork; it asks the bar to step aside
   for exactly as long as it is pinned, then hands the screen back.

   Module state rather than context: the bar and the stage sit in different
   branches of the tree and a provider around both would mean threading a
   client boundary through the server-rendered page for one boolean. */
let hidden = false;
const listeners = new Set<() => void>();

export function setNavHidden(next: boolean) {
  if (hidden === next) return;
  hidden = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// the server never hides it, so the first paint always has a bar
export function useNavHidden() {
  return useSyncExternalStore(subscribe, () => hidden, () => false);
}
