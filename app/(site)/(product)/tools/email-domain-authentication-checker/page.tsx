import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, MailCheck, ShieldCheck, ShieldQuestion } from "lucide-react"
import { EmailDomainAuthenticationChecker } from "@/components/tools/EmailDomainAuthenticationChecker"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"

const canonical = `${SITE_URL}/tools/email-domain-authentication-checker`

export const metadata: Metadata = {
  title: { absolute: "Free SPF, DKIM & DMARC Checker for Email Outreach | USAgentLeads" },
  description:
    "Check public SPF and DMARC DNS records for your agent-outreach sending domain. Understand what a public DNS lookup can—and cannot—verify about email authentication.",
  keywords: [
    "SPF DKIM DMARC checker",
    "email domain authentication checker",
    "DMARC checker",
    "SPF record checker",
    "email authentication checker",
  ],
  alternates: { canonical, languages: { "en-US": canonical, "x-default": canonical } },
  openGraph: {
    locale: "en_US",
    title: "Free SPF, DKIM & DMARC Checker for Email Outreach",
    description: "Inspect public SPF and DMARC records before an agent-outreach campaign.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free SPF, DKIM & DMARC Checker | USAgentLeads",
    description: "Inspect public email-authentication DNS records before sending outreach.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "What does this email authentication checker look up?",
    answer:
      "It reads public DNS TXT records at the domain you enter and its _dmarc subdomain. It identifies published SPF and DMARC records and shows a readable DMARC policy when one is present.",
  },
  {
    question: "Can this tool verify DKIM?",
    answer:
      "Not from a domain alone. DKIM records are published at provider-specific selectors, so verify the selector and passing DKIM result in your sending provider or a message's authentication headers.",
  },
  {
    question: "Does a found record mean my email will reach the inbox?",
    answer:
      "No. A public record is only one part of email delivery. This tool does not test message-level authentication, alignment, reputation, recipient consent, spam complaints, or inbox placement.",
  },
]

export default function EmailDomainAuthenticationCheckerPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Email Domain Authentication Checker", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Email Domain Authentication Checker",
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
            <span className="font-medium text-ink">Email Authentication Checker</span>
          </nav>

          <header className="max-w-3xl border-b border-border pb-10 sm:pb-12">
            <p className="label-eyebrow mb-3">Free email infrastructure tool</p>
            <h1 className="section-heading">Check your outreach domain&apos;s public authentication records</h1>
            <p className="section-sub mt-4 max-w-2xl">
              Inspect SPF and DMARC DNS records before sending to real estate agents. Understand what a public check can verify, and where your sending provider still needs to confirm the details.
            </p>
          </header>

          <section className="py-10 sm:py-12">
            <EmailDomainAuthenticationChecker />
          </section>

          <section className="border-t border-border py-14 sm:py-16">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Public records only", text: "The tool checks public DNS TXT records. It never asks for mailbox, provider, or account credentials." },
                { icon: MailCheck, title: "No inbox promises", text: "Authentication record presence does not prove message-level passing, alignment, consent, or inbox placement." },
                { icon: ShieldQuestion, title: "Keep guidance current", text: "Sending requirements and provider policies change. Verify them with your email provider before launch." },
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
              <h2 className="section-heading mt-2">Before you send</h2>
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
