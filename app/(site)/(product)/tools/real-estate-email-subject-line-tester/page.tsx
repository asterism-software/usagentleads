import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Eye, MessageSquareText, ScanText } from "lucide-react"
import { RealEstateEmailSubjectLineTester } from "@/components/tools/RealEstateEmailSubjectLineTester"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"

const canonical = `${SITE_URL}/tools/real-estate-email-subject-line-tester`

export const metadata: Metadata = {
  title: { absolute: "Real Estate Email Subject Line Tester — Free | USAgentLeads" },
  description:
    "Test two real estate agent outreach subject lines for length, compact inbox previews, personalization tokens, and clarity prompts. Free, browser-based, no signup.",
  keywords: [
    "real estate email subject line tester",
    "realtor email subject lines",
    "cold email subject line checker",
    "preview text checker",
    "real estate email subject line generator",
  ],
  alternates: { canonical, languages: { "en-US": canonical, "x-default": canonical } },
  openGraph: {
    locale: "en_US",
    title: "Real Estate Email Subject Line Tester — Free",
    description: "Compare agent-outreach subject lines and compact inbox previews without an open-rate promise.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Email Subject Line Tester | USAgentLeads",
    description: "Review subject-line length, previews, and personalization tokens for free.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "Does this subject line tester predict open rates?",
    answer:
      "No. It provides editing prompts based on your draft's length, compact preview, punctuation, promotional wording, and personalization tokens. It does not predict delivery, inbox placement, opens, or replies.",
  },
  {
    question: "Does the tool send or save my drafts?",
    answer:
      "No. The comparison runs in your browser and does not send, save, or submit subject lines or preview text to USAgentLeads.",
  },
  {
    question: "Why should I check personalization tokens?",
    answer:
      "A visible placeholder can make a campaign feel careless or confusing. Confirm every token resolves using your sending platform before you schedule an outreach list.",
  },
]

export default function RealEstateEmailSubjectLineTesterPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Real Estate Email Subject Line Tester", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Real Estate Email Subject Line Tester",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    url: canonical,
    isAccessibleForFree: true,
    description: metadata.description,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, faqSchema, appSchema]) }} />
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 pb-6 pt-10 text-[14px] text-tertiary" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-ink">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <Link href="/tools" className="transition-colors hover:text-ink">Free Tools</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium text-ink">Subject Line Tester</span>
          </nav>

          <header className="max-w-3xl border-b border-border pb-10 sm:pb-12">
            <p className="label-eyebrow mb-3">Free email copy tool</p>
            <h1 className="section-heading">Test your real estate agent outreach subject lines</h1>
            <p className="section-sub mt-4 max-w-2xl">
              Compare two drafts for clarity, compact inbox previews, and unresolved personalization tokens—without a made-up spam score or open-rate promise.
            </p>
          </header>

          <section className="py-10 sm:py-12"><RealEstateEmailSubjectLineTester /></section>

          <section className="border-t border-border py-14 sm:py-16">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: Eye, title: "Preview before you send", text: "See an intentionally compact inbox-style preview, then decide whether the clearest point appears early enough." },
                { icon: ScanText, title: "Spot unresolved fields", text: "Get a clear reminder when familiar personalization-token formats are still visible in the draft." },
                { icon: MessageSquareText, title: "Keep it aligned", text: "Use the checker to make sure urgency, claims, and preview text match the email you actually intend to send." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl border border-border bg-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-mid bg-accent-light text-accent"><Icon size={17} /></span>
                  <h2 className="mt-4 text-[16px] font-semibold text-ink">{title}</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-tertiary">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-border py-14 sm:py-16">
            <div className="max-w-3xl">
              <p className="label-eyebrow">FAQ</p>
              <h2 className="section-heading mt-2">Use it as a final editing pass</h2>
              <div className="mt-7 divide-y divide-border rounded-xl border border-border bg-white">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group px-5 py-4 sm:px-6">
                    <summary className="cursor-pointer list-none pr-6 text-[15px] font-medium text-ink">{faq.question}</summary>
                    <p className="mt-3 text-[14px] leading-relaxed text-tertiary">{faq.answer}</p>
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
