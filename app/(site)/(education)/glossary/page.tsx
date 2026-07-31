import type { Metadata } from "next"
import Link from "next/link"
import { GLOSSARY_TERMS } from "@/lib/data/glossary"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { ChevronRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

export const metadata: Metadata = {
  title: "Real Estate Glossary 2026 — Key Terms Explained | USAgentLeads",
  description:
    "Plain-language definitions of real estate industry terms: MLS, IDX, NAR, CRM, cold email, CAN-SPAM, and more. Written for businesses that sell to real estate agents.",
  alternates: {
    canonical: `${BASE_URL}/glossary`,
    languages: { "en-US": `${BASE_URL}/glossary`, "x-default": `${BASE_URL}/glossary` },
  },
  openGraph: {
    locale: "en_US",
    title: "Real Estate Glossary | USAgentLeads",
    description: "Plain-language definitions of key real estate industry terms.",
    url: `${BASE_URL}/glossary`,
    type: "website",
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
}

export default function GlossaryIndex() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Glossary", url: `${BASE_URL}/glossary` },
  ])

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Estate Glossary — Key Terms Explained",
    itemListElement: GLOSSARY_TERMS.map((term, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: term.term,
      url: `${BASE_URL}/glossary/${term.slug}`,
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
            <span className="text-ink font-medium">Glossary</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">Glossary</p>
            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.9] mb-5"
              style={{ fontSize: "clamp(32px, 8vw, 64px)" }}
            >
              Real Estate Terms, Explained
            </h1>
            <p className="text-[15px] sm:text-[17px] text-tertiary mb-12">
              Straightforward definitions for the terms you&apos;ll run into when working with real estate agent data. Written for people who sell to agents, not for agents themselves.
            </p>

            <div className="space-y-3">
              {GLOSSARY_TERMS.map((term) => (
                <Link
                  key={term.slug}
                  href={`/glossary/${term.slug}`}
                  className="card-interactive p-5 flex items-start justify-between gap-4 group"
                >
                  <div>
                    <h2 className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                      {term.term}
                    </h2>
                    <p className="text-[14px] text-tertiary mt-1 line-clamp-2">
                      {term.definition}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted shrink-0 mt-1 group-hover:text-accent transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
