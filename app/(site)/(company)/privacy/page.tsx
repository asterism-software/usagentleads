import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for USAgentLeads. Learn what information we collect, how we use it, and how to contact us about privacy questions.",
  alternates: {
    canonical: "https://www.usagentleads.com/privacy",
    languages: {
      "en-US": "https://www.usagentleads.com/privacy",
      "x-default": "https://www.usagentleads.com/privacy",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "Privacy Policy | USAgentLeads",
    description: "How USAgentLeads collects, uses, and protects information.",
    url: "https://www.usagentleads.com/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | USAgentLeads",
    description: "How USAgentLeads collects, uses, and protects information.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

const breadcrumb = generateBreadcrumbSchema([
  { name: "Home", url: "https://www.usagentleads.com" },
  { name: "Privacy Policy", url: "https://www.usagentleads.com/privacy" },
])

export default function PrivacyPage() {
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
            <span className="text-ink font-medium">Privacy Policy</span>
          </nav>

          <header className="border-b border-border pb-8">
            <p className="label-eyebrow mb-3">Legal</p>
            <h1 className="section-heading">Privacy Policy</h1>
            <p className="section-sub mt-3">Last updated: May 16, 2026</p>
          </header>

          <div className="prose py-10">
            <p>
              USAgentLeads provides real estate agent contact databases and related software services. This policy explains what information we collect, how we use it, and how to contact us with privacy questions.
            </p>

            <h2>Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email address, support messages, checkout details, and account information. Payment processing is handled by our payment provider, and we do not store full payment card numbers on our servers.
            </p>
            <p>
              We also collect limited usage and technical information, such as pages visited, device information, browser type, referral source, and product usage events. This helps us understand site performance, improve the product, prevent abuse, and support customers.
            </p>

            <h2>How We Use Information</h2>
            <p>
              We use information to provide downloads and subscriptions, send purchase confirmations, respond to support requests, improve the website, secure accounts, prevent fraud, and measure marketing performance.
            </p>

            <h2>Real Estate Agent Data</h2>
            <p>
              Our datasets are compiled from publicly available professional and licensing records. Customers are responsible for using downloaded data in compliance with applicable laws, including CAN-SPAM and other outreach rules.
            </p>

            <h2>Service Providers</h2>
            <p>
              We use trusted service providers for hosting, analytics, authentication, payments, email delivery, database storage, and customer support. These providers process information only as needed to help us operate USAgentLeads.
            </p>

            <h2>Your Choices</h2>
            <p>
              You can contact us to request access, correction, or deletion of account information where legally required. You can also unsubscribe from marketing emails by using the unsubscribe link in those emails.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions, contact us through the <Link href="/contact">contact page</Link> or email support@usagentleads.com.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
