export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({
  sectionId: z.string().min(1).max(64),
  linkedToId: z.string().min(1).max(64).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`link:${session.user.id}`, 60, 60_000);
    if (!rl.ok) return tooMany(rl.retryAfterSec);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }
    const { sectionId, linkedToId } = parsed.data;

    if (linkedToId && linkedToId === sectionId) {
      return NextResponse.json({ error: "An album cannot link to itself" }, { status: 400 });
    }

    // Verify ownership of the section being modified
    const section = await prisma.section.findFirst({
      where: { id: sectionId, userId: session.user.id },
      select: { id: true },
    });

    if (!section) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // and of the one being linked to: otherwise a journey could be pointed at
    // a stranger's album, which would leak it the moment the map follows links
    if (linkedToId) {
      const target = await prisma.section.findFirst({
        where: { id: linkedToId, userId: session.user.id },
        select: { id: true },
      });
      if (!target) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    // Update the section's link
    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: { linkedToId: linkedToId || null }, // null un-links it
    });

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error("Failed to link section:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
