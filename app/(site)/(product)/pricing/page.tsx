export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { Check, Minus, ChevronRight } from "lucide-react"
import { PlanGroups } from "@/components/pricing/PlanGroups"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { getDatabaseTotals } from "@/lib/supabase/server"
import { TOTAL_AGENTS } from "@/lib/utils/states"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"

const pricingProductSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "USAgentLeads Real Estate Agent Database",
  description: `Complete US real estate agent contact database with ${TOTAL_AGENTS.toLocaleString()}+ verified contacts across all 50 states`,
  image: "https://www.usagentleads.com/opengraph-image",
  brand: { "@type": "Brand", name: "USAgentLeads" },
  offers: [
    {
      "@type": "Offer",
      name: "State Pack",
      price: "49.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.usagentleads.com/states",
      priceValidUntil: "2027-12-31",
      seller: { "@type": "Organization", name: "USAgentLeads" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    {
      "@type": "Offer",
      name: "Full Database",
      price: "199.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.usagentleads.com/pricing",
      priceValidUntil: "2027-12-31",
      seller: { "@type": "Organization", name: "USAgentLeads" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    {
      "@type": "Offer",
      name: "Pro Dashboard",
      price: "49.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.usagentleads.com/pricing",
      priceValidUntil: "2027-12-31",
      seller: { "@type": "Organization", name: "USAgentLeads" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    {
      "@type": "Offer",
      name: "Pro API",
      price: "79.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://www.usagentleads.com/pricing",
      priceValidUntil: "2027-12-31",
      seller: { "@type": "Organization", name: "USAgentLeads" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: "0", maxValue: "0", unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  ],
}

export const metadata: Metadata = {
  title: "Pricing 2026 — Real Estate Agent Database from $49/State",
  description:
    "2026 realtor email lists from $49/state or $199 for all 50 states. 1.1M+ verified contacts, instant CSV delivery, no subscription. Free sample available.",
  alternates: {
    canonical: "https://www.usagentleads.com/pricing",
    languages: {
      "en-US": "https://www.usagentleads.com/pricing",
      "x-default": "https://www.usagentleads.com/pricing",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "Pricing — Real Estate Agent Database from $49/State",
    description:
      "Realtor email lists from $49/state or $199 for all 50 states. 1.1M+ verified contacts, instant CSV delivery, no subscription.",
    url: "https://www.usagentleads.com/pricing",
    images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: "USAgentLeads - Real Estate Agent Contact Database" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Real Estate Agent Database from $49/State",
    description: "Verified real estate agent contact data starting at $49 per state or $199 for all 50 states. Instant CSV delivery.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

const comparisonRows = [
  { label: "Price", state: "$49/state", full: "$199", pro: "$49/mo", proApi: "$79/mo" },
  { label: "All 50 states", state: false, full: true, pro: false, proApi: false },
  { label: "CSV download", state: true, full: true, pro: false, proApi: false },
  { label: "Dashboard access", state: false, full: false, pro: true, proApi: true },
  { label: "Search & filter", state: false, full: false, pro: true, proApi: true },
  { label: "API access", state: false, full: false, pro: false, proApi: true },
  { label: "API requests/mo", state: false, full: false, pro: false, proApi: "10,000" },
  { label: "Account required", state: false, full: false, pro: "Email", proApi: "Email" },
  { label: "Delivery", state: "Email CSV", full: "Email CSV", pro: "Instant", proApi: "Instant" },
]

function renderCell(val: boolean | string) {
  if (val === true) return <Check size={15} className="text-success mx-auto" />
  if (val === false) return <Minus size={15} className="text-muted mx-auto" />
  return <span className="font-mono text-[14px] text-ink">{val}</span>
}

const pricingFAQs = [
  {
    question: "Is there a free sample?",
    answer:
      "Yes. You can download a free sample of 500 agent contacts before purchasing — no account needed. The Pro Dashboard and Pro API plans don't include a free trial, but every plan is covered by our 30-day money-back guarantee, so you can try it risk-free.",
  },
  {
    question: "Do I need to create an account to buy?",
    answer:
      "No. State packs and the full database are guest checkouts — just enter your email at checkout and we send the download link. The Pro Dashboard and Pro API plans require an email to create your account.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal through our payment processor, Lemon Squeezy. All transactions are SSL-encrypted.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Yes. All purchases come with a 30-day money-back guarantee. If the data doesn't meet your expectations, contact us for a full refund — no questions asked.",
  },
  {
    question: "How is the data delivered?",
    answer:
      "CSV purchases (State Pack and Full Database) are delivered instantly via email as a download link. Pro Dashboard and Pro API access is activated immediately after signup.",
  },
  {
    question: "What's the difference between the Full Database and Pro Dashboard?",
    answer:
      "The Full Database ($199 one-time) gives you a single CSV download of all 1.1M+ contacts. The Pro Dashboard ($49/month) gives you a searchable, filterable interface to browse agents in-app without downloading a file. Choose CSV if you want the data in your own tools; choose Pro if you prefer a web interface.",
  },
  {
    question: "Should I buy state packs or the full database?",
    answer:
      "Simple math: state packs are $49 each, so at four or more states the $199 full database is already cheaper — and it covers all 50, so expanding into new markets later costs nothing extra.",
  },
  {
    question: "What does this work out to per contact?",
    answer:
      "The full database is $199 for 1,100,000+ contacts — a fraction of a cent each. For comparison, credit-based prospecting tools commonly charge from roughly $0.10 to $0.50+ per revealed contact at their published rates.",
  },
  {
    question: "Do phone numbers cost extra?",
    answer:
      "No. Phone numbers are included in every purchase at no extra charge — over 90% of records have a phone number. There is no separate phone-append fee.",
  },
  {
    question: "Can my whole team use one purchase?",
    answer:
      "Yes. CSV purchases aren't seat-licensed — one purchase covers use across your business, including agency use on behalf of clients. Only reselling the raw data itself requires separate licensing.",
  },
  {
    question: "Will I get an invoice or receipt?",
    answer:
      "Yes. Our payment processor, Lemon Squeezy, emails a receipt for every purchase, and subscription invoices are available anytime from your Lemon Squeezy customer portal.",
  },
]

// Competitor pricing verified against vendor pricing pages and third-party
// pricing guides, July 2026. Quote-based products use reported ranges.
const marketComparisonRows = [
  { provider: "USAgentLeads — Full Database", price: "$199 one-time", model: "Flat rate, 1.1M+ agent contacts, yours permanently", isUs: true },
  { provider: "ZoomInfo", price: "Reported from ~$14,995/yr", model: "Quote-only annual contracts, credit-limited exports" },
  { provider: "Data Axle Genie", price: "Reported $99–299/mo", model: "12-month contract, lead caps with overage charges" },
  { provider: "UpLead", price: "From $99/mo", model: "Credit-based (~170 credits/mo at entry tier)" },
  { provider: "BookYourData", price: "~$0.10–0.40 per contact", model: "Pay-as-you-go credits, no subscription" },
  { provider: "Cole Realty Resource", price: "Reported $995/yr (Pro)", model: "Annual plan; homeowner farm data, not agent contacts" },
]

const includedItems = [
  { title: "Four clean columns", detail: "name, email, phone, state — UTF-8 CSV that opens in Excel, Google Sheets, or any CRM" },
  { title: "All records for what you bought", detail: "No credit meters, reveal limits, or per-contact charges — a state pack is the whole state" },
  { title: "Instant email delivery", detail: "Download link arrives within minutes of payment, guest checkout, no account needed" },
  { title: "Phone numbers included", detail: "Over 90% of records carry a phone number at no extra cost" },
  { title: "Unlimited business use", detail: "Import into any tool, run any number of campaigns, use across clients" },
  { title: "30-day money-back guarantee", detail: "Full refund if the data doesn't meet your expectations — no questions asked" },
]

export default async function PricingPage() {
  const { count: totalCount, emails: totalEmails, phones: totalPhones } = await getDatabaseTotals()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Pricing", url: "https://www.usagentleads.com/pricing" },
  ])
  const faqSchema = generateFAQSchema(pricingFAQs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([pricingProductSchema, breadcrumb, faqSchema]) }}
      />
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-28 max-sm:py-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] text-tertiary mb-10 -mt-6 sm:-mt-12">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight size={14} className="text-muted" />
          <span className="text-ink font-medium">Pricing</span>
        </nav>

        {/* Header */}
        <div className="section-header text-center flex flex-col items-center mb-10">
          <p className="label-eyebrow">Pricing</p>
          <h1 className="section-heading">Simple, Transparent Pricing</h1>
          <p className="section-sub max-w-xl">
            Buy a one-time CSV download, or subscribe for always-current data. No hidden fees.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-14">
          <AnswerBox>
            USAgentLeads costs $49 one-time per state or $199 one-time for all 50 states ({TOTAL_AGENTS.toLocaleString()}+ real estate agent contacts as an instant CSV download). Optional subscriptions: Pro Dashboard at $49/month (searchable web interface) and Pro API at $79/month (10,000 requests/month). There are no contracts, no per-contact credits, and every purchase carries a 30-day money-back guarantee.
          </AnswerBox>
        </div>

        {/* Grouped plans */}
        <PlanGroups
          totalCount={totalCount}
          totalEmails={totalEmails}
          totalPhones={totalPhones}
          variant="page"
          headingLevel="h2"
        />

        {/* Comparison table */}
        <div className="mt-20 max-w-4xl mx-auto card overflow-hidden overflow-x-auto">
          <table className="data-table min-w-120">
            <thead>
              <tr>
                <th aria-hidden="true" className="bg-white" />
                <th colSpan={2} className="text-center text-ink border-l border-border">One-time downloads</th>
                <th colSpan={2} className="text-center text-ink border-l border-border">Monthly subscriptions</th>
              </tr>
              <tr>
                <th className="text-left">Feature</th>
                <th className="text-center">State Pack</th>
                <th className="text-center bg-accent-light/50">Full Database</th>
                <th className="text-center">Pro Dashboard</th>
                <th className="text-center">Pro API</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <td className="text-[14px] text-ink font-medium">{row.label}</td>
                  <td className="text-center">{renderCell(row.state)}</td>
                  <td className="text-center bg-accent-light/30">{renderCell(row.full)}</td>
                  <td className="text-center">{renderCell(row.pro)}</td>
                  <td className="text-center">{renderCell(row.proApi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* What every purchase includes */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-[22px] font-semibold text-ink text-center mb-8">
            What Every CSV Purchase Includes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {includedItems.map((item) => (
              <div key={item.title} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={15} className="text-success shrink-0" />
                  <h3 className="text-[14px] font-semibold text-ink">{item.title}</h3>
                </div>
                <p className="text-[13px] text-tertiary leading-[1.7]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market pricing comparison */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-[22px] font-semibold text-ink text-center mb-3">
            How Our Pricing Compares
          </h2>
          <p className="text-[14px] text-tertiary text-center max-w-xl mx-auto mb-8">
            Verified against vendor pricing pages and independent pricing guides as of July 2026. Quote-based products show reported ranges — always confirm current rates with each vendor.
          </p>
          <div className="card overflow-hidden overflow-x-auto">
            <table className="data-table min-w-140">
              <thead>
                <tr>
                  <th scope="col" className="text-left">Provider</th>
                  <th scope="col" className="text-left">Price</th>
                  <th scope="col" className="text-left">Model</th>
                </tr>
              </thead>
              <tbody>
                {marketComparisonRows.map((row) => (
                  <tr key={row.provider} className={row.isUs ? "bg-accent-light/30" : undefined}>
                    <td className={`text-[14px] font-medium ${row.isUs ? "text-accent" : "text-ink"}`}>{row.provider}</td>
                    <td className="font-mono text-[13px] text-ink whitespace-nowrap">{row.price}</td>
                    <td className="text-[13px] text-tertiary">{row.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-tertiary text-center mt-4">
            Want the details?{" "}
            <Link href="/compare" className="text-accent hover:underline">Head-to-head comparisons</Link>
            {" · "}
            <Link href="/alternatives" className="text-accent hover:underline">Alternatives guides</Link>
          </p>
        </div>

        {/* Pricing FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-[22px] font-semibold text-ink text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {pricingFAQs.map((faq) => (
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
          <p className="text-[14px] text-tertiary text-center mt-8">
            More questions?{" "}
            <Link href="/faq" className="text-accent hover:underline font-medium">
              Read the full FAQ
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
