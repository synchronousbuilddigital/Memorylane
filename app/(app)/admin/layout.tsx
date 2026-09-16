export const dynamic = "force-dynamic";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";

/* Every /admin page sits behind this. The check is server-side against ADMIN_EMAILS;
   the middleware only guarantees there is a session at all. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { email } = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#1c1917]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-10">
        <AdminSidebar email={email} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
