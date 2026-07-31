import type { Metadata } from "next"
import Link from "next/link"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { TOTAL_AGENTS } from "@/lib/utils/states"
import { DATA_LAST_REFRESHED, DATA_SOURCES, SUPPORT_EMAIL } from "@/lib/utils/site"
import { ChevronRight, ArrowRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

export const metadata: Metadata = {
  title: "FAQ — Real Estate Agent Database Questions Answered 2026",
  description:
    "Every question buyers ask before purchasing a realtor email list: data sources, accuracy, delivery, refunds, compliance, per-state vs full database, Pro Dashboard, and API.",
  alternates: {
    canonical: `${BASE_URL}/faq`,
    languages: { "en-US": `${BASE_URL}/faq`, "x-default": `${BASE_URL}/faq` },
  },
  openGraph: {
    locale: "en_US",
    title: "FAQ — Real Estate Agent Database Questions Answered",
    description:
      "Data sources, accuracy, delivery, refunds, compliance, and plan questions — answered.",
    url: `${BASE_URL}/faq`,
    type: "website",
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
}

interface FAQItem {
  question: string
  answer: string
  link?: { href: string; label: string }
}

function buildCategories(): { name: string; items: FAQItem[] }[] {
  const count = TOTAL_AGENTS.toLocaleString()
  return [
    {
      name: "About the Data",
      items: [
        {
          question: "What exactly do I get when I buy?",
          answer: `A standard UTF-8 CSV file with four columns — name, email, phone, and state — covering ${count}+ licensed real estate agents. It opens in Excel or Google Sheets and imports into any CRM or email tool without reformatting.`,
          link: { href: "/guides", label: "See import guides for popular tools" },
        },
        {
          question: "Where does the data come from?",
          answer: `Records are compiled from public sources including ${DATA_SOURCES.slice(0, -1).join(", ")}, and ${DATA_SOURCES[DATA_SOURCES.length - 1].toLowerCase()}.`,
          link: { href: "/data-sources", label: "Read the full data sources breakdown" },
        },
        {
          question: "How fresh is the data?",
          answer: `The current dataset was last refreshed in ${DATA_LAST_REFRESHED}. Between refreshes we run cleanup passes that remove duplicates and malformed records.`,
        },
        {
          question: "What share of records include phone numbers?",
          answer:
            "Over 90% of records include an email address across the database, and over 90% of records include a phone number. Phone numbers are included at no extra charge — there's no separate 'phone append' fee.",
        },
        {
          question: "Do you have data for my specific state?",
          answer:
            "Yes — all 50 US states are covered, each available as an individual $49 state pack. Every state page shows the live agent count for that state before you buy.",
          link: { href: "/states", label: "Browse all 50 states with live counts" },
        },
        {
          question: "Does the data include brokerage names, license numbers, or production stats?",
          answer:
            "No. Records contain name, email, phone, and state. If you need production data or transaction analytics, an enterprise platform like CoStar serves that need — see our comparisons for an honest breakdown.",
          link: { href: "/compare", label: "See how we compare to other providers" },
        },
        {
          question: "Can I try before buying?",
          answer:
            "Yes — download a free sample of 500 agent contacts, no account required. It's the fastest way to check the data format and quality yourself.",
        },
      ],
    },
    {
      name: "Buying & Delivery",
      items: [
        {
          question: "Do I need to create an account?",
          answer:
            "Not for CSV purchases. State packs and the full database are guest checkouts — enter your email at checkout and the download link arrives by email. Only the Pro Dashboard and Pro API subscriptions require an account.",
        },
        {
          question: "How fast is delivery?",
          answer:
            "Instant. Your download link is emailed within minutes of payment confirmation. Subscriptions activate immediately after signup.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "All major credit cards (Visa, Mastercard, Amex) and PayPal, processed by Lemon Squeezy over SSL. You'll receive a receipt by email from Lemon Squeezy for your records.",
        },
        {
          question: "I didn't receive my download email — what now?",
          answer: `Check your spam folder first — download emails occasionally land there. If it's not there within 15 minutes, contact ${SUPPORT_EMAIL} with your order email and we'll resend the link.`,
          link: { href: "/contact", label: "Contact support" },
        },
        {
          question: "Should I buy a state pack or the full database?",
          answer:
            "Buy states individually at $49 if you target 1–3 markets. At 4+ states the $199 full database is cheaper than stacking packs — and it includes every state, so expansion later costs nothing.",
          link: { href: "/pricing", label: "Compare all plans" },
        },
      ],
    },
    {
      name: "Pricing & Refunds",
      items: [
        {
          question: "Is this a subscription?",
          answer:
            "CSV purchases are one-time — pay once, keep the data. The optional Pro Dashboard ($49/mo) and Pro API ($79/mo) are monthly subscriptions for teams that want a searchable interface or programmatic access instead of a static file.",
        },
        {
          question: "What's your refund policy?",
          answer:
            "Every purchase carries a 30-day money-back guarantee. If the data doesn't meet your expectations, contact us for a full refund — no questions asked.",
        },
        {
          question: "How do I cancel a Pro subscription?",
          answer:
            "From your Lemon Squeezy customer portal, anytime, with no penalties. Access continues through the end of the paid period.",
        },
        {
          question: "What does the data cost per contact?",
          answer: `The $199 full database includes ${count}+ contacts — a fraction of a cent per contact. Credit-based platforms commonly charge $0.10–0.50+ per revealed contact, which is why bulk vertical data is sold flat-rate.`,
          link: { href: "/alternatives", label: "See researched pricing comparisons" },
        },
      ],
    },
    {
      name: "Using the Data",
      items: [
        {
          question: "Is it legal to email these contacts?",
          answer:
            "The records are business contact information for licensed professionals, compiled from public sources. Commercial email to them is governed by CAN-SPAM in the US: use accurate subject lines, identify your business with a physical address, and honor unsubscribes promptly. You're responsible for compliance as the sender.",
        },
        {
          question: "Can I use the data for multiple campaigns or clients?",
          answer:
            "Yes. Once purchased, the data is yours for your business use with no per-use restrictions — agencies routinely use it across client engagements. Reselling the raw data itself requires a separate licensing conversation.",
          link: { href: "/contact", label: "Ask about licensing" },
        },
        {
          question: "Which tools does the CSV work with?",
          answer:
            "Anything that accepts CSV import: cold email platforms (Instantly, Smartlead, lemlist), email marketing tools (Mailchimp, ActiveCampaign, Brevo), and CRMs (HubSpot, Salesforce, GoHighLevel, Close). We publish step-by-step import guides with field mappings for each.",
          link: { href: "/guides", label: "Browse import guides" },
        },
        {
          question: "How should I email a large list without hurting deliverability?",
          answer:
            "Never blast the full list from one inbox. Use warmed sending domains, keep per-inbox daily volume low, verify emails before big sends, and segment by state so copy stays relevant. Our import guides include per-tool deliverability tips.",
        },
        {
          question: "Are you affiliated with NAR or any MLS?",
          answer:
            "No. USAgentLeads is an independent data provider and is not affiliated with the National Association of Realtors or any MLS.",
        },
      ],
    },
    {
      name: "Pro Dashboard & API",
      items: [
        {
          question: "What is the Pro Dashboard?",
          answer: `A searchable web interface to all ${count}+ agents — filter by state, name, or email in the browser without handling CSV files. $49/month, cancel anytime.`,
        },
        {
          question: "What does the Pro API include?",
          answer:
            "REST API access to query the full agent database programmatically — 10,000 requests per month for $79/month, with API keys managed from your dashboard.",
          link: { href: "/docs", label: "Read the API documentation" },
        },
        {
          question: "CSV download vs Pro Dashboard — which should I pick?",
          answer:
            "Choose the CSV if you want the data inside your own tools (email platforms, CRMs, spreadsheets). Choose the Pro Dashboard if you prefer looking agents up in a web interface without managing files. The CSV is one-time; the dashboard is a subscription.",
        },
      ],
    },
  ]
}

export default function FAQPage() {
  const categories = buildCategories()
  const allFaqs = categories.flatMap((c) => c.items.map(({ question, answer }) => ({ question, answer })))

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "FAQ", url: `${BASE_URL}/faq` },
  ])
  const faqSchema = generateFAQSchema(allFaqs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">FAQ</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">FAQ</p>
            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
              style={{ fontSize: "clamp(32px, 8vw, 64px)" }}
            >
              Questions, Answered
            </h1>
            <p className="text-[15px] sm:text-[17px] text-tertiary mb-10">
              Everything buyers actually ask before purchasing — about the data, delivery, refunds, compliance, and the Pro plans. Can&apos;t find your question?{" "}
              <Link href="/contact" className="text-accent hover:underline">Ask us directly</Link>.
            </p>

            <AnswerBox label="In Short">
              USAgentLeads sells a verified database of {TOTAL_AGENTS.toLocaleString()}+ licensed US real estate agents — name, email, phone, and state — as an instant CSV download for $49 per state or $199 one-time for all 50 states. Data is compiled from public licensing and listing sources, delivery is instant via email with guest checkout, and every purchase has a 30-day money-back guarantee.
            </AnswerBox>

            {/* Category quick-nav */}
            <div className="flex flex-wrap gap-2 mb-12">
              {categories.map((cat) => (
                <a
                  key={cat.name}
                  href={`#${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="px-3.5 py-2 rounded-lg bg-white border border-border hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px] text-ink font-medium"
                >
                  {cat.name}
                </a>
              ))}
            </div>

            {categories.map((cat) => (
              <section
                key={cat.name}
                id={cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="mb-12 scroll-mt-24"
              >
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  {cat.name}
                </h2>
                <div className="space-y-4">
                  {cat.items.map((faq) => (
                    <details key={faq.question} className="group card p-5">
                      <summary className="cursor-pointer text-[15px] font-semibold text-ink list-none flex items-center justify-between gap-3">
                        {faq.question}
                        <ChevronRight size={16} className="text-muted shrink-0 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[14px] text-body leading-[1.8]">{faq.answer}</p>
                        {faq.link && (
                          <Link
                            href={faq.link.href}
                            className="inline-flex items-center gap-1.5 text-[13px] text-accent font-medium hover:underline mt-2"
                          >
                            {faq.link.label}
                            <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}

            {/* CTA */}
            <div className="card p-5 sm:p-7 border-accent/30 border-2 text-center">
              <p className="text-[15px] text-body mb-4">
                Still deciding? Grab the free 500-contact sample and inspect the data yourself.
              </p>
              <Link href="/states" className="btn-primary inline-flex items-center gap-2">
                Browse the Database
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
