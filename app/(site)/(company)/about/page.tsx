export const revalidate = 3600

import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Database, Shield, Zap, Users, BarChart3, HeadphonesIcon } from "lucide-react"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { getTotalCount } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "About Us | Who We Are & Why USAgentLeads Exists",
  description:
    "USAgentLeads provides verified real estate agent contact data for all 50 US states. Learn about our mission, data sourcing, and commitment to accuracy.",
  alternates: {
    canonical: "https://www.usagentleads.com/about",
    languages: {
      "en-US": "https://www.usagentleads.com/about",
      "x-default": "https://www.usagentleads.com/about",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "About Us | Who We Are & Why USAgentLeads Exists",
    description:
      "USAgentLeads provides verified real estate agent contact data for all 50 US states. Learn about our mission, data sourcing, and commitment to accuracy.",
    url: "https://www.usagentleads.com/about",
    images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: "USAgentLeads - About Us" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Who We Are & Why USAgentLeads Exists",
    description:
      "USAgentLeads provides verified real estate agent contact data for all 50 US states.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

const values = [
  {
    icon: Database,
    title: "Data Accuracy",
    description:
      "Our database is sourced from official state licensing boards and public records. We verify and deduplicate contacts regularly to maintain 90%+ deliverability.",
  },
  {
    icon: Shield,
    title: "Compliance First",
    description:
      "All data is sourced from publicly available records. We follow CAN-SPAM guidelines and make it easy for our customers to run compliant outreach campaigns.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description:
      "No waiting for manual fulfillment. Purchase a state pack or full database and get your CSV download link within seconds, 24/7.",
  },
  {
    icon: Users,
    title: "Built for B2B",
    description:
      "We serve marketing agencies, SaaS companies, mortgage lenders, coaches, and anyone who sells to real estate professionals.",
  },
  {
    icon: BarChart3,
    title: "Transparent Pricing",
    description:
      "Simple, one-time pricing with no hidden fees or recurring charges for data downloads. What you see is what you pay.",
  },
  {
    icon: HeadphonesIcon,
    title: "Real Support",
    description:
      "Questions about data quality, formatting, or CRM imports? Our team responds within 24 hours, every time.",
  },
]

const breadcrumb = generateBreadcrumbSchema([
  { name: "Home", url: "https://www.usagentleads.com" },
  { name: "About", url: "https://www.usagentleads.com/about" },
])

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "USAgentLeads",
  url: "https://www.usagentleads.com",
  logo: "https://www.usagentleads.com/icon.png",
  description:
    "Verified real estate agent contact database covering all 50 US states. Sourced from official state licensing boards and public records.",
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@usagentleads.com",
    contactType: "customer service",
    areaServed: "US",
    availableLanguage: "English",
  },
}

export default async function AboutPage() {
  const totalCount = await getTotalCount()
  const displayCount = totalCount > 0 ? totalCount.toLocaleString() : "888,809"

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, organizationSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">About</span>
          </nav>

          {/* Hero */}
          <div className="pb-12 border-b border-border">
            <p className="label-eyebrow mb-3">About Us</p>
            <h1 className="section-heading">
              Real Estate Agent Data You Can Trust
            </h1>
            <p className="section-sub mt-3 max-w-xl">
              USAgentLeads provides verified contact data for licensed real estate agents across all 50 US states.
              We exist to make B2B outreach to real estate agents cheaper and more reliable.
            </p>
          </div>

          {/* Mission section */}
          <div className="py-16 border-b border-border">
            <div className="max-w-3xl">
              <h2 className="text-[22px] font-semibold text-ink mb-4">Why We Built This</h2>
              <div className="space-y-4 text-[15px] text-body leading-[1.8]">
                <p>
                  If you sell software, services, or products to real estate agents, you know how hard it is to
                  find accurate contact data. Most providers charge hundreds of dollars for outdated lists, require
                  expensive subscriptions, or deliver data full of duplicates and dead emails.
                </p>
                <p>
                  We built USAgentLeads to solve that problem. Our database of {displayCount}+ contacts is sourced
                  directly from official state licensing boards and public records, verified for accuracy, and
                  delivered instantly as clean, CRM-ready CSV files.
                </p>
                <p>
                  Whether you need contacts for a single state or the entire country, our one-time pricing model
                  means you pay once and own the data. No subscriptions, no per-record fees, no surprises.
                </p>
              </div>
            </div>
          </div>

          {/* Data sourcing section */}
          <div className="py-16 border-b border-border">
            <div className="max-w-3xl">
              <h2 className="text-[22px] font-semibold text-ink mb-4">How Our Data Is Sourced</h2>
              <div className="space-y-4 text-[15px] text-body leading-[1.8]">
                <p>
                  Every contact in our database originates from publicly available sources. We aggregate data from
                  state-level real estate licensing boards, commissions, and regulatory bodies across all 50 states.
                  These are the same records that any member of the public can request.
                </p>
                <p>
                  Our data pipeline cleans, deduplicates, and standardizes this raw data into a consistent format:
                  full name, email address, phone number, and state. We run regular verification passes to maintain
                  deliverability rates above 90%.
                </p>
              </div>
            </div>
          </div>

          {/* Values grid */}
          <div className="py-16 border-b border-border">
            <h2 className="text-[22px] font-semibold text-ink mb-8">How We Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value) => (
                <div key={value.title} className="card p-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-light border border-accent-mid flex items-center justify-center mb-4">
                    <value.icon size={20} className="text-accent" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-ink mb-2">{value.title}</h3>
                  <p className="text-[14px] text-body leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Who we serve */}
          <div className="py-16 border-b border-border">
            <div className="max-w-3xl">
              <h2 className="text-[22px] font-semibold text-ink mb-4">Who Uses USAgentLeads</h2>
              <div className="space-y-4 text-[15px] text-body leading-[1.8]">
                <p>
                  Our customers include marketing agencies running campaigns for real estate clients,
                  SaaS and PropTech companies selling tools to agents, mortgage lenders and title companies
                  building referral networks, real estate coaches growing their client base, and lead
                  generation companies serving the real estate vertical.
                </p>
                <p>
                  Whether you need 500 contacts in a single state or the full national database,
                  USAgentLeads gives you the data to start outreach the same day.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="py-16">
            <div className="card p-8 sm:p-10 text-center max-w-2xl mx-auto">
              <h2 className="text-[22px] font-semibold text-ink mb-3">
                Ready to Get Started?
              </h2>
              <p className="text-[15px] text-body mb-6 max-w-lg mx-auto">
                Browse our state-by-state data or get the full {displayCount}+ contact database for a one-time price.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/states" className="btn-primary text-[15px] px-6 py-3">
                  Browse by State
                </Link>
                <Link href="/pricing" className="btn-outline text-[15px] px-6 py-3">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
