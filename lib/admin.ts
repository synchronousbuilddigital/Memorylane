import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/* Who is an admin is configuration, not code: ADMIN_EMAILS is a comma-separated
   list, so adding an admin is an environment change and a redeploy. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = adminEmails();
  return list.length > 0 && list.includes(email.trim().toLowerCase());
}

/** True when the *current* visitor is an admin. Safe to call from any server component. */
export async function viewerIsAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.email) return isAdminEmail(session.user.email);
  // the session carried no email (older token): fall back to the record it points at
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  return isAdminEmail(user?.email);
}

/** The gate every admin page sits behind. Redirects rather than throwing. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const email =
    session.user.email ??
    (await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } }))?.email ??
    null;

  if (!isAdminEmail(email)) redirect("/");
  return { session, email: email! };
}
