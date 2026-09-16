import { prisma } from "@/lib/prisma";

/* Albums are created the moment a template is chosen, before any photo is uploaded.
   One that is still empty after the grace period was abandoned, so it is removed. */
export const EMPTY_GRACE_MS = 60 * 60 * 1000; // an hour

export async function cleanupEmptySections(userId: string) {
  const { count } = await prisma.section.deleteMany({
    where: {
      userId,
      images: { none: {} },
      createdAt: { lt: new Date(Date.now() - EMPTY_GRACE_MS) },
    },
  });
  return count;
}
