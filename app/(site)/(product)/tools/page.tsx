import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
  Handshake,
  KeyRound,
  MailCheck,
  ShieldCheck,
  Target,
} from "lucide-react"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"

const canonical = `${SITE_URL}/tools`

export const metadata: Metadata = {
  title: { absolute: "Free Tools for Reaching Real Estate Agents | USAgentLeads" },
  description:
    "Free browser-based outreach, email-quality, recruiting, and partnership tools for businesses that sell to, recruit, or build professional relationships with real estate agents.",
  alternates: {
    canonical,
    languages: { "en-US": canonical, "x-default": canonical },
  },
  openGraph: {
    locale: "en_US",
    title: "Free Tools for Reaching Real Estate Agents | USAgentLeads",
    description:
      "Plan and review real estate agent outreach, recruiting, and partnership programs with free browser-based tools.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tools for Reaching Real Estate Agents | USAgentLeads",
    description: "Plan agent outreach, review email drafts, and model recruiting or partnership programs for free.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
}

const tools = [
  {
    title: "Agent Outreach Campaign Planner",
    description:
      "Model the audience, funnel, workload, and economics of a campaign that reaches real estate agents.",
    href: "/tools/agent-outreach-campaign-planner",
    icon: Target,
    eyebrow: "Campaign planning",
  },
  {
    title: "Cold Email Compliance Checker",
    description:
      "Review common CAN-SPAM text-level flags in a draft email without sending or uploading it.",
    href: "/tools/cold-email-compliance-checker",
    icon: ShieldCheck,
    eyebrow: "Email review",
  },
  {
    title: "Real Estate Email Subject Line Tester",
    description:
      "Compare outreach subject lines for compact previews, clarity prompts, and unresolved personalization tokens.",
    href: "/tools/real-estate-email-subject-line-tester",
    icon: MailCheck,
    eyebrow: "Email copy",
  },
  {
    title: "Email Domain Authentication Checker",
    description:
      "Inspect public SPF and DMARC records for the domain you use for agent outreach.",
    href: "/tools/email-domain-authentication-checker",
    icon: KeyRound,
    eyebrow: "Email infrastructure",
  },
  {
    title: "Brokerage Recruiting ROI Calculator",
    description:
      "Model company dollar, recruiting cost, payback, and first-year contribution using your own assumptions.",
    href: "/tools/brokerage-recruiting-roi-calculator",
    icon: Building2,
    eyebrow: "Brokerage recruiting",
  },
  {
    title: "Agent Partnership Value Calculator",
    description:
      "Model introductions, qualified opportunities, wins, and relationship-program value without referral-fee logic.",
    href: "/tools/agent-partnership-value-calculator",
    icon: Handshake,
    eyebrow: "Partnership planning",
  },
] as const

export default function ToolsPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: canonical },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Free tools for reaching real estate agents",
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.title,
      url: `${SITE_URL}${tool.href}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, itemList]) }}
      />
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 pb-6 pt-10 text-[14px] text-tertiary" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-ink">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium text-ink">Free Tools</span>
          </nav>

          <header className="max-w-3xl pb-12">
            <p className="label-eyebrow mb-3">Free tools</p>
            <h1 className="section-heading">Plan and improve how you reach real estate agents</h1>
            <p className="section-sub mt-4 max-w-2xl">
              Practical, browser-based tools for businesses marketing to agents, recruiting them, or building professional relationships. No signup required.
            </p>
          </header>

          <section className="border-t border-border py-10" aria-label="Free tools">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link key={tool.href} href={tool.href} className="card-interactive group flex min-h-64 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
                        <Icon size={21} />
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-tertiary transition-colors group-hover:text-accent">
                        <ArrowRight size={16} />
                      </span>
                    </div>
                    <p className="mt-7 text-[11px] font-mono uppercase tracking-[0.1em] text-muted">{tool.eyebrow}</p>
                    <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-ink">{tool.title}</h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-tertiary">{tool.description}</p>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="border-t border-border py-16">
            <div className="max-w-3xl rounded-xl border border-border bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
                  <BarChart3 size={19} />
                </span>
                <div>
                  <h2 className="text-[18px] font-semibold text-ink">Built for an agent-facing go-to-market motion</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-tertiary">
                    These tools help you work through outreach, email-review, recruiting, and relationship-program assumptions. They do not analyze property values, investment returns, or foreclosure deals.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
