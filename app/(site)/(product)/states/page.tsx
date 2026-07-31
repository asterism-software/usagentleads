export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Check, Database, Shield, Zap, FileSpreadsheet } from "lucide-react"
import { StateGrid } from "@/components/states/StateGrid"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"
import { ExitIntentPopup } from "@/components/home/ExitIntentPopup"
import { createServiceClient } from "@/lib/supabase/server"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { CURRENT_YEAR, TOTAL_AGENTS, US_STATES } from "@/lib/utils/states"
import { DATA_LAST_REFRESHED, DATA_SOURCES } from "@/lib/utils/site"

export const metadata: Metadata = {
  title: { absolute: `Real Estate Agent Email Lists by State — 50 States (${CURRENT_YEAR})` },
  description:
    "Real estate agent email lists by state — download a verified realtor email list, agent database, and full list of real estate agents for any of the 50 US states. CSV from $49.",
  alternates: {
    canonical: "https://www.usagentleads.com/states",
    languages: {
      "en-US": "https://www.usagentleads.com/states",
      "x-default": "https://www.usagentleads.com/states",
    },
  },
  openGraph: {
    locale: "en_US",
    title: `Real Estate Agent Email Lists by State — 50 States (${CURRENT_YEAR})`,
    description: "Browse verified realtor email lists and agent databases for every US state. Download a complete list of real estate agents as a CSV from $49/state.",
    url: "https://www.usagentleads.com/states",
    images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: "USAgentLeads - Real Estate Agent Contact Database" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Real Estate Agent Email Lists by State — 50 States (${CURRENT_YEAR})`,
    description: "Browse verified realtor email lists and agent databases for every US state from $49/state.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

const statesFAQs = [
  {
    question: "What data fields are included in each state pack?",
    answer: "Every state CSV includes full name, email address, phone number, and state for each licensed real estate agent. Records are compiled from public state licensing records and public-facing professional directories, then cleaned and verified.",
  },
  {
    question: "How is the agent data sourced and verified?",
    answer: "All contacts are compiled from publicly available sources — public state licensing records, professional directories, and brokerage listings. We normalize, deduplicate, and run regular verification passes to maintain deliverability above 90%.",
  },
  {
    question: "What's the difference between a state pack and the full database?",
    answer: "A state pack ($49) gives you a CSV for a single state. The Full Database ($199, one-time) includes all 50 states in a single download — 1,100,000+ contacts. If you need 4+ states, the full database is better value.",
  },
  {
    question: "How quickly is the CSV delivered after purchase?",
    answer: "Instantly. After checkout, a download link is emailed to you within seconds. No waiting for manual fulfillment — available 24/7.",
  },
  {
    question: "Can I import the CSV into my CRM?",
    answer: "Yes. The CSV format is compatible with all major CRMs including HubSpot, Salesforce, GoHighLevel, ActiveCampaign, and Mailchimp. The columns — name, email, phone, state — map directly to standard contact fields.",
  },
  {
    question: "How do I get a list of real estate agents by state?",
    answer: "Choose your state from the grid above and download its pack. Each state gives you a complete list of real estate agents — a CSV realtor database with every licensed agent's name, email, and phone number, compiled from public licensing records and professional directories.",
  },
  {
    question: "Do you offer a realtor database for every US state?",
    answer: "Yes. Every one of the 50 US states has its own realtor email list and agent database available for instant download at $49. Need several states? The Full Database bundles all 50 states and 1,100,000+ real estate agents into a single CSV for $199.",
  },
]

export default async function StatesPage() {
  const supabase = createServiceClient()
  const { data: stateCounts } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("state, count")

  const countMap: Record<string, number> = {}
  if (stateCounts) {
    for (const row of stateCounts) {
      countMap[row.state] = row.count
    }
  }
  const totalContacts = stateCounts?.length
    ? stateCounts.reduce((sum, row) => sum + row.count, 0)
    : TOTAL_AGENTS

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "States", url: "https://www.usagentleads.com/states" },
  ])

  const faqSchema = generateFAQSchema(statesFAQs)

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Estate Agent Email Lists by State",
    description: "Verified real estate agent contact databases for all 50 US states — instant CSV download.",
    numberOfItems: US_STATES.length,
    itemListElement: US_STATES.map((state, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${state.name} Realtor Email List`,
      url: `https://www.usagentleads.com/states/${state.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, itemList, faqSchema]) }}
      />
      <ExitIntentPopup />
    <div className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight size={14} className="text-muted" />
          <span className="text-ink font-medium">States</span>
        </nav>

        <header className="pb-10 border-b border-border">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="label-eyebrow mb-3">50 States Available</p>
              <h1 className="section-heading max-w-3xl">Real Estate Agent Email Lists by State</h1>
              <p className="section-sub mt-4 max-w-2xl">
                Pick a state and download a clean CSV — a complete list of real estate agents with licensed realtor names, email addresses, and phone numbers. Browse realtor email lists and agent databases for all 50 states below, each with the same format, price, and instant delivery.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] text-tertiary">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span>
                  Data current as of{" "}
                  <span className="font-medium text-ink">{DATA_LAST_REFRESHED}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              {[
                { value: US_STATES.length.toString(), label: "States" },
                { value: totalContacts.toLocaleString(), label: "Contacts" },
                { value: "$49", label: "Per State" },
              ].map((stat) => (
                <div key={stat.label} className="border-r border-border px-2 py-4 text-center last:border-r-0">
                  <p className="font-mono text-[18px] font-semibold leading-tight text-ink sm:text-[22px] lg:text-[18px]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "Same CSV fields in every pack",
            "Instant delivery",
            "Full database: $199",
          ].map((item, i) => (
            <div key={item} className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-body">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent-light font-mono text-[11px] font-semibold text-accent">
                {i + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <StateGrid countMap={countMap} />

        {/* Free-sample capture — give browsing visitors a low-commitment way to
            leave their email. The sample CSV is a generic 500-row file. */}
        <section className="mt-12">
          <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-accent-mid bg-accent-light">
                <FileSpreadsheet size={20} className="text-accent" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-ink">Want to see the data before you buy?</p>
                <p className="text-[13px] text-tertiary leading-relaxed">
                  Download a free 500-row sample CSV — check the exact fields and quality, no card required.
                </p>
              </div>
            </div>
            <FreeSampleDialog
              source="states_directory"
              triggerLabel="Get Free Sample"
              triggerClassName="btn-outline shrink-0 whitespace-nowrap text-[14px] px-5 py-2.5"
            />
          </div>
        </section>

        {/* Broader-intent keyword capture: "list of real estate agents by state" / "realtor database by state" */}
        <section className="mt-20 border-t border-border pt-16">
          <div className="max-w-3xl">
            <h2 className="text-[22px] font-semibold text-ink mb-6">A Complete List of Real Estate Agents by State</h2>
            <p className="text-[15px] text-body leading-[1.8] mb-4">
              Every state above links to its own realtor email list — a downloadable database of licensed real estate agents in that state, each with a verified name, email address, and phone number. Whether you need a single state&apos;s realtor database or a real estate agent list spanning several states, every pack ships in the same clean CSV format for {" "}
              <span className="font-mono text-ink">$49</span>.
            </p>
            <p className="text-[15px] text-body leading-[1.8]">
              Instead of scraping 50 different state licensing directories to build a real estate agent list by state, download ready-made packs and import them straight into your CRM. Buying four or more states?{" "}
              <Link href="/pricing" className="text-accent font-medium hover:underline">
                The Full Database covers all 50 states and 1,100,000+ agents for $199
              </Link>
              .
            </p>
          </div>
        </section>

        {/* What's included */}
        <section className="mt-20 border-t border-border pt-16">
          <div className="max-w-3xl">
            <h2 className="text-[22px] font-semibold text-ink mb-6">What&apos;s in Each State Pack</h2>
            <p className="text-[15px] text-body leading-[1.8] mb-8">
              Every state CSV download contains the same four verified fields for each licensed real estate agent in that state. No fluff, no filler — just the contact data you need for outreach.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { label: "Full Name", detail: "The agent's registered legal name as it appears on their license" },
                { label: "Email Address", detail: "Verified professional email — 90%+ deliverability rate" },
                { label: "Phone Number", detail: "Direct phone number where available" },
                { label: "State", detail: "The state where the agent holds an active license" },
              ].map((field) => (
                <div key={field.label} className="card p-5 flex gap-3">
                  <Check size={16} className="text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{field.label}</p>
                    <p className="text-[13px] text-tertiary mt-0.5 leading-relaxed">{field.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-tertiary">
              Files are delivered as clean UTF-8 CSVs — ready to import into HubSpot, Salesforce, GoHighLevel, Mailchimp, or any email platform.{" "}
              <Link href="/pricing" className="text-accent font-medium hover:underline">
                Need all 50 states? Get the Full Database for $199 →
              </Link>
            </p>
          </div>
        </section>

        {/* How data is sourced */}
        <section className="mt-16 border-t border-border pt-16">
          <div className="max-w-3xl">
            <h2 className="text-[22px] font-semibold text-ink mb-6">How We Source the Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  icon: Database,
                  title: "Public & Professional Records",
                  body: "Every contact is compiled from public state licensing records and public-facing professional directories — the same public sources teams use to verify licensed agents.",
                },
                {
                  icon: Shield,
                  title: "Verified & Deduplicated",
                  body: "Raw licensing data is cleaned, deduplicated, and standardized into a consistent format. We run regular verification passes to maintain 90%+ deliverability.",
                },
                {
                  icon: Zap,
                  title: "Instant CSV Delivery",
                  body: "After checkout, a download link arrives in your inbox within seconds. No manual fulfillment, no delays — available 24/7.",
                },
              ].map((item) => (
                <div key={item.title} className="card p-5">
                  <div className="w-9 h-9 rounded-xl bg-accent-light border border-accent-mid flex items-center justify-center mb-3">
                    <item.icon size={18} className="text-accent" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-ink mb-1.5">{item.title}</h3>
                  <p className="text-[13px] text-body leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-white p-5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
                Sources include
              </p>
              <div className="flex flex-wrap gap-2">
                {DATA_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="rounded-lg border border-border bg-subtle px-3 py-1.5 text-[13px] text-body"
                  >
                    {source}
                  </span>
                ))}
              </div>
              <p className="text-[13px] text-tertiary mt-4 leading-relaxed">
                Records are compiled from public-facing real estate directories and public records, then cleaned, deduplicated, and verified before delivery. Dataset current as of {DATA_LAST_REFRESHED}.
              </p>
            </div>
          </div>
        </section>

        {/* Related guides — internal links to blog assets */}
        <section className="mt-16 border-t border-border pt-16">
          <div className="max-w-3xl">
            <h2 className="text-[22px] font-semibold text-ink mb-6">Guides for Buying Realtor Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { href: "/blog/where-to-buy-realtor-email-list", label: "Where to buy a realtor email list" },
                { href: "/blog/how-many-real-estate-agents-by-state", label: "How many real estate agents are in each state" },
                { href: "/blog/real-estate-agent-license-lookup-all-states", label: "Free real estate license lookup by state" },
                { href: "/blog/how-to-build-realtor-email-list", label: "How to build a realtor email list" },
              ].map((g) => (
                <Link
                  key={g.href}
                  href={g.href}
                  className="flex items-center justify-between gap-3 card p-4 text-[14px] text-body hover:border-accent transition-colors"
                >
                  <span>{g.label}</span>
                  <ChevronRight size={15} className="text-accent shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 border-t border-border pt-16 pb-20">
          <div className="max-w-3xl">
            <h2 className="text-[22px] font-semibold text-ink mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {statesFAQs.map((faq) => (
                <details key={faq.question} className="group card p-5">
                  <summary className="cursor-pointer text-[15px] font-semibold text-ink list-none flex items-center justify-between gap-3">
                    {faq.question}
                    <ChevronRight size={16} className="text-muted shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-[14px] text-body leading-[1.8] mt-3 pt-3 border-t border-border">
                    {faq.answer}
                  </p>
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
