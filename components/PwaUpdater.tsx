"use client";

import { useEffect } from "react";

export default function PwaUpdater() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      let refreshing = false;
      
      // When the service worker updates and takes control (due to skipWaiting: true),
      // this event fires. We then force a hard reload of the page so the user
      // instantly sees the fresh changes.
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
