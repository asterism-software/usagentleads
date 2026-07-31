import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Database, RefreshCw, ShieldCheck, SearchCheck } from "lucide-react"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { DATA_LAST_REFRESHED, DATA_SOURCES } from "@/lib/utils/site"

export const metadata: Metadata = {
  title: { absolute: "Real Estate Agent Data Sources & Verification Methodology" },
  description:
    "How USAgentLeads sources, cleans, verifies, and updates real estate agent contact data from licensing records and professional directories.",
  alternates: {
    canonical: "https://www.usagentleads.com/data-sources",
    languages: {
      "en-US": "https://www.usagentleads.com/data-sources",
      "x-default": "https://www.usagentleads.com/data-sources",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "Real Estate Agent Data Sources & Verification Methodology",
    description: "How USAgentLeads sources, cleans, verifies, and updates realtor contact data.",
    url: "https://www.usagentleads.com/data-sources",
    images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: "USAgentLeads data sources" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Agent Data Sources & Verification Methodology",
    description: "How USAgentLeads sources, cleans, verifies, and updates realtor contact data.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: "Home", url: "https://www.usagentleads.com" },
  { name: "Data Sources", url: "https://www.usagentleads.com/data-sources" },
])

const faqs = [
  {
    question: "Where does USAgentLeads get real estate agent data?",
    answer:
      "USAgentLeads compiles real estate agent contact data from public state licensing records, professional directories, brokerage pages, and other publicly available business sources.",
  },
  {
    question: "How often is the database updated?",
    answer:
      `The current dataset was last refreshed in ${DATA_LAST_REFRESHED}. We also run cleanup and verification passes to remove obvious duplicates, normalize fields, and improve deliverability.`,
  },
  {
    question: "Can I see a sample before buying?",
    answer:
      "Yes. You can request a free sample to inspect the CSV format, fields, and record quality before purchasing a state pack or full database.",
  },
]

const faqSchema = generateFAQSchema(faqs)

const steps = [
  {
    icon: Database,
    title: "Source Collection",
    body: "We start with public state licensing records and professional directory sources that identify licensed real estate agents, brokers, and real estate professionals.",
  },
  {
    icon: SearchCheck,
    title: "Normalization",
    body: "Raw records are cleaned into consistent fields: full name, email address, phone number, and state. We standardize casing, remove obvious junk rows, and deduplicate repeated contacts.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    body: "Email and phone fields are checked for formatting, obvious invalid values, and duplicate records. Sample records can be tested before purchase for an additional confidence check.",
  },
  {
    icon: RefreshCw,
    title: "Refresh Cycle",
    body: `The current dataset was last refreshed in ${DATA_LAST_REFRESHED}. Count updates and quality checks are performed as new source data becomes available.`,
  },
]

export default function DataSourcesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pb-8">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">Data Sources</span>
          </nav>

          <header className="border-b border-border pb-10">
            <p className="label-eyebrow mb-3">Methodology</p>
            <h1 className="section-heading">Real Estate Agent Data Sources & Verification</h1>
            <p className="section-sub mt-4 max-w-3xl">
              USAgentLeads is built for B2B teams that need practical, CRM-ready realtor contact data. This page explains where the data comes from, how it is cleaned, and how buyers can evaluate quality before using it.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>
                Dataset current as of{" "}
                <span className="font-medium text-ink">{DATA_LAST_REFRESHED}</span>
              </span>
            </div>
          </header>

          <section className="grid gap-5 py-12 md:grid-cols-2">
            {steps.map((step) => (
              <div key={step.title} className="card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent-mid bg-accent-light">
                  <step.icon size={20} className="text-accent" />
                </div>
                <h2 className="text-[17px] font-semibold text-ink mb-2">{step.title}</h2>
                <p className="text-[15px] text-body leading-[1.8]">{step.body}</p>
              </div>
            ))}
          </section>

          <section className="border-t border-border py-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">Where the Data Comes From</h2>
            <p className="text-[15px] text-body leading-[1.8] mb-5">
              Records are compiled from public-facing real estate directories, brokerage sites, and public records — then normalized, deduplicated, and verified into a single CRM-ready format. Primary sources include:
            </p>
            <div className="flex flex-wrap gap-2">
              {DATA_SOURCES.map((source) => (
                <span
                  key={source}
                  className="rounded-lg border border-border bg-white px-4 py-2.5 text-[15px] text-body"
                >
                  {source}
                </span>
              ))}
            </div>
          </section>

          <section className="border-t border-border py-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">What We Verify</h2>
            <p className="text-[15px] text-body leading-[1.8] mb-5">
              Data quality matters more than raw list size. Our review process focuses on whether a record belongs to a real estate professional, whether the fields are usable in a CRM, and whether obvious duplicates or malformed contacts have been removed.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "License or professional-directory presence",
                "Normalized names and state fields",
                "Email syntax and duplicate detection",
                "Phone formatting where phone data is available",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-border bg-white px-4 py-3 text-[15px] text-body">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-border py-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">What Is Included in the CSV?</h2>
            <p className="text-[15px] text-body leading-[1.8] mb-5">
              Each state CSV is designed for import into CRMs, spreadsheets, outbound tools, and internal prospecting systems. The standard fields are intentionally simple so teams can map the file without cleanup.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Full name", "Email address", "Phone number", "State"].map((field) => (
                <div key={field} className="rounded-lg border border-border bg-white px-4 py-3 text-[15px] text-body">
                  {field}
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-border py-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">How to Evaluate a Sample</h2>
            <ol className="space-y-3 text-[15px] text-body leading-[1.8]">
              <li>1. Open the sample CSV and confirm the fields map cleanly to your CRM or email tool.</li>
              <li>2. Spot-check a handful of records against public licensing or brokerage sources.</li>
              <li>3. Run sample emails through a validator such as NeverBounce, ZeroBounce, or another tool your team trusts.</li>
              <li>4. Segment by state or city before sending so your outreach message matches the agent&apos;s local market.</li>
            </ol>
          </section>

          <section className="border-t border-border py-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">Compliance Note</h2>
            <p className="text-[15px] text-body leading-[1.8]">
              USAgentLeads provides business contact data sourced from public and professional records. Customers are responsible for using the data in compliance with CAN-SPAM, platform rules, unsubscribe requirements, and any other laws that apply to their outreach.
            </p>
          </section>

          <section className="border-t border-border py-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">Data Freshness</h2>
            <p className="text-[15px] text-body leading-[1.8]">
              Last dataset refresh: <strong>{DATA_LAST_REFRESHED}</strong>. We show current record counts on the homepage, pricing page, state directory, and individual state pages so buyers can evaluate coverage before purchase.
            </p>
          </section>

          <section className="border-t border-border pt-12">
            <h2 className="text-[22px] font-semibold text-ink mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
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
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/states" className="btn-primary">Browse State Data</Link>
              <Link href="/pricing" className="btn-outline">View Pricing</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
