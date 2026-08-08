import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for USAgentLeads. Review the terms that apply when using our website, downloads, data products, and subscriptions.",
  alternates: {
    canonical: "https://www.usagentleads.com/terms",
    languages: {
      "en-US": "https://www.usagentleads.com/terms",
      "x-default": "https://www.usagentleads.com/terms",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "Terms of Service | USAgentLeads",
    description: "Terms for using USAgentLeads products, data downloads, and subscriptions.",
    url: "https://www.usagentleads.com/terms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | USAgentLeads",
    description: "Terms for using USAgentLeads products, data downloads, and subscriptions.",
    images: ["https://www.usagentleads.com/opengraph-image.png"],
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: "Home", url: "https://www.usagentleads.com" },
  { name: "Terms of Service", url: "https://www.usagentleads.com/terms" },
])

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pb-8">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">Terms of Service</span>
          </nav>

          <header className="border-b border-border pb-8">
            <p className="label-eyebrow mb-3">Legal</p>
            <h1 className="section-heading">Terms of Service</h1>
            <p className="section-sub mt-3">Last updated: May 16, 2026</p>
          </header>

          <div className="prose py-10">
            <p>
              These terms govern your use of USAgentLeads, including our website, data downloads, subscriptions, API, and related services. By using USAgentLeads, you agree to these terms.
            </p>

            <h2>Products and Access</h2>
            <p>
              USAgentLeads sells real estate agent contact data, software access, and related services. Product availability, fields, coverage, and pricing may change over time as data sources and service offerings change.
            </p>

            <h2>Permitted Use</h2>
            <p>
              You may use purchased data for your own lawful business purposes, including CRM import, sales outreach, market research, and campaign planning. You are responsible for complying with applicable laws, platform rules, email sending policies, and privacy requirements.
            </p>

            <h2>Restricted Use</h2>
            <p>
              You may not use USAgentLeads to send unlawful, deceptive, abusive, or non-compliant messages. You may not attempt to disrupt the service, bypass access controls, scrape authenticated areas, resell raw data as a standalone competing database, or use the service in a way that violates applicable law.
            </p>

            <h2>Data Accuracy</h2>
            <p>
              We work to keep data accurate and useful, but professional contact data changes over time. We do not guarantee that every record will be complete, current, deliverable, or suitable for every campaign.
            </p>

            <h2>Payments and Delivery</h2>
            <p>
              One-time CSV purchases are delivered electronically after successful checkout. Subscription products provide access while the subscription is active. Payment processing is handled by our payment provider.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              USAgentLeads is provided as is and as available. To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms can be sent through the <Link href="/contact">contact page</Link> or to support@usagentleads.com.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
