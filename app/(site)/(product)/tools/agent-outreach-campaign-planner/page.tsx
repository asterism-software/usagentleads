export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3,
  ChevronRight,
  Database,
  Mail,
  Send,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react"
import { AgentOutreachCampaignPlanner, type CampaignPlannerMarket } from "@/components/tools/AgentOutreachCampaignPlanner"
import { createServiceClient } from "@/lib/supabase/server"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"
import { US_STATES } from "@/lib/utils/states"

const canonical = `${SITE_URL}/tools/agent-outreach-campaign-planner`

export const metadata: Metadata = {
  title: { absolute: "Agent Outreach Campaign Planner — Free ROI & List-Size Tool" },
  description:
    "Plan a real estate agent outreach campaign with current state-level email availability and your own funnel assumptions. Model list size, workload, goals, and contribution—free, no signup.",
  keywords: [
    "real estate agent outreach campaign planner",
    "cold email campaign planner for real estate",
    "agent outreach ROI calculator",
    "realtor marketing campaign calculator",
    "brokerage recruiting campaign planner",
    "agent outreach list size calculator",
  ],
  alternates: {
    canonical,
    languages: { "en-US": canonical, "x-default": canonical },
  },
  openGraph: {
    locale: "en_US",
    title: "Agent Outreach Campaign Planner — Free ROI & List-Size Tool",
    description:
      "Model your real estate agent outreach audience, funnel, workload, and contribution using your own assumptions.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Outreach Campaign Planner | USAgentLeads",
    description: "Plan an outreach campaign to real estate agents—free, with no signup.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "What does the Agent Outreach Campaign Planner estimate?",
    answer:
      "It combines the selected states' currently available email records with your own campaign assumptions to model planned contacts, message workload, positive replies, qualified conversations, wins, and optional contribution economics. The results are planning estimates, not performance guarantees.",
  },
  {
    question: "Why are the funnel rates blank by default?",
    answer:
      "Delivery, reply, conversation, and win rates vary substantially by offer, sender setup, targeting, and campaign quality. USAgentLeads does not publish or imply a benchmark; enter results from a comparable recent campaign for a useful model.",
  },
  {
    question: "What does available email-record coverage mean?",
    answer:
      "It is the current count of records with an email field in USAgentLeads' selected-state data. It is not a guarantee that a contact is active, deliverable, in-market, or a fit for your offer. Exclude opt-outs, suppressions, and contacts you will not email from your planned-contact input.",
  },
  {
    question: "Does the planner send email or check legal compliance?",
    answer:
      "No. The planner runs in your browser and does not send email, save your assumptions, or certify legal compliance. You remain responsible for honoring opt-outs, following your email provider's policies, and complying with applicable law.",
  },
]

type StateAvailabilityRow = {
  state: string
  total_emails: number | null
  updated_at: string | null
}

function formatAvailabilityDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

async function getCampaignPlannerMarkets(): Promise<{
  markets: CampaignPlannerMarket[]
  availabilityAsOf: string | null
}> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("state, total_emails, updated_at")

  const rows = (data ?? []) as StateAvailabilityRow[]
  const availabilityByState = new Map(rows.map((row) => [row.state, row]))
  const latestUpdatedAt = rows.reduce<string | null>((latest, row) => {
    if (!row.updated_at || Number.isNaN(new Date(row.updated_at).getTime())) return latest
    if (!latest || new Date(row.updated_at).getTime() > new Date(latest).getTime()) return row.updated_at
    return latest
  }, null)

  return {
    markets: US_STATES.map((state) => {
      const row = availabilityByState.get(state.name)
      const totalEmails = row?.total_emails
      const availableEmailRecords =
        typeof totalEmails === "number" && Number.isFinite(totalEmails)
          ? Math.max(0, totalEmails)
          : null

      return {
        code: state.code,
        name: state.name,
        slug: state.slug,
        availableEmailRecords,
      }
    }),
    availabilityAsOf: formatAvailabilityDate(latestUpdatedAt),
  }
}

export default async function AgentOutreachCampaignPlannerPage() {
  const { markets, availabilityAsOf } = await getCampaignPlannerMarkets()
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Agent Outreach Campaign Planner", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Agent Outreach Campaign Planner",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: canonical,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A free browser-based planner for businesses that market to, recruit, or build partnerships with real estate agents.",
    featureList: [
      "Current state-level email-record availability",
      "Campaign funnel planning using visitor assumptions",
      "Message workload and goal feasibility",
      "Optional contribution and ROI model",
    ],
    publisher: {
      "@type": "Organization",
      name: "USAgentLeads",
      url: SITE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, toolSchema, faqSchema]) }}
      />
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 pb-6 pt-10 text-[14px] text-tertiary" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-ink">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <Link href="/tools" className="transition-colors hover:text-ink">Free Tools</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium text-ink">Campaign Planner</span>
          </nav>

          <header className="border-b border-border pb-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div className="max-w-3xl">
                <p className="label-eyebrow mb-3">Free tool</p>
                <h1 className="section-heading">Agent Outreach Campaign Planner</h1>
                <p className="section-sub mt-4">
                  Turn your markets and your own historical funnel data into a practical plan for selling to, recruiting, or partnering with real estate agents.
                </p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                {[
                  { icon: Users, label: "Audience" },
                  { icon: Send, label: "Workload" },
                  { icon: BarChart3, label: "Outlook" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="border-r border-border px-2 py-4 text-center last:border-r-0">
                      <Icon className="mx-auto text-accent" size={18} />
                      <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.08em] text-muted">{item.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </header>

          <section id="planner" className="scroll-mt-24 py-10">
            <AgentOutreachCampaignPlanner markets={markets} availabilityAsOf={availabilityAsOf} />
          </section>

          <section className="border-t border-border py-16" aria-labelledby="how-it-works-heading">
            <div className="max-w-3xl">
              <p className="label-eyebrow mb-3">How to use it</p>
              <h2 id="how-it-works-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">Use your own campaign evidence—not generic benchmarks</h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-body">
                Start with the states you can serve, choose a realistic unique-contact cohort, and enter the delivery, reply, conversation, and win rates from a comparable campaign. The planner keeps those rates separate so you can see exactly how each assumption affects the model.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Database,
                    title: "Grounded audience",
                    body: "Use current email-record availability for the states you select instead of an unbounded list size.",
                  },
                  {
                    icon: Target,
                    title: "Clear goal check",
                    body: "See whether your target can fit within the selected audience at your stated funnel rates.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "No magic numbers",
                    body: "The tool does not supply conversion benchmarks or promise an outcome—your assumptions stay visible.",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="card p-5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
                        <Icon size={18} />
                      </span>
                      <h3 className="mt-4 text-[14px] font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">{item.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="border-t border-border pb-20 pt-16" id="faq" aria-labelledby="faq-heading">
            <div className="max-w-3xl">
              <p className="label-eyebrow mb-3">FAQs</p>
              <h2 id="faq-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">Before you plan your outreach</h2>
              <div className="mt-7 space-y-3">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group card p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
                      {faq.question}
                      <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 border-t border-border pt-3 text-[14px] leading-[1.75] text-body">{faq.answer}</p>
                  </details>
                ))}
              </div>
              <div className="mt-8 rounded-xl border border-border bg-subtle/60 p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 shrink-0 text-accent" size={18} />
                  <p className="text-[13px] leading-relaxed text-tertiary">
                    Planning a commercial-email campaign? This tool is not legal advice. Review the FTC&apos;s commercial-email guidance, honor opt-outs, and follow your sending provider&apos;s rules before launching.
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
