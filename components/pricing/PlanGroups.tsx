import Link from "next/link"
import { Check, X, ArrowRight, ShieldCheck, Download, RefreshCw } from "lucide-react"
import { BuyFullDBButton } from "@/components/checkout/BuyFullDBButton"
import { SubscribeButton } from "@/components/checkout/SubscribeButton"
import { formatAgentCount } from "@/lib/utils/states"

type GroupId = "onetime" | "subscription"

interface Feature {
  text: string
  included: boolean
}

interface Stat {
  value: string
  label: string
}

interface Plan {
  name: string
  group: GroupId
  subtitle: string
  price: string
  originalPrice?: string
  period: string
  badge?: string
  stats?: Stat[]
  features: Feature[]
  highlighted: boolean
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${Math.floor(n / 1_000_000)}M+`
  if (n >= 1000) return `${Math.round(n / 1000).toLocaleString()}K+`
  return n.toLocaleString()
}

function getPlans(totalCount: number, totalEmails: number, totalPhones: number): Plan[] {
  const countLabel = totalCount > 0 ? `${formatAgentCount(totalCount)} verified contacts` : "500K+ verified contacts"
  const fullDbStats: Stat[] | undefined =
    totalCount > 0 && totalEmails > 0 && totalPhones > 0
      ? [
          { value: formatStat(totalCount), label: "Contacts" },
          { value: formatStat(totalEmails), label: "Emails" },
          { value: formatStat(totalPhones), label: "Phones" },
        ]
      : undefined
  return [
    {
      name: "State Pack",
      group: "onetime",
      subtitle: "One state",
      price: "$49",
      originalPrice: "$99",
      period: "/ state",
      features: [
        { text: "Single state CSV download", included: true },
        { text: "Name, email, phone, state", included: true },
        { text: "Instant delivery via email", included: true },
        { text: "No account required", included: true },
        { text: "Dashboard access", included: false },
      ],
      highlighted: false,
    },
    {
      name: "Full Database",
      group: "onetime",
      subtitle: "All 50 states",
      price: "$199",
      originalPrice: "$399",
      period: "one-time",
      badge: "BEST VALUE",
      stats: fullDbStats,
      features: [
        { text: "All 50 states in one CSV", included: true },
        { text: countLabel, included: true },
        { text: "Instant delivery via email", included: true },
        { text: "No account required", included: true },
        { text: "Dashboard access", included: false },
      ],
      highlighted: true,
    },
    {
      name: "Pro Dashboard",
      group: "subscription",
      subtitle: "Browse online",
      price: "$49",
      period: "/ month",
      features: [
        { text: "Browse all agents in-app", included: true },
        { text: "Search & filter by state", included: true },
        { text: "Real-time data access", included: true },
        { text: "Cancel anytime", included: true },
        { text: "Sign In required", included: true },
      ],
      highlighted: false,
    },
    {
      name: "Pro API",
      group: "subscription",
      subtitle: "For developers",
      price: "$79",
      period: "/ month",
      features: [
        { text: "Everything in Pro Dashboard", included: true },
        { text: "REST API access", included: true },
        { text: "10,000 API requests/month", included: true },
        { text: "60 requests/minute rate limit", included: true },
        { text: "API key management & analytics", included: true },
      ],
      highlighted: false,
    },
  ]
}

const GROUPS: { id: GroupId; icon: typeof Download; title: string; tagline: string; pill: string }[] = [
  {
    id: "onetime",
    icon: Download,
    title: "One-time downloads",
    tagline: "Pay once, download a CSV, keep it forever — no account needed.",
    pill: "No subscription",
  },
  {
    id: "subscription",
    icon: RefreshCw,
    title: "Monthly subscriptions",
    tagline: "Always-current data — browse it in-app or pull it through the API. Cancel anytime.",
    pill: "Cancel anytime",
  },
]

function PlanCta({ plan, variant }: { plan: Plan; variant: "home" | "page" }) {
  if (plan.name === "State Pack") {
    return (
      <Link href="/states" className="btn-outline w-full justify-center text-[14px]">
        Browse States <ArrowRight size={13} />
      </Link>
    )
  }

  if (variant === "home") {
    return (
      <Link
        href="/pricing"
        className={`w-full justify-center text-[14px] ${plan.highlighted ? "btn-primary" : "btn-outline"}`}
      >
        {plan.name === "Full Database" ? "Buy Full Database" : "Subscribe"} <ArrowRight size={13} />
      </Link>
    )
  }

  if (plan.name === "Full Database") return <BuyFullDBButton className="w-full" />
  if (plan.name === "Pro Dashboard") return <SubscribeButton className="w-full" />
  return <SubscribeButton className="w-full" purchaseType="subscription_api" label="Subscribe" />
}

function PlanCard({ plan, variant }: { plan: Plan; variant: "home" | "page" }) {
  return (
    <article
      className={`relative flex flex-col rounded-xl p-6 sm:p-7 transition-all duration-200 ${
        plan.highlighted
          ? "bg-white border-2 border-accent shadow-[0_8px_40px_rgba(29,78,216,0.12),0_2px_8px_rgba(29,78,216,0.08)] hover:-translate-y-0.5"
          : "bg-white border border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <div className="bg-accent text-white font-mono text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-b-lg shadow-sm">
            {plan.badge}
          </div>
        </div>
      )}

      <div className={`flex items-baseline justify-between gap-3 ${plan.badge ? "mt-3" : ""}`}>
        <p className="text-[15px] font-semibold text-ink">{plan.name}</p>
        <span className="shrink-0 text-[11px] font-mono uppercase tracking-wider text-tertiary">{plan.subtitle}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        {plan.originalPrice && (
          <span className="font-mono text-[20px] sm:text-[22px] font-medium text-muted line-through decoration-muted/60 decoration-2">
            {plan.originalPrice}
          </span>
        )}
        <span className="font-mono text-[34px] sm:text-[40px] font-semibold text-ink leading-none">{plan.price}</span>
        <span className="text-tertiary text-[14px]">{plan.period}</span>
      </div>

      <div className="h-px bg-border mt-5 mb-6" />

      {plan.stats && (
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-lg bg-accent-light/60 border border-accent/25 px-2 py-3">
          {plan.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-mono text-[16px] sm:text-[17px] font-semibold text-accent leading-tight">{stat.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-accent/80 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <ul className="space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-[14px]">
            {f.included ? (
              <Check size={15} className="text-success shrink-0 mt-0.5" />
            ) : (
              <X size={15} className="text-muted shrink-0 mt-0.5" />
            )}
            <span className={f.included ? "text-body" : "text-muted line-through decoration-muted/50"}>{f.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <PlanCta plan={plan} variant={variant} />
      </div>
    </article>
  )
}

export function PlanGroups({
  totalCount,
  totalEmails,
  totalPhones,
  variant,
  headingLevel = "h3",
}: {
  totalCount: number
  totalEmails: number
  totalPhones: number
  variant: "home" | "page"
  headingLevel?: "h2" | "h3"
}) {
  const plans = getPlans(totalCount, totalEmails, totalPhones)
  const HeadingTag = headingLevel

  return (
    <div className="max-w-5xl mx-auto">
      <div className="space-y-12">
        {GROUPS.map((group) => {
          const groupPlans = plans.filter((p) => p.group === group.id)
          const Icon = group.icon
          return (
            <section key={group.id}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-5 mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent">
                    <Icon size={17} />
                  </span>
                  <div>
                    <HeadingTag className="text-[17px] font-semibold text-ink leading-tight">{group.title}</HeadingTag>
                    <p className="text-[13px] text-tertiary leading-snug mt-0.5">{group.tagline}</p>
                  </div>
                </div>
                <span className="ml-auto hidden sm:inline-flex items-center text-[11px] font-mono uppercase tracking-wider text-tertiary bg-subtle border border-border rounded-full px-2.5 py-1">
                  {group.pill}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {groupPlans.map((plan) => (
                  <PlanCard key={plan.name} plan={plan} variant={variant} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-4 mt-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-bg border border-success/20 text-[14px] text-success font-medium">
          <ShieldCheck size={16} />
          30-Day Money-Back Guarantee
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-tertiary">Secure payments by</span>
          <span className="text-[19px] font-semibold tracking-[-0.04em] text-[#635BFF]" aria-label="Stripe">
            stripe
          </span>
        </div>
        <p className="text-[13px] text-muted">SSL encrypted &middot; Instant delivery</p>
      </div>
    </div>
  )
}
