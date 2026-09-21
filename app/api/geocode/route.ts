export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rateLimit";

/* Turns a typed place name into coordinates, so setting an album's place is a
   matter of writing "Jaipur" rather than hunting for it on the sphere.

   It proxies OpenStreetMap's Nominatim rather than letting the browser call it
   directly, for three reasons: the lookup stays behind the session, the
   caller's IP never reaches a third party, and the one-request-per-second
   ceiling in Nominatim's usage policy is something only the server can
   actually hold to. The typed text does leave us — that is the trade for not
   needing an API key or a billing account.

   Nothing here is written to the database. The result only becomes a stored
   place when the user picks one and presses save. */

const Query = z.object({
  q: z.string().trim().min(2).max(120),
});

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Nominatim's policy asks for an identifiable agent with a way to make contact.
const CONTACT = process.env.GEOCODE_CONTACT?.trim();
const AGENT = `MemoryLane/1.0${CONTACT ? ` (${CONTACT})` : ""}`;

export type GeoHit = { id: string; label: string; lat: number; lng: number };

/* --- a shared one-per-second gate ----------------------------------------
   The per-user limiter below stops one account hammering us; this stops the
   server as a whole exceeding what Nominatim allows, however many users are
   typing at once. Calls queue behind each other rather than going out
   together. */
let lastCall = 0;
let queue: Promise<unknown> = Promise.resolve();

function spaced<T>(fn: () => Promise<T>): Promise<T> {
  const turn = queue.then(async () => {
    const wait = 1100 - (Date.now() - lastCall);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
  });
  queue = turn.catch(() => {});
  return turn.then(fn);
}

/* --- a small cache -------------------------------------------------------
   Someone typing "jaipur" sends j-a-i-p-u-r as separate prefixes, and the
   same prefixes come back every time anyone types the same city. Serving
   those from memory keeps us well inside the policy and makes the field feel
   instant. Per instance, and deliberately small. */
const TTL = 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; hits: GeoHit[] }>();

function cached(key: string): GeoHit[] | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > TTL) {
    cache.delete(key);
    return null;
  }
  // refresh recency so the oldest key evicted is the least recently wanted
  cache.delete(key);
  cache.set(key, e);
  return e.hits;
}

function remember(key: string, hits: GeoHit[]) {
  cache.set(key, { at: Date.now(), hits });
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/** Nominatim's display_name is a full postal chain. Two or three parts is
    what a person actually reads on a pin. */
type NominatimRow = {
  place_id?: number | string;
  osm_id?: number | string;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string | undefined>;
};

function shorten(row: NominatimRow): string {
  const parts = String(row.display_name ?? "").split(",").map((p) => p.trim());
  const a = row.address ?? {};
  const primary = row.name?.trim() || parts[0] || "";
  const region = a.state || a.region || a.county || "";
  const country = a.country || parts[parts.length - 1] || "";
  const out: string[] = [];
  for (const p of [primary, region, country]) {
    if (p && !out.some((seen) => seen.toLowerCase() === p.toLowerCase())) out.push(p);
  }
  return out.join(", ") || String(row.display_name ?? "").slice(0, 120);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Query.safeParse({ q: new URL(req.url).searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ hits: [] });
  const q = parsed.data.q;

  // typing is debounced in the field, so this is generous for a person and
  // tight for a script
  const rl = rateLimit(`geocode:${session.user.id}`, 40, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const key = q.toLowerCase();
  const hit = cached(key);
  if (hit) return NextResponse.json({ hits: hit });

  try {
    const url = new URL(ENDPOINT);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");

    const res = await spaced(() =>
      fetch(url, {
        headers: { "User-Agent": AGENT, "Accept-Language": "en" },
        signal: AbortSignal.timeout(8000),
      }),
    );
    if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);

    const rows: NominatimRow[] = await res.json();
    const hits: GeoHit[] = rows
      .map((r) => ({
        id: String(r.place_id ?? r.osm_id ?? `${r.lat},${r.lon}`),
        label: shorten(r),
        lat: Number(r.lat),
        lng: Number(r.lon),
      }))
      .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng));

    /* Nominatim often returns the same place several times — three Udaipurs a
       few kilometres apart. The label is all anyone reads, so keep the first
       of each, which is also the best-ranked one. */
    const seen = new Set<string>();
    const unique = hits.filter((h) => {
      const k = h.label.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    remember(key, unique);
    return NextResponse.json({ hits: unique });
  } catch (err) {
    console.error("Geocode error:", err);
    return NextResponse.json({ error: "Could not look that place up" }, { status: 502 });
  }
}
