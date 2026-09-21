"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, adminCount } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export type RoleResult = { ok: true; role: "USER" | "ADMIN" } | { ok: false; error: string };

/* The only place in the app that writes User.role. Everything else reads it.

   Two guards, because a role column is a privilege-escalation surface in a way
   an env var never was:
     - only an existing admin may call this at all;
     - the last admin cannot be demoted, or nobody can reach /admin again. */
export async function setUserRole(userId: string, makeAdmin: boolean): Promise<RoleResult> {
  const me = await requireAdmin();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return { ok: false, error: "That account no longer exists" };

  const nextRole = makeAdmin ? "ADMIN" : "USER";
  if (target.role === nextRole) {
    return { ok: true, role: nextRole };
  }

  if (!makeAdmin) {
    // demoting yourself is allowed, but only while someone else can still get in
    if ((await adminCount()) <= 1) {
      return { ok: false, error: "This is the only admin. Promote someone else first." };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole, roleUpdatedAt: new Date(), roleUpdatedBy: me.email ?? me.id },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
  return { ok: true, role: nextRole };
}
