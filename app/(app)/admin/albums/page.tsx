export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { templateLabelFor } from "@/lib/templates";
import AlbumsTable, { type AdminAlbum } from "@/components/admin/AlbumsTable";

export default async function AdminAlbums() {
  const sections = await prisma.section.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, purpose: true, theme: true, createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { images: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { thumbUrl: true, displayUrl: true } },
    },
  });

  const rows: AdminAlbum[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
    template: templateLabelFor(s.purpose, s.theme),
    owner: s.user.name ?? s.user.email ?? "Unknown",
    ownerId: s.user.id,
    photos: s._count.images,
    created: s.createdAt.toISOString(),
    cover: s.images[0]?.thumbUrl || s.images[0]?.displayUrl || null,
  }));

  const templates = Array.from(new Set(rows.map((r) => r.template))).sort();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-[#1c1917]">Albums</h1>
        <p className="text-sm text-[#5a4d41] mt-1.5">{rows.length} {rows.length === 1 ? "album" : "albums"} across all accounts.</p>
      </header>
      <AlbumsTable albums={rows} templates={templates} />
    </div>
  );
}
