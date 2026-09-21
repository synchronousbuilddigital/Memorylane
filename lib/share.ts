import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { userIsAdmin } from "@/lib/admin";

/* The sharing rules, in one place.

   An album is private until its owner turns sharing on. Turning it on mints a
   random slug, and that slug is the only way in for anyone but the owner or an
   admin: the raw id never opens an album for a stranger. So regenerating the
   slug kills every link already sent, and turning sharing off closes the album
   while keeping the slug for when it is turned back on. */

/** 12 url-safe characters, 72 bits of randomness. */
export function mintShareSlug() {
  return randomBytes(9).toString("base64url");
}

export const shareInclude = {
  images: { include: { notes: true }, orderBy: { position: "asc" as const } },
  stickyNotes: true,
};

/** The album for a share URL, or null when the visitor may not see it. */
export async function loadSharedSection(idOrSlug: string) {
  // a live share link opens the album for anyone
  const bySlug = await prisma.section.findFirst({
    where: { shareSlug: idOrSlug, isPublic: true },
    include: shareInclude,
  });
  if (bySlug) return bySlug;

  // otherwise it is an id, and only the owner or an admin may use one
  const session = await auth();
  if (!session?.user?.id) return null;

  const byId = await prisma.section.findUnique({ where: { id: idOrSlug }, include: shareInclude });
  if (!byId) return null;
  if (byId.userId === session.user.id) return byId;

  // an admin can open any album from the panel; the role is read live, so
  // revoking it takes effect immediately rather than when their token expires
  return (await userIsAdmin(session.user.id)) ? byId : null;
}
