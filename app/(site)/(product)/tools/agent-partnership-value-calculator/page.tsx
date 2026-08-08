import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3,
  ChevronRight,
  Handshake,
  ShieldCheck,
  Target,
} from "lucide-react"
import { AgentPartnershipValueCalculator } from "@/components/tools/AgentPartnershipValueCalculator"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"

const canonical = `${SITE_URL}/tools/agent-partnership-value-calculator`

export const metadata: Metadata = {
  title: { absolute: "Agent Partnership Value Calculator — Free Relationship ROI Tool" },
  description:
    "Model introductions, qualified opportunities, wins, contribution, and relationship-marketing ROI for a real estate agent partnership program. Free and browser-only.",
  keywords: [
    "real estate agent partnership calculator",
    "agent partnership value calculator",
    "realtor partnership ROI calculator",
    "mortgage realtor partnership ROI",
    "home services realtor partnership calculator",
  ],
  alternates: {
    canonical,
    languages: { "en-US": canonical, "x-default": canonical },
  },
  openGraph: {
    locale: "en_US",
    title: "Agent Partnership Value Calculator — Free Relationship ROI Tool",
    description:
      "Model the value of a relationship-building program with real estate agents using your own funnel and contribution assumptions.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Partnership Value Calculator | USAgentLeads",
    description: "A free browser-based model for real estate agent partnership value.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "What does the Agent Partnership Value Calculator estimate?",
    answer:
      "Using only the assumptions you enter, it models prospective agents, introductions, qualified opportunities, wins, gross contribution, net contribution, ROI, and cost per win for a relationship-building program.",
  },
  {
    question: "Does this calculator calculate referral payments or commissions?",
    answer:
      "No. It deliberately does not calculate, recommend, or optimize referral fees, commissions, rebates, gifts, or other consideration in exchange for referrals. Its cost field is limited to your own relationship-marketing program cost.",
  },
  {
    question: "Can a lender or title company use this calculator?",
    answer:
      "The model is only a business-planning aid, not legal advice. Businesses connected to federally related mortgage transactions should review applicable RESPA requirements and obtain qualified legal advice before offering any relationship-marketing activity or incentive to an agent.",
  },
  {
    question: "Does the calculator use or reveal USAgentLeads contact data?",
    answer:
      "No. It runs entirely in your browser using the values you enter. It does not search the directory, reveal contact data, or save your assumptions.",
  },
]

export default function AgentPartnershipValueCalculatorPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Agent Partnership Value Calculator", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Agent Partnership Value Calculator",
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
      "A free browser-based planning tool for businesses building professional relationships with real estate agents.",
    featureList: [
      "Introduction and opportunity funnel model",
      "Modeled wins and gross contribution",
      "Net contribution, ROI, and cost per win",
      "No referral-payment calculation",
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
            <span className="font-medium text-ink">Partnership Value Calculator</span>
          </nav>

          <header className="border-b border-border pb-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div className="max-w-3xl">
                <p className="label-eyebrow mb-3">Free tool</p>
                <h1 className="section-heading">Agent Partnership Value Calculator</h1>
                <p className="section-sub mt-4">
                  Turn your own relationship-building assumptions into a transparent model of introductions, qualified opportunities, wins, and contribution.
                </p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                {[
                  { icon: Handshake, label: "Funnel" },
                  { icon: Target, label: "Wins" },
                  { icon: BarChart3, label: "Value" },
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

          <section id="calculator" className="scroll-mt-24 py-10" aria-label="Agent partnership value calculator">
            <AgentPartnershipValueCalculator />
          </section>

          <section className="border-t border-border py-16" aria-labelledby="how-it-works-heading">
            <div className="max-w-3xl">
              <p className="label-eyebrow mb-3">How to use it</p>
              <h2 id="how-it-works-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                Separate relationship value from compensation or referral arrangements
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-body">
                Start with the agents you plan to include, then enter introduction, qualification, and win rates from a comparable program. Use a contribution figure rather than top-line revenue, and include only your own relationship-marketing cost. The model is designed to make every assumption visible.
              </p>
              <p className="mt-4 text-[15px] leading-[1.8] text-body">
                Need to plan the initial outreach audience, sending workload, and acquisition funnel? Use the{" "}
                <Link href="/tools/agent-outreach-campaign-planner" className="font-medium text-accent hover:underline">
                  Agent Outreach Campaign Planner
                </Link>{" "}
                instead.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Handshake,
                    title: "Your relationship history",
                    body: "The calculator does not publish performance benchmarks. Use results from a comparable program instead.",
                  },
                  {
                    icon: BarChart3,
                    title: "Transparent economics",
                    body: "See contribution, program cost, net contribution, and ROI as separate figures.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "No referral-price logic",
                    body: "The tool intentionally excludes referral payments, commissions, rebates, gifts, and incentives.",
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
              <h2 id="faq-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                Before you model a partnership program
              </h2>
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
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
