export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooMany } from "@/lib/rateLimit";
import { slotAt, slotsForTheme } from "@/lib/albumSlots";

/* Only hosts we serve images from. An arbitrary URL here would be stored and
   then rendered on the album page, which makes this endpoint a way to point
   other people's pages at any server the attacker likes. */
const ALLOWED_HOSTS = new Set(["res.cloudinary.com", "images.unsplash.com"]);

const Body = z.object({
  url: z.string().url().max(2048),
  sectionId: z.string().min(1).max(64),
  /* Required, and not optional-with-a-default, because there is no sensible
     default to pick. `position` is the slot the picture goes in, not its
     place in a queue: several images share one, and the numbers have gaps
     where a template has no slot. Deriving it by counting the album's images
     — the obvious-looking fix — yields a number that is not a slot at all,
     and the picture renders nowhere. Only the caller knows which slot it
     means, so it has to say. */
  position: z.number().int().min(0).max(64),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {

    const rl = rateLimit(`external:${userId}`, 120, 60_000);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid url or sectionId" }, { status: 400 });
    }
    const { url, sectionId, position, width, height } = parsed.data;

    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(parsedUrl.hostname)) {
      return NextResponse.json({ error: "That image host is not allowed" }, { status: 400 });
    }

    // Verify section ownership
    const section = await prisma.section.findFirst({
      where: { id: sectionId, userId },
      select: { id: true, theme: true },
    });

    if (!section) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    /* The slot has to exist in this album's own template. A position that is
       merely a plausible number would store a picture nothing ever renders. */
    if (!slotAt(section.theme, position)) {
      const real = slotsForTheme(section.theme).map((s) => s.dbPosition);
      return NextResponse.json(
        {
          error: real.length
            ? `This album has no slot ${position}. Its slots are: ${real.join(", ")}.`
            : "This album's template has no picture slots",
        },
        { status: 400 },
      );
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
        position,
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    // logged in full server-side; the client gets nothing about our internals
    console.error("External upload error:", error);
    return NextResponse.json({ error: "Could not save that image" }, { status: 500 });
  }
});
