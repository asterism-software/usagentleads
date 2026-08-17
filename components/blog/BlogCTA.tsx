import Link from "next/link"
import { formatAgentCount, TOTAL_AGENTS } from "@/lib/utils/states"

export function BlogCTA() {
  const countLabel = formatAgentCount(TOTAL_AGENTS)

  return (
    <section className="bg-accent rounded-2xl p-8 sm:p-12 text-center my-16">
      <h2 className="text-[22px] sm:text-[24px] font-semibold text-white mb-3">
        Need Real Estate Agent Contacts?
      </h2>
      <p className="text-[15px] sm:text-[16px] text-white/80 max-w-lg mx-auto mb-8">
        Access {countLabel} verified realtor emails and phone numbers across all 50 states.
        Instant CSV download starting at $99 per state.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/states"
          className="inline-flex items-center gap-2 bg-white text-accent font-medium
                     text-[15px] px-6 py-3 rounded-lg hover:bg-white/90
                     shadow-sm transition-all duration-150"
        >
          Browse Real Estate Agent Data by State
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-transparent text-white font-medium
                     text-[15px] px-6 py-3 rounded-lg border border-white/30
                     hover:bg-white/10 transition-all duration-150"
        >
          View Pricing
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-[13px] text-white/60">
        <Link href="/for/saas-companies" className="hover:text-white transition-colors">For SaaS Companies</Link>
        <span>·</span>
        <Link href="/for/marketing-agencies" className="hover:text-white transition-colors">For Agencies</Link>
        <span>·</span>
        <Link href="/for/mortgage-lenders" className="hover:text-white transition-colors">For Lenders</Link>
        <span>·</span>
        <Link href="/compare" className="hover:text-white transition-colors">Compare Providers</Link>
      </div>
    </section>
  )
}
