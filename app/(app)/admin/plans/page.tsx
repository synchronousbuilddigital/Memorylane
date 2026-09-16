export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import StatTile from "@/components/admin/StatTile";

/* A placeholder that already has the shape billing will need. Everyone is on Free
   until a `plan` column exists on User — see the note at the bottom of the page. */
const TIERS = [
  { name: "Free", price: "₹0", blurb: "Up to 3 albums, standard templates.", features: ["3 albums", "All base templates", "Shareable link"] },
  { name: "Plus", price: "₹299 / mo", blurb: "For families who keep everything.", features: ["Unlimited albums", "Every template", "Custom cover photos", "No watermark"] },
  { name: "Studio", price: "₹899 / mo", blurb: "For photographers and event teams.", features: ["Everything in Plus", "Client handover", "Custom domain", "Priority support"] },
];

export default async function AdminPlans() {
  const userCount = await prisma.user.count();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-[#1c1917]">Plans</h1>
        <p className="text-sm text-[#5a4d41] mt-1.5">Subscriptions aren&apos;t live yet — this is the shape they&apos;ll take.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="On Free" value={userCount} sub="every account today" />
        <StatTile label="Paying" value={0} sub="no billing connected" />
        <StatTile label="MRR" value="₹0" sub="awaiting first subscription" />
        <StatTile label="Conversion" value="0%" sub="free → paid" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((t, i) => (
          <div key={t.name} className={`rounded-2xl border p-6 flex flex-col ${i === 1 ? "border-[#c9a24a] bg-[#fdfbf7]" : "border-[#e8e0d5] bg-[#fcfbf9]"}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-bold text-[#1c1917]">{t.name}</h2>
              {i === 1 && <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a6a1e] bg-[#f4eee6] rounded-full px-2 py-1">Planned default</span>}
            </div>
            <div className="font-sans font-bold text-2xl text-[#1c1917] mt-3">{t.price}</div>
            <p className="text-xs text-[#5a4d41] mt-2 leading-relaxed">{t.blurb}</p>
            <ul className="mt-4 space-y-1.5">
              {t.features.map((f) => (
                <li key={f} className="text-xs text-[#5a4d41] flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#c9a24a] shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-[#d9cbb8] bg-[#fdfbf7] p-5">
        <h2 className="font-serif text-base font-bold text-[#1c1917] mb-2">To switch this on</h2>
        <ol className="text-sm text-[#5a4d41] space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>Add <code className="text-xs bg-[#f4eee6] px-1.5 py-0.5 rounded">plan</code> and <code className="text-xs bg-[#f4eee6] px-1.5 py-0.5 rounded">stripeCustomerId</code> to the User model (one migration).</li>
          <li>Wire Stripe Checkout and a webhook that writes the plan back.</li>
          <li>Gate album creation on the plan in <code className="text-xs bg-[#f4eee6] px-1.5 py-0.5 rounded">createFixedTemplate</code>.</li>
        </ol>
      </section>
    </div>
  );
}
