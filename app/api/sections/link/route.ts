import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sectionId, linkedToId } = await req.json();

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    // Verify ownership of the section being modified
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
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
