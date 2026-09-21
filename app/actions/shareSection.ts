"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { mintShareSlug } from "@/lib/share";

/* An explicit `ok` discriminant rather than checking for an `error` key: it
   narrows reliably across the server-action boundary, so callers get a real
   string in the failure branch instead of `string | undefined`. */
export type ShareResult =
  | { ok: true; isPublic: boolean; shareSlug: string | null }
  | { ok: false; error: string };

async function ownSection(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.section.findFirst({
    where: { id: sectionId, userId: session.user.id },
    select: { id: true, isPublic: true, shareSlug: true },
  });
}

function refresh(sectionId: string) {
  revalidatePath(`/section/${sectionId}`);
  revalidatePath("/");
  revalidatePath("/albums");
}

/** Turns sharing on or off. The first time it is turned on, a link is minted. */
export async function setSharing(sectionId: string, on: boolean): Promise<ShareResult> {
  const section = await ownSection(sectionId);
  if (!section) return { ok: false, error: "Unauthorized or not found" };

  const shareSlug = section.shareSlug ?? (on ? mintShareSlug() : null);
  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: { isPublic: on, shareSlug },
    select: { isPublic: true, shareSlug: true },
  });
  refresh(sectionId);
  return { ok: true, isPublic: updated.isPublic, shareSlug: updated.shareSlug };
}

/** Replaces the link and turns sharing on. Every link already sent stops working. */
export async function regenerateShareLink(sectionId: string): Promise<ShareResult> {
  const section = await ownSection(sectionId);
  if (!section) return { ok: false, error: "Unauthorized or not found" };

  const updated = await prisma.section.update({
    where: { id: sectionId },
    data: { isPublic: true, shareSlug: mintShareSlug() },
    select: { isPublic: true, shareSlug: true },
  });
  refresh(sectionId);
  return { ok: true, isPublic: updated.isPublic, shareSlug: updated.shareSlug };
}
