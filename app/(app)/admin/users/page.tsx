export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import UsersTable, { type AdminUser } from "@/components/admin/UsersTable";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, image: true, createdAt: true,
      sections: { select: { createdAt: true, _count: { select: { images: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  const rows: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    joined: u.createdAt.toISOString(),
    albums: u.sections.length,
    photos: u.sections.reduce((n, s) => n + s._count.images, 0),
    lastAlbum: u.sections[0]?.createdAt.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-[#1c1917]">Users</h1>
        <p className="text-sm text-[#5a4d41] mt-1.5">{rows.length} {rows.length === 1 ? "account" : "accounts"} on the platform.</p>
      </header>
      <UsersTable users={rows} />
    </div>
  );
}
