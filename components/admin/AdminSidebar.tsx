"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Images, CreditCard, ArrowLeft, type LucideIcon } from "lucide-react";

const NAV: { href: string; label: string; Icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/albums", label: "Albums", Icon: Images },
  { href: "/admin/plans", label: "Plans", Icon: CreditCard },
];

export default function AdminSidebar({ email }: { email: string | null }) {
  const pathname = usePathname() ?? "";
  return (
    <aside className="lg:w-60 lg:shrink-0">
      <div className="lg:sticky lg:top-6">
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between mb-4">
          <div>
            <div className="font-serif text-lg font-black tracking-tight text-[#1c1917]">Memory Lane</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#a3907a] mt-0.5">Admin</div>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors bg-[#eae1d5] hover:bg-[#d9cbb8] px-3 py-1.5 rounded-lg">
            <ArrowLeft size={13} /> Site
          </Link>
        </div>

        {/* Desktop Header */}
        <div className="mb-6 hidden lg:block">
          <div className="font-serif text-xl font-black tracking-tight text-[#1c1917]">Memory Lane</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#a3907a] mt-1">Admin</div>
        </div>

        <nav className="flex lg:flex-col gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-4 lg:pb-0 scroll-smooth">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active ? "bg-[#1c1917] text-white" : "text-[#5a4d41] hover:bg-[#f4eee6] hover:text-[#1c1917]"
                }`}
              >
                <Icon size={16} className={active ? "text-white/80" : "text-[#a3907a]"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer (Email & Back) */}
        <div className="hidden lg:block mt-6 pt-5 border-t border-[#e8e0d5]">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a3907a] mb-1">Signed in as</div>
          <div className="text-xs text-[#5a4d41] break-all leading-relaxed">{email ?? "Signed in"}</div>
          <Link href="/" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5a4d41] hover:text-[#1c1917] transition-colors">
            <ArrowLeft size={13} /> Back to the site
          </Link>
        </div>
      </div>
    </aside>
  );
}
