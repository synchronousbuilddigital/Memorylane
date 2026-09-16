export const dynamic = "force-dynamic";
import Link from "next/link";
import { Users, Images, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { templateKey, templateLabel, TEMPLATE_ORDER } from "@/lib/templates";
import StatTile from "@/components/admin/StatTile";
import AreaChart from "@/components/admin/AreaChart";
import BarChart from "@/components/admin/BarChart";

const DAYS = 30;

export default async function AdminOverview() {
  const since = new Date();
  since.setDate(since.getDate() - (DAYS - 1));
  since.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [userCount, albumCount, photoCount, newUsers, newAlbums, signups, templates, recent] = await Promise.all([
    prisma.user.count(),
    prisma.section.count(),
    prisma.image.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.section.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.section.findMany({ select: { purpose: true, theme: true } }),
    prisma.section.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, purpose: true, theme: true, createdAt: true, user: { select: { id: true, name: true, email: true } }, _count: { select: { images: true } } },
    }),
  ]);

  // one bucket per day, so quiet days still show as zero rather than closing the gap
  const buckets = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return { key: d.toDateString(), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: 0 };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const u of signups) {
    const b = byKey.get(new Date(u.createdAt).toDateString());
    if (b) b.value += 1;
  }

  const counts = new Map<string, number>();
  for (const s of templates) {
    const k = templateKey(s.purpose, s.theme);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const byTemplate = TEMPLATE_ORDER
    .map((k) => ({ label: templateLabel(k), value: counts.get(k) ?? 0 }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const avgPhotos = albumCount > 0 ? Math.round(photoCount / albumCount) : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-[#1c1917]">Overview</h1>
        <p className="text-sm text-[#5a4d41] mt-1.5">How Memory Lane is being used right now.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Users" value={userCount} Icon={Users} sub={`${newUsers} joined this week`} accent />
        <StatTile label="Albums" value={albumCount} Icon={BookOpen} sub={`${newAlbums} created this week`} />
        <StatTile label="Photos" value={photoCount} Icon={Images} sub={`${avgPhotos} per album on average`} />
        <StatTile label="Albums / user" value={userCount ? (albumCount / userCount).toFixed(1) : "0"} Icon={TrendingUp} sub="across all accounts" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-2xl border border-[#e8e0d5] bg-[#fcfbf9] p-5">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="font-serif text-lg font-bold text-[#1c1917]">New sign-ups</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a3907a]">Last {DAYS} days</span>
          </div>
          <AreaChart data={buckets.map(({ label, value }) => ({ label, value }))} />
        </div>

        <div className="rounded-2xl border border-[#e8e0d5] bg-[#fcfbf9] p-5">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="font-serif text-lg font-bold text-[#1c1917]">Albums by template</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a3907a]">All time</span>
          </div>
          <BarChart data={byTemplate} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e0d5] bg-[#fcfbf9] p-5">
        <div className="flex items-center justify-between gap-4 mb-1">
          <h2 className="font-serif text-lg font-bold text-[#1c1917]">Latest albums</h2>
          <Link href="/admin/albums" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors">
            See all <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ul>
          {recent.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 py-3 border-b border-[#e8e0d5] last:border-0">
              <div className="min-w-0">
                <Link href={`/share/${s.id}`} className="block font-semibold text-sm text-[#1c1917] truncate hover:text-[#8a755b] transition-colors">{s.title}</Link>
                <Link href={`/admin/users/${s.user.id}`} className="block text-xs text-[#8a755b] truncate hover:text-[#1c1917] transition-colors">
                  {s.user.name ?? s.user.email}
                </Link>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.16em] text-[#a3907a]">{templateLabel(templateKey(s.purpose, s.theme))}</span>
                <span className="text-xs text-[#5a4d41] tabular-nums">{s._count.images} ph</span>
                <span className="text-[11px] text-[#a3907a] tabular-nums w-20 text-right">{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            </li>
          ))}
          {recent.length === 0 && <li className="py-8 text-center text-sm text-[#a3907a]">No albums yet.</li>}
        </ul>
      </section>
    </div>
  );
}
