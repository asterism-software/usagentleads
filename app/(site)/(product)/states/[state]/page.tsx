import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { US_STATES, getStateBySlug, formatAgentCount } from "@/lib/utils/states"
import { generateStateMetadata, generateBreadcrumbSchema, generateProductSchema, generateDatasetSchema, generateFAQSchema } from "@/lib/utils/seo"
import { getStateContent, getStateFAQs } from "@/lib/utils/state-content"
import { getStateSampleContact } from "@/lib/utils/state-sample-contacts"
import { getAllPosts } from "@/lib/blog"
import { STATE_NEIGHBORS } from "@/lib/utils/state-neighbors"
import { DATA_LAST_REFRESHED } from "@/lib/utils/site"
import { BuyStateButton } from "@/components/checkout/BuyStateButton"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { StateFAQ } from "@/components/states/StateFAQ"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"
import { ExitIntentPopup } from "@/components/home/ExitIntentPopup"
import { ChevronRight, Check, Lock, ShieldCheck, FileSpreadsheet } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/server"

export const revalidate = 86400

interface Props {
  params: Promise<{ state: string }>
}

export async function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params
  const state = getStateBySlug(slug)
  if (!state) return {}
  const content = getStateContent(slug)
  return generateStateMetadata(state, content?.cities)
}

const blurredFillerRows = [
  { name: "Sarah Chen", email: "sarah.chen@kw.com", phone: "(512) 447-9801" },
  { name: "Michael Rivera", email: "mrivera@homes.co", phone: "(213) 556-1102" },
  { name: "Emily Thompson", email: "emily.t@sold.net", phone: "(404) 223-8877" },
]

function getFallbackSourceNote(stateName: string, licensingBody: string) {
  return `${stateName} records are checked against public licensing and professional sources, including ${licensingBody}. We normalize names, remove obvious duplicates, and package the data into a CRM-ready CSV.`
}

function getCityNote(stateName: string, cities: string[]) {
  return `${cities.join(", ")} are the first ${stateName} markets most teams segment because they combine larger agent pools with clearer local campaign angles. Use these cities to localize subject lines, offers, and CRM lists instead of sending one generic statewide blast.`
}

function getWhoUses(stateName: string, cities: string[], useCase?: string) {
  return [
    `B2B teams building segmented campaigns around ${cities.slice(0, 2).join(" and ")} agents`,
    `Vendors that need licensed ${stateName} agent contacts for CRM enrichment, email outreach, or partner development`,
    useCase ?? `Local service providers, software companies, lenders, and agencies selling into the ${stateName} real estate market`,
  ]
}

function getLocalAngles(stateName: string, cities: string[]) {
  return cities.slice(0, 3).map((city) => (
    `Create a ${city}-specific segment and reference local market conditions, service area fit, or buyer profile in the first line of your campaign.`
  )).concat(
    `Keep ${stateName} outreach compliant: use a real sender identity, include a mailing address, and honor opt-out requests.`
  )
}

export default async function StatePage({ params }: Props) {
  const { state: slug } = await params
  const state = getStateBySlug(slug)
  if (!state) notFound()

  // Fetch real count from DB
  const supabase = createServiceClient()
  const { data: stateCountRow } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("count, total_emails, total_phones")
    .eq("state", state.name)
    .single()

  const agentCount: number = stateCountRow?.count ?? state.agentCount
  const totalEmails: number = stateCountRow?.total_emails ?? agentCount
  const totalPhones: number = stateCountRow?.total_phones ?? 0

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "States", url: "https://www.usagentleads.com/states" },
    { name: state.name, url: `https://www.usagentleads.com/states/${state.slug}` },
  ])
  const product = generateProductSchema(state, agentCount)
  const dataset = generateDatasetSchema(state, agentCount)

  const stateContent = getStateContent(slug)
  const previewContact = getStateSampleContact(slug) ?? blurredFillerRows[0]
  const sampleData = [previewContact, ...blurredFillerRows]
  const faqs = getStateFAQs(state, agentCount)
  const faqSchema = generateFAQSchema(faqs)

  // Related blog guides — use state-specific slugs if defined, else fallback defaults
  const defaultGuides = ["where-to-buy-realtor-email-list", "how-many-real-estate-agents-by-state", "how-to-build-realtor-email-list", "real-estate-cold-email-templates"]
  const guideSlugs = stateContent?.relatedBlogSlugs ?? defaultGuides
  const allPosts = getAllPosts()
  const relatedGuides = guideSlugs
    .map((s) => allPosts.find((p) => p.slug === s))
    .filter(Boolean)
    .map((p) => ({ slug: p!.slug, title: p!.title }))

  // Geographic neighbors (fallback to alphabetical if not mapped)
  const neighborSlugs = STATE_NEIGHBORS[slug]
  const neighbors = neighborSlugs
    ? neighborSlugs.map((s) => getStateBySlug(s)).filter(Boolean) as typeof US_STATES[number][]
    : (() => {
        const idx = US_STATES.findIndex((s) => s.code === state.code)
        return [
          US_STATES[(idx - 1 + US_STATES.length) % US_STATES.length],
          US_STATES[(idx + 1) % US_STATES.length],
          US_STATES[(idx + 2) % US_STATES.length],
          US_STATES[(idx + 3) % US_STATES.length],
        ]
      })()

  // High-demand states (by agent pool, which tracks search demand) — links from
  // every state page concentrate internal-link equity on the money pages.
  const popularStates = [...US_STATES]
    .filter((s) => s.code !== state.code)
    .sort((a, b) => b.agentCount - a.agentCount)
    .slice(0, 8)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, product, dataset, faqSchema]) }}
      />
      <ExitIntentPopup />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/states" className="hover:text-ink transition-colors shrink-0">States</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{state.name}</span>
          </nav>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start pb-20">
            {/* Left column */}
            <div className="flex-1 min-w-0">
              <p className="label-eyebrow mb-4">State Data</p>

              {/* Big state name */}
              <h1
                className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
                style={{ fontSize: "clamp(36px, 10vw, 88px)" }}
              >
                {state.name}
                <span
                  className="block text-[clamp(16px,3vw,28px)] tracking-[-0.02em] leading-[1.3] text-tertiary font-medium mt-2"
                >
                  Realtor Email List & Real Estate Agent Database
                </span>
              </h1>

              <p className="text-[15px] sm:text-[17px] text-tertiary mb-4">
                Realtor Email List & Contact Database —{" "}
                <span className="font-mono text-ink font-semibold ml-1">
                  {agentCount.toLocaleString()}
                </span>{" "}
                verified contacts
              </p>
              <p className="text-[14px] text-body/70 mb-10">
                Download the complete list of real estate agents in {state.name} — verified realtor emails, phone numbers, and a CRM-ready {state.name} realtor database delivered instantly as a CSV.
              </p>

              <AnswerBox>
                The {state.name} realtor email list from USAgentLeads contains {agentCount.toLocaleString()} verified real estate agent contacts — {totalEmails.toLocaleString()} email addresses and {totalPhones.toLocaleString()} phone numbers — for $49 one-time. It downloads instantly as a CRM-ready CSV (columns: name, email, phone, state), no subscription, with a 30-day money-back guarantee. Data last refreshed {DATA_LAST_REFRESHED}.
              </AnswerBox>

              {/* Mobile CTA */}
              <div className="lg:hidden mb-10">
                <PurchaseCard stateCode={state.code} stateName={state.name} agentCount={agentCount} />
              </div>

              {/* 4-stat strip */}
              <div className="bg-white border border-border rounded-xl p-4 sm:p-6 grid grid-cols-3 gap-0 divide-x divide-border mb-10">
                {[
                  { value: agentCount.toLocaleString(), label: "Total" },
                  { value: totalEmails.toLocaleString(), label: "Emails" },
                  { value: totalPhones.toLocaleString(), label: "Phones" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-1 sm:px-4">
                    <div className="font-mono text-[16px] sm:text-[28px] font-semibold text-ink leading-tight">{stat.value}</div>
                    <div className="text-[11px] sm:text-[13px] font-mono uppercase tracking-wider text-tertiary mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample data preview */}
              <div className="card overflow-hidden mb-10">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-subtle">
                  <h2 className="text-[13px] font-mono font-semibold text-tertiary uppercase tracking-wider">
                    Sample Preview
                  </h2>
                  <span className="text-[13px] text-tertiary font-mono">
                    Showing 1 of {agentCount.toLocaleString()} records
                  </span>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th className="hidden sm:table-cell">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row, i) => (
                      <tr
                        key={i}
                        className={i > 0 ? "[&_td]:blur-[3px] [&_td]:select-none pointer-events-none" : ""}
                      >
                        <td className="cell-name">{row.name}</td>
                        <td className="cell-email">{row.email}</td>
                        <td className="cell-phone hidden sm:table-cell">{row.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-center gap-2 px-5 py-3.5 bg-accent-light border-t border-accent-mid">
                  <Lock size={14} className="text-accent" />
                  <span className="text-[14px] text-accent font-medium">
                    Purchase to access all {agentCount.toLocaleString()} records
                  </span>
                </div>
              </div>

              {/* Free-sample capture — give not-ready-to-buy visitors a reason to
                  leave their email instead of bouncing. The sample CSV is a generic
                  500-row file, so the copy stays honest about what it is. */}
              <div className="card mb-10 flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-light border border-accent-mid">
                    <FileSpreadsheet size={18} className="text-accent" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">Not ready to buy?</p>
                    <p className="text-[13px] text-tertiary leading-relaxed">
                      Download a free 500-row sample and check the format and data quality first — no card required.
                    </p>
                  </div>
                </div>
                <FreeSampleDialog
                  source={`state_${state.code.toLowerCase()}`}
                  triggerLabel="Get Free Sample"
                  triggerClassName="btn-outline shrink-0 whitespace-nowrap text-[14px] px-5 py-2.5"
                />
              </div>

              {/* Complete list of real estate agents — broader-intent keyword capture */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-3">
                  Complete List of Real Estate Agents in {state.name}
                </h2>
                <p className="text-[15px] text-body leading-[1.8] mb-3">
                  This is the most complete list of real estate agents in {state.name} available for instant download — {agentCount.toLocaleString()}+ licensed {state.name} realtors and brokers compiled into one CRM-ready {state.name} realtor database. Every record is standardized with a full name, verified email address, and phone number.
                </p>
                <p className="text-[15px] text-body leading-[1.8]">
                  Instead of scraping {stateContent?.licensingBody ? `the ${stateContent.licensingBody} directory` : "state licensing directories"} or stitching together a {state.name} real estate agents list by hand, download the entire {state.name} realtor email list as a single CSV and import it into your CRM in minutes.
                </p>
                <p className="text-[15px] text-body leading-[1.8] mt-3">
                  Want to look up a specific agent first?{" "}
                  <Link href={`/directory/${state.slug}`} className="text-accent font-medium hover:underline">
                    Search the {state.name} real estate agent directory by name
                  </Link>{" "}
                  — free to browse before you buy.
                </p>
              </section>

              {/* About this state's data */}
              {stateContent && (
                <section className="mb-10">
                  <h2 className="text-[17px] font-semibold text-ink mb-3">
                    {state.name} Real Estate Agent Email Database
                  </h2>
                  <p className="text-[15px] text-body leading-[1.8] mb-3">
                    {stateContent.description}
                  </p>
                  {stateContent.useCase && (
                    <p className="text-[15px] text-body leading-[1.8] mb-3">
                      {stateContent.useCase}
                    </p>
                  )}
                  {stateContent.licensingBody && (
                    <p className="text-[14px] text-tertiary">
                      Licensing authority:{" "}
                      {stateContent.licensingSourceUrl ? (
                        <a
                          href={stateContent.licensingSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-accent font-medium hover:underline"
                        >
                          {stateContent.licensingBody}
                        </a>
                      ) : (
                        stateContent.licensingBody
                      )}
                    </p>
                  )}
                </section>
              )}

              {stateContent && (
                <section className="mb-10">
                  <h2 className="text-[17px] font-semibold text-ink mb-3">
                    How We Source {state.name} Agent Data
                  </h2>
                  <p className="text-[15px] text-body leading-[1.8] mb-3">
                    {stateContent.sourceNote ?? getFallbackSourceNote(state.name, stateContent.licensingBody)}
                  </p>
                  <p className="text-[15px] text-body leading-[1.8]">
                    The current dataset was last refreshed in {DATA_LAST_REFRESHED}. USAgentLeads turns fragmented public licensing records and professional directory data into a cleaned CSV with standardized names, email addresses, phone numbers, and state fields.{" "}
                    <Link href="/data-sources" className="text-accent font-medium hover:underline">
                      Review the sourcing methodology
                    </Link>
                    .
                  </p>
                </section>
              )}

              {stateContent?.cities?.length && (
                <section className="mb-10">
                  <h2 className="text-[17px] font-semibold text-ink mb-3">
                    Best {state.name} Cities to Target
                  </h2>
                  <p className="text-[15px] text-body leading-[1.8] mb-4">
                    {stateContent.cityNote ?? getCityNote(state.name, stateContent.cities)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stateContent.cities.map((city) => (
                      <span
                        key={city}
                        className="rounded-lg border border-border bg-white px-3 py-2 text-[14px] text-body"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {stateContent && (
                <section className="mb-10">
                  <h2 className="text-[17px] font-semibold text-ink mb-3">
                    Who Uses a {state.name} Realtor Email List?
                  </h2>
                  <ul className="space-y-2.5 text-[15px] text-body">
                    {(stateContent.whoUses ?? getWhoUses(state.name, stateContent.cities, stateContent.useCase)).map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check size={15} className="text-success shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {stateContent && (
                <section className="mb-10">
                  <h2 className="text-[17px] font-semibold text-ink mb-3">
                    Outreach Angles for {state.name} Agents
                  </h2>
                  <div className="space-y-3">
                    {(stateContent.localAngles ?? getLocalAngles(state.name, stateContent.cities)).map((item) => (
                      <p key={item} className="text-[15px] text-body leading-[1.8] border-l-2 border-accent-mid pl-4">
                        {item}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* What's included */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-3">
                  What You Get in the {state.name} Agent List
                </h2>
                <p className="text-[15px] text-body mb-4">
                  Your {state.name} CSV download includes {agentCount.toLocaleString()} verified records, each containing:
                </p>
                <ul className="space-y-2.5 text-[15px] text-body">
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span><strong>Full Name</strong> — the agent&apos;s registered legal name</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span><strong>Email Address</strong> — {totalEmails.toLocaleString()} verified professional emails</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span><strong>Phone Number</strong> — {totalPhones.toLocaleString()} direct phone numbers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span><strong>State</strong> — {state.name} ({state.code})</span>
                  </li>
                </ul>
              </section>

              {/* FAQ */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-4">
                  Frequently Asked Questions
                </h2>
                <StateFAQ faqs={faqs} />
              </section>

              {/* Related Guides */}
              <section className="mb-10">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Related Guides
                </h2>
                <div className="space-y-2">
                  {relatedGuides.map((guide) => (
                    <Link
                      key={guide.slug}
                      href={`/blog/${guide.slug}`}
                      className="flex items-center gap-2 text-[14px] text-accent font-medium hover:underline"
                    >
                      {guide.title}
                      <ChevronRight size={14} />
                    </Link>
                  ))}
                </div>
              </section>

              {/* Popular states — internal-link equity to high-demand pages */}
              <section className="mb-10">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Popular Real Estate Agent Lists
                </h2>
                <div className="flex flex-wrap gap-2">
                  {popularStates.map((s) => (
                    <Link
                      key={s.code}
                      href={`/states/${s.slug}`}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                                 hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                    >
                      <span className="font-mono font-semibold text-ink">{s.code}</span>
                      <span className="text-tertiary">{s.name} Realtor Email List</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Neighboring states */}
              <section>
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Agent Lists for Nearby States
                </h2>
                <div className="flex flex-wrap gap-2">
                  {neighbors.map((s) => (
                    <Link
                      key={s.code}
                      href={`/states/${s.slug}`}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                                 hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                    >
                      <span className="font-mono font-semibold text-ink">{s.code}</span>
                      <span className="text-tertiary">{s.name}</span>
                      <span className="font-mono text-tertiary text-[13px] ml-1">
                        ~{formatAgentCount(s.agentCount)}
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/states"
                  className="inline-flex items-center gap-1.5 mt-4 text-[14px] text-accent font-medium hover:underline"
                >
                  View All 50 States
                  <ChevronRight size={14} />
                </Link>
              </section>
            </div>

            {/* Right column — sticky purchase card (desktop) */}
            <div className="hidden lg:block w-[300px] shrink-0 sticky top-24">
              <PurchaseCard stateCode={state.code} stateName={state.name} agentCount={agentCount} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function PurchaseCard({ stateCode, stateName, agentCount }: { stateCode: string; stateName: string; agentCount: number }) {
  return (
    <div className="card p-5 sm:p-7 border-accent/30 border-2 shadow-lg">
      <p className="label-eyebrow mb-1">{stateName} Data</p>
      <p className="text-[13px] font-mono text-tertiary mb-5">One-time purchase</p>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-mono text-[20px] sm:text-[24px] font-medium text-muted line-through decoration-muted/60 decoration-2">$99</span>
        <span className="font-mono text-[36px] sm:text-[48px] font-semibold text-ink leading-none">$49</span>
        <span className="text-tertiary text-[15px]">one-time</span>
      </div>
      <p className="text-[14px] text-body mb-6">
        <span className="font-mono font-semibold text-accent">{agentCount.toLocaleString()}</span> contacts included
      </p>

      <div className="space-y-2.5 mb-7">
        {["Full Name", "Email Address", "Phone Number", "State"].map((field) => (
          <div key={field} className="flex items-center gap-2.5 text-[15px] text-body">
            <Check size={15} className="text-success shrink-0" />
            {field}
          </div>
        ))}
      </div>

      <BuyStateButton stateCode={stateCode} stateName={stateName} className="w-full" />

      <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-success/20 bg-success-bg px-3 py-2 text-[13px] font-medium text-success">
        <ShieldCheck size={14} />
        30-day money-back guarantee
      </div>

      <p className="mt-3 text-center text-[13px] text-tertiary">
        Secure checkout &middot; Instant delivery &middot; No account needed
      </p>

      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
        <span className="text-[11px] text-muted">Payments by</span>
        <Image
          src="/lemon-squeezy-logo.svg"
          alt="Lemon Squeezy"
          width={212}
          height={28}
          unoptimized
          className="h-4 w-auto"
        />
      </div>
    </div>
  )
}
