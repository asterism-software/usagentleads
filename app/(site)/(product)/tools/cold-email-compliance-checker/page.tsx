import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ExternalLink, MailCheck, ShieldCheck } from "lucide-react"
import { ColdEmailComplianceChecker } from "@/components/tools/ColdEmailComplianceChecker"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"

const canonical = `${SITE_URL}/tools/cold-email-compliance-checker`
const ftcCanSpamUrl = "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business"

export const metadata: Metadata = {
  title: { absolute: "Cold Email Compliance Checker — Review Common CAN-SPAM Flags" },
  description:
    "Review a cold email's subject, body, and footer for common FTC CAN-SPAM text-level flags. Browser-based, free, and never a legal compliance certification.",
  keywords: [
    "cold email compliance checker",
    "CAN-SPAM checker",
    "CAN-SPAM email checklist",
    "cold email to real estate agents",
    "real estate agent outreach compliance",
  ],
  alternates: {
    canonical,
    languages: { "en-US": canonical, "x-default": canonical },
  },
  openGraph: {
    locale: "en_US",
    title: "Cold Email Compliance Checker — Review Common CAN-SPAM Flags",
    description:
      "Review subject, body, and footer copy for common commercial-email flags before you send. No upload, no sending, no compliance certification.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cold Email Compliance Checker | USAgentLeads",
    description: "Review common CAN-SPAM text-level flags in a draft email—free and browser-based.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "Does this tool certify CAN-SPAM compliance?",
    answer:
      "No. It flags common text-level items in the subject, body, and footer, but it cannot inspect headers, sender identity, an opt-out mechanism, your sending platform, or the law as applied to your situation. Review the FTC guidance and obtain legal advice when appropriate.",
  },
  {
    question: "Does the checker send or store my email copy?",
    answer:
      "No. The checker runs in your browser. It does not send your email or submit the pasted subject, body, or footer to USAgentLeads.",
  },
  {
    question: "What common items does the checker look for?",
    answer:
      "It looks for text patterns that may indicate a postal address, opt-out wording, a commercial-message disclosure phrase, and unresolved merge tags. It also reminds you that subject accuracy and sender/header information require manual review.",
  },
]

export default function ColdEmailComplianceCheckerPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Cold Email Compliance Checker", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Cold Email Compliance Checker",
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
      "A free browser-based checker that reviews pasted commercial email copy for common CAN-SPAM text-level flags. It does not certify legal compliance.",
    featureList: [
      "Subject-line review reminder",
      "Postal-address text detection",
      "Opt-out wording detection",
      "Commercial-disclosure and merge-tag review prompts",
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
            <ChevronRight size={14} className="text-muted" aria-hidden="true" />
            <Link href="/tools" className="transition-colors hover:text-ink">Free Tools</Link>
            <ChevronRight size={14} className="text-muted" aria-hidden="true" />
            <span className="font-medium text-ink">Cold Email Compliance Checker</span>
          </nav>

          <header className="border-b border-border pb-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <div className="max-w-3xl">
                <p className="label-eyebrow mb-3">Free browser tool</p>
                <h1 className="section-heading">Cold Email Compliance Checker</h1>
                <p className="section-sub mt-4">
                  Review the visible subject, body, and footer of a commercial email for common FTC CAN-SPAM flags before you send it to real estate agents or any other business audience.
                </p>
              </div>
              <div className="rounded-xl border border-accent-mid bg-accent-light p-5">
                <ShieldCheck size={20} className="text-accent" aria-hidden="true" />
                <p className="mt-3 text-[14px] font-semibold text-ink">A review aid, not legal advice</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-tertiary">
                  It never certifies an email as compliant and cannot verify headers, sender identity, or a working unsubscribe mechanism.
                </p>
              </div>
            </div>
          </header>

          <section className="scroll-mt-24 py-10" aria-label="Cold email compliance checker">
            <ColdEmailComplianceChecker />
          </section>

          <section className="border-t border-border py-16" aria-labelledby="review-points-heading">
            <div className="max-w-4xl">
              <p className="label-eyebrow mb-3">What to review</p>
              <h2 id="review-points-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                Use the checker as one step in a responsible sending process
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-[1.8] text-body">
                The FTC&apos;s CAN-SPAM guidance covers more than a draft&apos;s visible copy. In particular, commercial email needs accurate header information, a non-deceptive subject line, an advertising disclosure, a valid postal address, and a functioning opt-out method. The sender must also honor opt-out requests.
              </p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Visible copy",
                    body: "Check for a clear commercial-message disclosure, a valid postal address, and a visible way to opt out.",
                  },
                  {
                    title: "What text cannot prove",
                    body: "Confirm From, To, Reply-To, and routing information accurately identify the sender. Test every link and opt-out flow.",
                  },
                  {
                    title: "Keep records and review",
                    body: "Honor opt-outs, follow your sending provider's policies, and seek qualified advice for your specific campaign.",
                  },
                ].map((item) => (
                  <article key={item.title} className="card p-5">
                    <MailCheck size={18} className="text-accent" aria-hidden="true" />
                    <h3 className="mt-4 text-[15px] font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">{item.body}</p>
                  </article>
                ))}
              </div>
              <a
                href={ftcCanSpamUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-outline mt-7"
              >
                Read the FTC CAN-SPAM guide
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="border-t border-border pb-20 pt-16" id="faq" aria-labelledby="faq-heading">
            <div className="max-w-3xl">
              <p className="label-eyebrow mb-3">FAQs</p>
              <h2 id="faq-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                About this free email review tool
              </h2>
              <div className="mt-7 divide-y divide-border rounded-xl border border-border bg-white px-5 sm:px-6">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group py-5">
                    <summary className="cursor-pointer list-none pr-8 text-[15px] font-semibold text-ink marker:content-none">
                      {faq.question}
                    </summary>
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
