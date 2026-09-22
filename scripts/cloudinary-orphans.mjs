/* Finds — and optionally removes — files sitting in Cloudinary that nothing
 * in the database points at any more.
 *
 *   npm run cloudinary-orphans            # look only, change nothing
 *   npm run cloudinary-orphans -- --delete   # actually remove them
 *
 * Until the delete paths were fixed, nothing ever removed a file: deleting an
 * image, deleting an album, swapping a photo into an occupied slot and
 * changing an avatar all left the old bytes behind. This clears out what
 * those years of orphans left; the app itself now keeps up as it goes.
 *
 * It deletes from live storage and there is no undo, so looking is the
 * default and removing takes the explicit flag.
 *
 * Referencing is decided by matching Cloudinary's own public_id against the
 * URLs held in the database, rather than by parsing ids back out of those
 * URLs. Both directions can be got wrong, but this one errs the safe way:
 * an ambiguous match keeps the file. A file wrongly kept costs a fraction of
 * a penny; a file wrongly deleted is somebody's photograph.
 */
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ secure: true, url: process.env.CLOUDINARY_URL });

const FOLDER = "memory_lane/";

/* Stock photography is referenced by the source code, not by any database
   row, so the reference check below cannot see it. Without this it would be
   reported as orphaned and deleted — quietly, and days later. */
const KEEP = ["memory_lane/stock/"];
const doDelete = process.argv.includes("--delete");

const prisma = new PrismaClient();

const bytes = (n) =>
  n > 1 << 30 ? `${(n / (1 << 30)).toFixed(2)} GB`
  : n > 1 << 20 ? `${(n / (1 << 20)).toFixed(1)} MB`
  : `${(n / 1024).toFixed(0)} KB`;

try {
  if (!process.env.CLOUDINARY_URL) {
    console.error("\n  CLOUDINARY_URL is not set — nothing to talk to.\n");
    process.exit(1);
  }

  /* ---- everything the database still points at ---------------------- */
  const images = await prisma.image.findMany({
    select: { originalUrl: true, displayUrl: true, thumbUrl: true },
  });
  const users = await prisma.user.findMany({ select: { image: true } });

  const urls = [];
  for (const i of images) urls.push(i.originalUrl, i.displayUrl, i.thumbUrl);
  for (const u of users) if (u.image) urls.push(u.image);
  const live = urls.filter(Boolean);

  /* A public_id sits at the end of its URL, followed by a file extension or
     by nothing at all. Anchoring on that is what stops `a/b` counting as a
     match inside `a/bc.jpg`. */
  const referenced = (publicId) =>
    live.some((u) => u.endsWith(`/${publicId}`) || u.includes(`/${publicId}.`));

  /* ---- everything Cloudinary is actually holding --------------------- */
  const held = [];
  let cursor;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      prefix: FOLDER,
      max_results: 500,
      next_cursor: cursor,
    });
    held.push(...page.resources);
    cursor = page.next_cursor;
    process.stdout.write(`\r  listing Cloudinary… ${held.length} files`);
  } while (cursor);
  process.stdout.write("\r".padEnd(50) + "\r");

  const orphans = held.filter(
    (r) => !KEEP.some((k) => r.public_id.startsWith(k)) && !referenced(r.public_id),
  );
  const wasted = orphans.reduce((n, r) => n + (r.bytes ?? 0), 0);
  const total = held.reduce((n, r) => n + (r.bytes ?? 0), 0);

  console.log(`\n  in Cloudinary under ${FOLDER}   ${held.length} files, ${bytes(total)}`);
  console.log(`  still referenced                ${held.length - orphans.length} files`);
  console.log(`  orphaned                        ${orphans.length} files, ${bytes(wasted)}\n`);

  if (orphans.length === 0) {
    console.log("  Nothing to clean up.\n");
  } else if (!doDelete) {
    for (const r of orphans.slice(0, 20)) {
      console.log(`    ${r.public_id}   ${bytes(r.bytes ?? 0)}`);
    }
    if (orphans.length > 20) console.log(`    … and ${orphans.length - 20} more`);
    console.log(`\n  Nothing was deleted. To remove these:`);
    console.log(`      npm run cloudinary-orphans -- --delete\n`);
  } else {
    console.log(`  Deleting ${orphans.length} files…`);
    let gone = 0;
    const ids = orphans.map((r) => r.public_id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const res = await cloudinary.api.delete_resources(batch, { invalidate: true });
      gone += Object.values(res.deleted ?? {}).filter((v) => v === "deleted").length;
      process.stdout.write(`\r  deleted ${gone}/${ids.length}`);
    }
    console.log(`\n\n  Removed ${gone} files, freeing about ${bytes(wasted)}.\n`);
  }
} catch (err) {
  console.error("\n  Failed:", err?.message ?? err, "\n");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
