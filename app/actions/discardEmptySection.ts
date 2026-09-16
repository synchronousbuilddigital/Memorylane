"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/* Removes an album the user is leaving without having added a single photo */
export async function discardEmptySection(sectionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { _count: { select: { images: true } } },
  });
  if (!section || section.userId !== session.user.id) return { error: "Not found" };
  if (section._count.images > 0) return { kept: true };

  await prisma.section.delete({ where: { id: sectionId } });
  revalidatePath("/");
  revalidatePath("/albums");
  return { discarded: true };
}
