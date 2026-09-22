export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/r2";
import { rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({
  key: z.string().min(1).max(512),
  sectionId: z.string().min(1).max(64),
});

export const POST = withAuth(async (req: Request, { userId }) => {

  const rl = rateLimit(`complete:${userId}`, 120, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing key or sectionId" }, { status: 400 });
  }
  const { key, sectionId } = parsed.data;

  // this writes a row into an album, so the album must belong to the caller.
  // Without this check any signed-in user could attach images to any album.
  const section = await prisma.section.findFirst({
    where: { id: sectionId, userId },
    select: { id: true },
  });
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // In a real implementation with R2, we'd fetch the file from R2 using the key,
  // process it with sharp (resize for display and thumb, extract EXIF),
  // and upload the smaller versions back to R2.
  // Then we save the URLs to the DB.

  // For this mock implementation without credentials:
  const originalUrl = getPublicUrl(key);

  // We'll just use the same URL for all sizes for the mock
  const displayUrl = originalUrl;
  const thumbUrl = originalUrl;

  // Mock dimensions and date
  const width = 1600;
  const height = 1200;
  const takenAt = new Date();

  // Get current position (count of images in section)
  const count = await prisma.image.count({ where: { sectionId } });

  const image = await prisma.image.create({
    data: {
      sectionId,
      originalUrl,
      displayUrl,
      thumbUrl,
      takenAt,
      width,
      height,
      position: count,
    },
  });

  return NextResponse.json(image);
});
