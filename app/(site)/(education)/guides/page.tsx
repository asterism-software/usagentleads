import type { Metadata } from "next"
import Link from "next/link"
import { IMPORT_GUIDES } from "@/lib/data/guides"
import { getPostBySlug } from "@/lib/blog"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { ChevronRight, FileSpreadsheet, ArrowRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

export const metadata: Metadata = {
  title: "Import Guides — Get Your Agent List into Any Tool 2026",
  description:
    "Step-by-step guides for importing your realtor email list CSV into Instantly, Smartlead, Mailchimp, GoHighLevel, HubSpot, Salesforce, and more — field mappings included.",
  alternates: {
    canonical: `${BASE_URL}/guides`,
    languages: { "en-US": `${BASE_URL}/guides`, "x-default": `${BASE_URL}/guides` },
  },
  openGraph: {
    locale: "en_US",
    title: "Import Guides — Get Your Agent List into Any Tool",
    description:
      "Step-by-step guides for importing your realtor email list CSV into any cold email tool, email marketing platform, or CRM.",
    url: `${BASE_URL}/guides`,
    type: "website",
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
}

// Existing long-form blog guides for tools not covered by the data-driven pages
const BLOG_GUIDES = [
  { slug: "import-real-estate-contacts-hubspot", tool: "HubSpot", category: "CRM" },
  { slug: "import-agent-contacts-salesforce", tool: "Salesforce", category: "CRM" },
] as const

const CATEGORY_ORDER = ["Cold Email", "Email Marketing", "CRM"] as const

export default function GuidesIndex() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Import Guides", url: `${BASE_URL}/guides` },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "USAgentLeads Import Guides",
    itemListElement: IMPORT_GUIDES.map((guide, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: guide.title,
      url: `${BASE_URL}/guides/${guide.slug}`,
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
            <span className="text-ink font-medium">Import Guides</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">Import Guides</p>
            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
              style={{ fontSize: "clamp(32px, 8vw, 64px)" }}
            >
              Get Your List into Any Tool
            </h1>
            <p className="text-[15px] sm:text-[17px] text-tertiary mb-8">
              Your download is a standard CSV with four columns — <span className="font-mono text-ink">name, email, phone, state</span> — so it imports anywhere. These guides walk through the exact steps and field mappings for the most popular tools.
            </p>

            <div className="card p-5 sm:p-6 bg-subtle border-border mb-12 flex items-start gap-4">
              <FileSpreadsheet size={20} className="text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[15px] font-semibold text-ink mb-2">One CSV, Every Platform</h2>
                <p className="text-[14px] text-body leading-[1.8]">
                  Each guide follows the vendor&apos;s official import flow (verified July 2026) and includes a field-mapping table for our exact column names, plus deliverability tips for large sends. Don&apos;t see your tool? Any platform that accepts CSV uploads will work — <Link href="/contact" className="text-accent hover:underline">ask us</Link> and we&apos;ll point you in the right direction.
                </p>
              </div>
            </div>

            {CATEGORY_ORDER.map((category) => {
              const guides = IMPORT_GUIDES.filter((g) => g.category === category)
              const blogGuides = BLOG_GUIDES.filter((g) => g.category === category)
              if (guides.length === 0 && blogGuides.length === 0) return null
              return (
                <section key={category} className="mb-10">
                  <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {guides.map((guide) => (
                      <Link
                        key={guide.slug}
                        href={`/guides/${guide.slug}`}
                        className="card-interactive p-5 group"
                      >
                        <h3 className="text-[15px] font-semibold text-ink group-hover:text-accent transition-colors mb-1">
                          {guide.tool}
                        </h3>
                        <p className="text-[13px] text-tertiary line-clamp-2">
                          {guide.description.slice(0, 110)}...
                        </p>
                      </Link>
                    ))}
                    {blogGuides.map((guide) => {
                      const post = getPostBySlug(guide.slug)
                      if (!post) return null
                      return (
                        <Link
                          key={guide.slug}
                          href={`/blog/${guide.slug}`}
                          className="card-interactive p-5 group"
                        >
                          <h3 className="text-[15px] font-semibold text-ink group-hover:text-accent transition-colors mb-1">
                            {guide.tool}
                          </h3>
                          <p className="text-[13px] text-tertiary line-clamp-2">
                            {post.meta.description}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {/* CTA */}
            <div className="card p-5 sm:p-7 border-accent/30 border-2 text-center">
              <p className="text-[15px] text-body mb-4">
                Don&apos;t have the data yet? 1,100,000+ verified agent contacts, $49/state or $199 for all 50.
              </p>
              <Link href="/states" className="btn-primary inline-flex items-center gap-2">
                Browse State Data
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
