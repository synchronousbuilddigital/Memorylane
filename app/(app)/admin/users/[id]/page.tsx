export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { templateLabelFor } from "@/lib/templates";
import StatTile from "@/components/admin/StatTile";

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, image: true, createdAt: true,
      sections: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, description: true, purpose: true, theme: true, createdAt: true,
          _count: { select: { images: true } },
          images: { orderBy: { position: "asc" }, take: 1, select: { thumbUrl: true, displayUrl: true } },
        },
      },
    },
  });
  if (!user) notFound();

  const photos = user.sections.reduce((n, s) => n + s._count.images, 0);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-8">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors">
        <ArrowLeft size={13} /> All users
      </Link>

      <header className="flex items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-[#f4eee6] overflow-hidden flex items-center justify-center text-lg font-bold text-[#8a755b] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : (user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl font-black tracking-tight text-[#1c1917] truncate">{user.name ?? "No name"}</h1>
          <p className="text-sm text-[#8a755b] truncate">{user.email}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Albums" value={user.sections.length} />
        <StatTile label="Photos" value={photos} />
        <StatTile label="Joined" value={fmt(user.createdAt)} />
        <StatTile label="Plan" value="Free" sub="billing not wired yet" />
      </section>

      <section>
        <h2 className="font-serif text-lg font-bold text-[#1c1917] mb-4">Their albums</h2>
        {user.sections.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#a3907a] border border-dashed border-[#e8e0d5] rounded-2xl">This account hasn&apos;t created an album yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {user.sections.map((s) => {
              const cover = s.images[0]?.thumbUrl || s.images[0]?.displayUrl || null;
              return (
                <div key={s.id} className="rounded-2xl border border-[#e8e0d5] bg-[#fcfbf9] overflow-hidden group">
                  <div className="aspect-[16/10] bg-[#f4eee6] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover && <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-[#fcfbf9]/92 text-[#2c241b] text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-1">
                      {templateLabelFor(s.purpose, s.theme)}
                    </span>
                    {s._count.images === 0 && (
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-amber-100/95 text-amber-800 text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-1">Draft</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-[#1c1917] truncate">{s.title}</h3>
                    <p className="text-xs text-[#8a755b] mt-1 line-clamp-1">{s.description || "No description"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-[#a3907a] tabular-nums">
                        {s._count.images} photos · {s.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <Link href={`/share/${s.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors">
                        Open <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
