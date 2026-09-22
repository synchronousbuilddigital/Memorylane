/* Copies the stock photography this app hardcodes from Unsplash into our own
 * Cloudinary, so that images.unsplash.com can be dropped from the Next image
 * allowlist.
 *
 *   node scripts/import-stock-images.mjs          # look only
 *   node scripts/import-stock-images.mjs --write  # upload, and write the map
 *
 * Why: `images.domains` allows the optimizer to fetch ANY path on a listed
 * host, which made /_next/image an open image proxy — an unauthenticated
 * request could pull a 6MB photo through the server, billed to us on Vercel.
 * Scoping Cloudinary to our own cloud fixes half of it. Unsplash cannot be
 * scoped, because every photo there is /photo-<id> and there is no prefix to
 * narrow, so the only real fix is to stop pointing at Unsplash at all.
 *
 * Uploading is done by handing Cloudinary the URL: it fetches server-side, so
 * nothing is downloaded here. Re-running skips anything already uploaded.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ secure: true, url: process.env.CLOUDINARY_URL });

const FOLDER = "memory_lane/stock";
const MASTER = "?auto=format&fit=crop&q=85&w=2000";   // what we archive
const MAP_FILE = "scripts/stock-image-map.json";
const ROOTS = ["app", "components", "lib"];
const CODE = /\.(tsx?|jsx?|mjs)$/;
const URL_RE = /https:\/\/images\.unsplash\.com\/(photo-[0-9a-zA-Z-]+)/g;

const write = process.argv.includes("--write");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (CODE.test(extname(p))) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
const photos = new Map();          // photo id -> how many times it appears
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(URL_RE)) {
    photos.set(m[1], (photos.get(m[1]) ?? 0) + 1);
  }
}

const ids = [...photos.keys()].sort();
const total = [...photos.values()].reduce((a, b) => a + b, 0);
console.log(`\n  ${ids.length} distinct photos, ${total} occurrences, across ${files.length} scanned files`);

if (!write) {
  console.log(`\n  Nothing uploaded. To do it:\n      node scripts/import-stock-images.mjs --write\n`);
  process.exit(0);
}

if (!process.env.CLOUDINARY_URL) {
  console.error("\n  CLOUDINARY_URL is not set.\n");
  process.exit(1);
}

const map = {};
let added = 0;
let already = 0;
let failed = 0;

for (const [i, id] of ids.entries()) {
  const publicId = `${FOLDER}/${id}`;
  process.stdout.write(`\r  ${i + 1}/${ids.length}  ${id.slice(0, 40)}…`.padEnd(70));
  try {
    // already there from an earlier run?
    try {
      const found = await cloudinary.api.resource(publicId);
      map[id] = found.secure_url;
      already++;
      continue;
    } catch {
      /* not uploaded yet — fall through */
    }

    const res = await cloudinary.uploader.upload(
      `https://images.unsplash.com/${id}${MASTER}`,
      { public_id: publicId, overwrite: false, resource_type: "image" },
    );
    map[id] = res.secure_url;
    added++;
  } catch (err) {
    failed++;
    console.log(`\n  ! ${id}: ${err?.error?.message ?? err?.message}`);
  }
}

process.stdout.write("\r".padEnd(72) + "\r");
writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + "\n");
console.log(`  uploaded ${added}, already present ${already}, failed ${failed}`);
console.log(`  map written to ${MAP_FILE} (${Object.keys(map).length} entries)\n`);
