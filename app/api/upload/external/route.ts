export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rateLimit";

/* Only hosts we serve images from. An arbitrary URL here would be stored and
   then rendered on the album page, which makes this endpoint a way to point
   other people's pages at any server the attacker likes. */
const ALLOWED_HOSTS = new Set(["res.cloudinary.com", "images.unsplash.com"]);

const Body = z.object({
  url: z.string().url().max(2048),
  sectionId: z.string().min(1).max(64),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`external:${session.user.id}`, 120, 60_000);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid url or sectionId" }, { status: 400 });
    }
    const { url, sectionId, width, height } = parsed.data;

    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return NextResponse.json({ error: "That image host is not allowed" }, { status: 400 });
    }

    // Verify section ownership
    const section = await prisma.section.findFirst({
      where: { id: sectionId, userId: session.user.id },
      select: { id: true },
    });

    if (!section) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Save directly to the DB. For external URLs, we use the same URL for original, display, and thumb
    const image = await prisma.image.create({
      data: {
        sectionId,
        originalUrl: url,
        displayUrl: url,
        thumbUrl: url,
        width: width || 800, // fallback if not provided
        height: height || 600, // fallback if not provided
        position: 0, // Should calculate max position if we cared about order
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    // logged in full server-side; the client gets nothing about our internals
    console.error("External upload error:", error);
    return NextResponse.json({ error: "Could not save that image" }, { status: 500 });
  }
}
