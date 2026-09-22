export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCloudinarySignature } from "@/lib/cloudinary";
import { rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({ sectionId: z.string().min(1).max(64) });

export const POST = withAuth(async (req: Request, { userId }) => {

  // one signature per file: sixty a minute is generous for a person and tight for a script
  const rl = rateLimit(`presign:${userId}`, 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing sectionId" }, { status: 400 });
  }
  const { sectionId } = parsed.data;

  // a signature is permission to fill this album's folder, so the album must be the caller's own
  const section = await prisma.section.findFirst({
    where: { id: sectionId, userId },
    select: { id: true },
  });
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // We organize uploads into a specific folder on Cloudinary
    const folder = `memory_lane/${sectionId}`;
    const signData = getCloudinarySignature(folder);

    return NextResponse.json({ ...signData, folder });
  } catch (err) {
    console.error("Cloudinary sign error:", err);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
});
