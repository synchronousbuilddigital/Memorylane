import { NextResponse } from "next/server";

/* A small fixed-window limiter, in memory and dependency-free.

   It blunts a script hammering an endpoint from one account. It is per server
   instance: on a serverless host each instance keeps its own counts, so treat
   it as a speed bump rather than a wall. For one shared limit across every
   instance, swap the Map for Upstash or a database table; the call sites need
   not change. */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  // drop expired buckets now and then so the map cannot grow without bound
  if (now - lastSweep > windowMs) {
    lastSweep = now;
    Array.from(buckets.keys()).forEach((k) => {
      const b = buckets.get(k);
      if (b && b.resetAt <= now) buckets.delete(k);
    });
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  return { ok: true, retryAfterSec: 0 };
}

export function tooMany(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
