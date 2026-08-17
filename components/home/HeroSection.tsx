import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"
import { StateDensityMap } from "@/components/home/StateDensityMap"
import { TOTAL_AGENTS } from "@/lib/utils/states"
import { DATA_LAST_REFRESHED } from "@/lib/utils/site"

const previewRows = [
  { name: "James Harrington", email: "james@harrington-realty.com", phone: "(305) 881-2244", state: "FL" },
  { name: "Sarah Chen", email: "sarah.chen@kw.com", phone: "(512) 447-9801", state: "TX" },
  { name: "Michael Rivera", email: "mrivera@homes.co", phone: "(213) 556-1102", state: "CA" },
  { name: "Emily Thompson", email: "emily.t@sold.net", phone: "(404) 223-8877", state: "GA" },
]

export function HeroSection({
  totalCount,
  countMap,
}: {
  totalCount: number
  countMap?: Record<string, number>
}) {
  const displayCount = totalCount > 0 ? `${totalCount.toLocaleString()}+` : `${TOTAL_AGENTS.toLocaleString()}+`

  return (
    <section className="relative bg-page overflow-hidden px-4 pt-12 pb-20 sm:px-6 sm:pt-16 sm:pb-24">
      {/* Decorative grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#0F1623_1px,transparent_1px),linear-gradient(to_bottom,#0F1623_1px,transparent_1px)] [background-size:32px_32px]"
      />
      {/* Decorative gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/3 -z-0 hidden h-[520px] w-[520px] rounded-full bg-accent/5 blur-3xl lg:block"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* LEFT: Copy + CTAs */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="hero-badge inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-[12px] shadow-sm sm:gap-3 sm:px-4 sm:text-[14px]">
              <span className="font-mono font-medium text-ink">{displayCount}</span>
              <span className="text-tertiary">Contacts</span>
              <span className="text-border-strong">|</span>
              <span className="text-tertiary">All 50 States</span>
              <span className="hidden text-border-strong sm:inline">|</span>
              <span className="hidden text-tertiary sm:inline">Updated {DATA_LAST_REFRESHED}</span>
            </div>

            {/* H1 */}
            <h1 className="hero-h1 mt-7">
              <span className="block text-[28px] font-light leading-[1.05] tracking-tight text-tertiary sm:text-[38px] md:text-[44px] lg:text-[48px]">
                The Complete US
              </span>
              <span className="mt-1 block text-[34px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[46px] md:text-[54px] lg:text-[58px]">
                Real Estate Agent Email List 2026
              </span>
            </h1>

            {/* Subheadline */}
            <p className="hero-sub mt-6 text-[14px] leading-relaxed text-tertiary sm:text-[17px]">
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1 sm:gap-x-2 lg:justify-start">
                <span className="font-medium text-ink">Name</span>
                <span className="font-bold text-accent">&middot;</span>
                <span className="font-medium text-ink">Email</span>
                <span className="font-bold text-accent">&middot;</span>
                <span className="font-medium text-ink">Phone</span>
                <span className="font-bold text-accent">&middot;</span>
                <span className="font-medium text-ink">State</span>
              </span>
              <span className="mx-1 hidden text-muted sm:mx-3 sm:inline">&mdash;</span>
              <span className="mt-1 block sm:mt-0 sm:inline">Clean CSV. Instant delivery. No account needed.</span>
            </p>

            {/* CTAs */}
            <div className="hero-ctas mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/states" className="btn-primary px-7 py-3.5 text-[15px] sm:text-[16px] sm:px-8">
                Browse by State <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-outline px-7 py-3.5 text-[15px] sm:text-[16px] sm:px-8">
                Full Database — <span className="font-mono">$399</span>
              </Link>
            </div>

            {/* Trust note */}
            <p className="hero-sub mt-5 text-[13px] text-tertiary sm:text-[14px]">
              90%+ email deliverability, backed by a 30-day money-back guarantee
            </p>
          </div>

          {/* RIGHT: Density map */}
          <div className="hero-preview w-full">
            <StateDensityMap countMap={countMap} />
          </div>
        </div>

        {/* Sample data table — connective intro + free-sample CTA */}
        <div className="hero-preview mt-16 sm:mt-20">
          <div className="mx-auto mb-5 max-w-3xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:text-[12px]">
              Want to see the real thing?
            </p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-ink sm:text-[24px]">
              Grab the first 500 rows — free, no signup
            </h2>
          </div>

          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-border bg-subtle px-5 py-3.5">
              <span className="font-mono text-[12px] font-medium uppercase tracking-wider text-tertiary sm:text-[13px]">
                Sample Data — First 500 Records
              </span>
              <span className="badge-state">Preview</span>
            </div>

            {/* Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Full Name</th>
                  <th scope="col">Email</th>
                  <th scope="col" className="hidden sm:table-cell">Phone</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr
                    key={i}
                    className={i > 0 ? "pointer-events-none [&_td]:select-none [&_td]:blur-[3px]" : ""}
                  >
                    <td className="cell-name">{row.name}</td>
                    <td className="cell-email">{row.email}</td>
                    <td className="cell-phone hidden sm:table-cell">{row.phone}</td>
                    <td><span className="badge-state">{row.state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex flex-col items-center justify-between gap-2 border-t border-accent-mid bg-accent-light px-4 py-3 sm:flex-row sm:px-5">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-accent" />
                <span className="text-[13px] font-medium text-accent sm:text-[14px]">
                  First 500 records free
                </span>
              </div>
              <FreeSampleDialog />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
