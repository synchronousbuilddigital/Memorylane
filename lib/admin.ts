import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/* Who is an admin is data, not configuration: it lives on the user row, so it
   can be granted and revoked from the admin panel without a redeploy.

   The role is read from the database on every check rather than carried in the
   session. Sessions here are JWTs that live for days, so a role baked into one
   would keep working long after it was revoked. This is a single lookup by
   primary key, which is the right trade for a privilege check.

   Bootstrapping: the first admin is made with `npm run grant-admin <email>`.
   That command is also the way back in if the last admin is ever demoted. */

export type Viewer = { id: string; email: string | null; isAdmin: boolean };

/** The signed-in user with their current role, or null when signed out. */
export async function currentViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });
  // the session points at a user that no longer exists
  if (!user) return null;

  return { id: user.id, email: user.email, isAdmin: user.role === "ADMIN" };
}

/** True when the *current* visitor is an admin. Safe to call from any server component. */
export async function viewerIsAdmin(): Promise<boolean> {
  return (await currentViewer())?.isAdmin ?? false;
}

/** True when this user id is an admin. Used where there is no session to read. */
export async function userIsAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

/** The gate every admin page sits behind. Redirects rather than throwing. */
export async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const viewer = await currentViewer();
  if (!viewer) redirect("/login");
  if (!viewer.isAdmin) redirect("/");
  return { id: viewer.id, email: viewer.email };
}

/** How many admins exist. The promote/demote action uses this to refuse a lockout. */
export function adminCount(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN" } });
}
