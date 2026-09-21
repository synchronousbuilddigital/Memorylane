/* Makes an account an admin, or takes it away.
 *
 *   npm run grant-admin  you@example.com
 *   npm run grant-admin  them@example.com --revoke
 *   npm run grant-admin  --list
 *
 * This exists because roles live in the database: without it there is no way
 * to create the first admin, since granting admin requires being one. It is
 * also the way back in if the last admin is ever demoted.
 *
 * It runs against whatever DATABASE_URL points at, so it is deliberately a
 * local command and not an HTTP endpoint.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const list = args.includes("--list");
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

function bail(message) {
  console.error(`\n  ${message}\n`);
  process.exitCode = 1;
}

try {
  if (list) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, name: true, roleUpdatedAt: true },
      orderBy: { email: "asc" },
    });
    if (admins.length === 0) {
      console.log("\n  No admins yet. Make one with:  npm run grant-admin you@example.com\n");
    } else {
      console.log(`\n  ${admins.length} admin${admins.length === 1 ? "" : "s"}:`);
      for (const a of admins) {
        const when = a.roleUpdatedAt ? ` (since ${a.roleUpdatedAt.toISOString().slice(0, 10)})` : "";
        console.log(`    ${a.email ?? "(no email)"}${a.name ? ` — ${a.name}` : ""}${when}`);
      }
      console.log("");
    }
  } else if (!email) {
    bail("Usage: npm run grant-admin <email> [--revoke] | --list");
  } else {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, name: true } });

    if (!user) {
      bail(`No account with the email ${email}. They must sign in once before they can be made an admin.`);
    } else if (revoke) {
      if (user.role !== "ADMIN") {
        console.log(`\n  ${email} is not an admin — nothing to do.\n`);
      } else {
        const remaining = await prisma.user.count({ where: { role: "ADMIN", id: { not: user.id } } });
        if (remaining === 0) {
          bail(`${email} is the only admin. Promote someone else first, or nobody can reach /admin.`);
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "USER", roleUpdatedAt: new Date(), roleUpdatedBy: "grant-admin script" },
          });
          console.log(`\n  Revoked admin from ${email}. ${remaining} admin${remaining === 1 ? "" : "s"} remain.\n`);
        }
      }
    } else if (user.role === "ADMIN") {
      console.log(`\n  ${email} is already an admin.\n`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", roleUpdatedAt: new Date(), roleUpdatedBy: "grant-admin script" },
      });
      console.log(`\n  ${email} is now an admin.\n`);
    }
  }
} finally {
  await prisma.$disconnect();
}
