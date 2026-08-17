import { BadgeCheck } from "lucide-react"
import { getRecentPurchases, getPurchaseStats } from "@/lib/supabase/server"

/** Compact count for the headline, e.g. 2_666_427 -> "2.6M". */
function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

export async function RecentOrders() {
  const [orders, stats] = await Promise.all([
    getRecentPurchases(6),
    getPurchaseStats(),
  ])

  if (orders.length === 0) return null

  return (
    <section className="bg-subtle py-28 max-sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="section-header text-center flex flex-col items-center">
          <p className="label-eyebrow">Real Customers</p>
          <h2 className="section-heading">People Are Buying This Data</h2>
          <p className="section-sub max-w-xl">
            {stats.contactsDelivered > 0 && stats.statesCovered > 0
              ? `Over ${compact(stats.contactsDelivered)}+ verified contacts delivered to paying customers across ${stats.statesCovered}+ states.`
              : "Verified contacts delivered to real, paying customers."}
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto reveal-stagger">
          {orders.map((o, i) => (
            <li key={i} className="card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-wide text-accent">
                  <BadgeCheck size={15} aria-hidden="true" />
                  Verified purchase
                </span>
              </div>

              <p className="text-[15px] font-semibold text-ink">{o.product}</p>

              <p className="text-[13px] text-tertiary">
                {o.location ? `A customer in ${o.location}` : "A customer"} · Purchased recently
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
