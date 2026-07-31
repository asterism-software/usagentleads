import type { Metadata } from "next"
import Link from "next/link"
import { ALTERNATIVES_PAGES } from "@/lib/data/alternatives"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { ChevronRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

export const metadata: Metadata = {
  title: "Alternatives to Popular Real Estate Data Tools 2026",
  description:
    "Researched alternatives to ZoomInfo, Apollo, REDX, CoStar, and Cole Realty Resource for real estate data — with verified pricing, honest pros and cons, and the best pick per use case.",
  alternates: {
    canonical: `${BASE_URL}/alternatives`,
    languages: { "en-US": `${BASE_URL}/alternatives`, "x-default": `${BASE_URL}/alternatives` },
  },
  openGraph: {
    locale: "en_US",
    title: "Alternatives to Popular Real Estate Data Tools 2026",
    description:
      "Researched alternatives to ZoomInfo, Apollo, REDX, CoStar, and more — verified pricing and honest pros and cons.",
    url: `${BASE_URL}/alternatives`,
    type: "website",
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
}

export default function AlternativesIndex() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Alternatives", url: `${BASE_URL}/alternatives` },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Alternatives to Popular Real Estate Data Tools",
    itemListElement: ALTERNATIVES_PAGES.map((page, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: page.title,
      url: `${BASE_URL}/alternatives/${page.slug}`,
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
            <span className="text-ink font-medium">Alternatives</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">Alternatives</p>
            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
              style={{ fontSize: "clamp(32px, 8vw, 64px)" }}
            >
              Find the Right Tool
            </h1>
            <p className="text-[15px] sm:text-[17px] text-tertiary mb-8">
              Looking to switch from an expensive data platform — or just checking your options? Each guide compares researched alternatives side by side, including where a competitor is genuinely the better pick.
            </p>

            <div className="card p-5 sm:p-6 bg-subtle border-border mb-12">
              <h2 className="text-[15px] font-semibold text-ink mb-3">How These Guides Are Researched</h2>
              <p className="text-[14px] text-body leading-[1.8]">
                Pricing and feature claims are checked against each vendor&apos;s public pricing page and independent third-party pricing guides. Where a vendor only sells via custom quotes, we say so and cite reported ranges instead of inventing numbers. Vendors change pricing often — always confirm current rates before buying.
              </p>
            </div>

            <div className="space-y-4">
              {ALTERNATIVES_PAGES.map((page) => (
                <Link
                  key={page.slug}
                  href={`/alternatives/${page.slug}`}
                  className="card-interactive p-6 flex items-center justify-between gap-4 group"
                >
                  <div>
                    <h2 className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                      {page.competitor} Alternatives
                    </h2>
                    <p className="text-[14px] text-tertiary mt-1 line-clamp-2">
                      {page.intro.slice(0, 140)}...
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
