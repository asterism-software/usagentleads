import type { Metadata } from "next"
import Link from "next/link"
import { PERSONAS } from "@/lib/data/personas"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { ChevronRight, Megaphone, Laptop, Landmark, GraduationCap, Building2, Users, Wrench, Shield, Camera, Truck } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

const iconMap: Record<string, typeof Megaphone> = {
  coaches: GraduationCap,
  "saas-companies": Laptop,
  "mortgage-lenders": Landmark,
  "marketing-agencies": Megaphone,
  brokerages: Building2,
  "lead-generation": Users,
  "home-services": Wrench,
  "insurance-agencies": Shield,
  photographers: Camera,
  "moving-companies": Truck,
}

export const metadata: Metadata = {
  title: "Real Estate Agent Data by Use Case 2026 | USAgentLeads",
  description:
    "Find the right 2026 real estate agent contact database for your business. Whether you're a coach, SaaS company, mortgage lender, or brokerage — see how our data fits your outreach.",
  alternates: {
    canonical: `${BASE_URL}/for`,
    languages: { "en-US": `${BASE_URL}/for`, "x-default": `${BASE_URL}/for` },
  },
  openGraph: {
    locale: "en_US",
    title: "Real Estate Agent Data by Use Case 2026 | USAgentLeads",
    description:
      "Find the right real estate agent contact database for your business. See how our data fits your outreach.",
    url: `${BASE_URL}/for`,
    type: "website",
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
}

export default function PersonasIndex() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Use Cases", url: `${BASE_URL}/for` },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Estate Agent Data by Use Case",
    itemListElement: PERSONAS.map((persona, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: persona.name,
      url: `${BASE_URL}/for/${persona.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, itemList]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">Use Cases</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">Use Cases</p>
            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
              style={{ fontSize: "clamp(32px, 8vw, 64px)" }}
            >
              Agent Data for Your Business
            </h1>
            <p className="text-[15px] sm:text-[17px] text-tertiary mb-8">
              Different businesses use our real estate agent database in different ways. Find the use case that matches what you do.
            </p>

            <div className="card p-5 sm:p-6 bg-subtle border-border mb-12">
              <h2 className="text-[15px] font-semibold text-ink mb-3">One Database, Many Use Cases</h2>
              <p className="text-[14px] text-body leading-[1.8]">
                Our database of 1,100,000+ verified real estate agent contacts covers all 50 US states with name, email, phone, and state. Whether you&apos;re running cold email campaigns, building referral networks, or enriching your CRM — the data is the same. The strategy depends on who you are and what you sell.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {PERSONAS.map((persona) => {
                const Icon = iconMap[persona.slug] ?? Users
                return (
                  <Link
                    key={persona.slug}
                    href={`/for/${persona.slug}`}
                    className="card-interactive p-6 flex gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent-light border border-accent-mid flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[16px] font-semibold text-ink mb-1 group-hover:text-accent transition-colors">
                        {persona.name}
                      </h2>
                      <p className="text-[14px] text-tertiary leading-relaxed line-clamp-2">
                        {persona.description.slice(0, 120)}...
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
