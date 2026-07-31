import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { COMPETITORS, getCompetitorBySlug } from "@/lib/data/comparisons"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { ChevronRight, Check, X, ArrowRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }))
}

function trimDescription(text: string, limit = 155): string {
  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…"
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const comp = getCompetitorBySlug(slug)
  if (!comp) return {}

  const desc = trimDescription(comp.description)
  return {
    title: `${comp.title} 2026`,
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/compare/${slug}`,
      languages: { "en-US": `${BASE_URL}/compare/${slug}`, "x-default": `${BASE_URL}/compare/${slug}` },
    },
    openGraph: {
      locale: "en_US",
      title: `${comp.title} 2026`,
      description: desc,
      url: `${BASE_URL}/compare/${slug}`,
      type: "website",
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${comp.title} 2026`,
      description: desc,
    },
  }
}

function renderCell(val: boolean | string) {
  if (val === true) return <Check size={16} className="text-success mx-auto" />
  if (val === false) return <X size={16} className="text-muted mx-auto" />
  return <span className="font-mono text-[14px] text-ink">{val}</span>
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params
  const comp = getCompetitorBySlug(slug)
  if (!comp) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Compare", url: `${BASE_URL}/compare` },
    { name: `${comp.name} vs USAgentLeads`, url: `${BASE_URL}/compare/${slug}` },
  ])
  const faqSchema = generateFAQSchema(comp.faqs)

  const otherComparisons = COMPETITORS.filter((c) => c.slug !== slug).slice(0, 3)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/compare" className="hover:text-ink transition-colors shrink-0">Compare</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{comp.name} vs USAgentLeads</span>
          </nav>

          <div className="max-w-4xl pb-20">
            <p className="label-eyebrow mb-4">Comparison</p>

            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.95] mb-5"
              style={{ fontSize: "clamp(28px, 7vw, 52px)" }}
            >
              {comp.headline}
            </h1>

            <p className="text-[15px] sm:text-[17px] text-tertiary mb-10">
              {comp.description}
            </p>

            <AnswerBox label="The Bottom Line">{comp.verdict}</AnswerBox>

            {/* Feature comparison table */}
            <div className="card overflow-hidden overflow-x-auto mb-10">
              <table className="data-table min-w-125">
                <thead>
                  <tr>
                    <th scope="col" className="text-left">Feature</th>
                    <th scope="col" className="text-center bg-accent-light/50">
                      <span className="text-accent">USAgentLeads</span>
                    </th>
                    <th scope="col" className="text-center">{comp.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.features.map((row) => (
                    <tr key={row.feature}>
                      <td className="text-[14px] text-ink font-medium">{row.feature}</td>
                      <td className="text-center bg-accent-light/30">{renderCell(row.us)}</td>
                      <td className="text-center">{renderCell(row.them)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Advantages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
              <div className="card p-5">
                <h2 className="text-[15px] font-semibold text-accent mb-3">
                  Why USAgentLeads
                </h2>
                <div className="space-y-2.5">
                  {comp.ourAdvantages.map((adv) => (
                    <div key={adv} className="flex items-start gap-2.5 text-[14px] text-body">
                      <Check size={14} className="text-success shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h2 className="text-[15px] font-semibold text-ink mb-3">
                  Why {comp.name}
                </h2>
                <div className="space-y-2.5">
                  {comp.theirAdvantages.map((adv) => (
                    <div key={adv} className="flex items-start gap-2.5 text-[14px] text-body">
                      <Check size={14} className="text-muted shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="card p-5 sm:p-7 border-accent/30 border-2 mb-10 text-center">
              <p className="text-[15px] text-body mb-4">
                1,100,000+ verified agent contacts. $49/state or $199 for all 50. One-time purchase.
              </p>
              <Link href="/states" className="btn-primary inline-flex items-center gap-2">
                Browse State Data
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* FAQ */}
            <section className="mb-10">
              <h2 className="text-[17px] font-semibold text-ink mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {comp.faqs.map((faq) => (
                  <details key={faq.question} className="group card p-5">
                    <summary className="cursor-pointer text-[15px] font-semibold text-ink list-none flex items-center justify-between gap-3">
                      {faq.question}
                      <ChevronRight size={16} className="text-muted shrink-0 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-[14px] text-body leading-[1.8] mt-3 pt-3 border-t border-border">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* Other comparisons */}
            <section>
              <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                Other Comparisons
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherComparisons.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/compare/${c.slug}`}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                               hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                  >
                    <span className="text-ink font-medium">{c.name} vs USAgentLeads</span>
                  </Link>
                ))}
                <Link
                  href="/compare"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                             hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px] text-accent font-medium"
                >
                  View All
                  <ChevronRight size={14} />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
