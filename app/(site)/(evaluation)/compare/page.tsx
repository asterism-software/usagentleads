import type { Metadata } from "next"
import Link from "next/link"
import { COMPETITORS } from "@/lib/data/comparisons"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { ChevronRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

export const metadata: Metadata = {
  title: "USAgentLeads vs Competitors 2026 — Agent Database Comparisons",
  description:
    "2026 comparison: see how USAgentLeads compares to REDX, ZoomInfo, Apollo, CoStar, and other real estate data providers. Feature-by-feature with honest pros and cons.",
  alternates: {
    canonical: `${BASE_URL}/compare`,
    languages: { "en-US": `${BASE_URL}/compare`, "x-default": `${BASE_URL}/compare` },
  },
  openGraph: {
    locale: "en_US",
    title: "USAgentLeads vs Competitors 2026 — Agent Database Comparisons",
    description: "Feature-by-feature comparisons with honest pros and cons.",
    url: `${BASE_URL}/compare`,
    type: "website",
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
}

export default function CompareIndex() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Compare", url: `${BASE_URL}/compare` },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "USAgentLeads vs Competitors — Real Estate Data Comparisons",
    itemListElement: COMPETITORS.map((comp, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${comp.name} vs USAgentLeads`,
      url: `${BASE_URL}/compare/${comp.slug}`,
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
            <span className="text-ink font-medium">Compare</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">Compare</p>
            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
              style={{ fontSize: "clamp(32px, 8vw, 64px)" }}
            >
              How We Compare
            </h1>
            <p className="text-[15px] sm:text-[17px] text-tertiary mb-8">
              Honest, side-by-side comparisons of USAgentLeads and other real estate data providers. We list their strengths too — pick the tool that actually fits your needs.
            </p>

            <div className="card p-5 sm:p-6 bg-subtle border-border mb-12">
              <h2 className="text-[15px] font-semibold text-ink mb-3">How We Compare</h2>
              <p className="text-[14px] text-body leading-[1.8]">
                Each comparison covers the same criteria: data coverage, price, delivery format, freshness, and what type of buyer each product is best suited for. We pull from public pricing pages and our own product experience — no affiliate relationships influence the results.
              </p>
            </div>

            <div className="space-y-4">
              {COMPETITORS.map((comp) => (
                <Link
                  key={comp.slug}
                  href={`/compare/${comp.slug}`}
                  className="card-interactive p-6 flex items-center justify-between gap-4 group"
                >
                  <div>
                    <h2 className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                      {comp.name} vs USAgentLeads
                    </h2>
                    <p className="text-[14px] text-tertiary mt-1 line-clamp-1">
                      {comp.description.slice(0, 100)}...
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted shrink-0 group-hover:text-accent transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
