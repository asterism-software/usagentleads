import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ALTERNATIVES_PAGES, getAlternativesPageBySlug } from "@/lib/data/alternatives"
import { getCompetitorBySlug } from "@/lib/data/comparisons"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { ChevronRight, Check, X, ArrowRight, AlertCircle } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return ALTERNATIVES_PAGES.map((p) => ({ slug: p.slug }))
}

function trimDescription(text: string, limit = 155): string {
  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…"
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getAlternativesPageBySlug(slug)
  if (!page) return {}

  const desc = trimDescription(page.intro)
  return {
    title: `${page.title} 2026`,
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/alternatives/${slug}`,
      languages: { "en-US": `${BASE_URL}/alternatives/${slug}`, "x-default": `${BASE_URL}/alternatives/${slug}` },
    },
    openGraph: {
      locale: "en_US",
      title: `${page.title} 2026`,
      description: desc,
      url: `${BASE_URL}/alternatives/${slug}`,
      type: "website",
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} 2026`,
      description: desc,
    },
  }
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params
  const page = getAlternativesPageBySlug(slug)
  if (!page) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Alternatives", url: `${BASE_URL}/alternatives` },
    { name: `${page.competitor} Alternatives`, url: `${BASE_URL}/alternatives/${slug}` },
  ])
  const faqSchema = generateFAQSchema(page.faqs)

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.title,
    itemListElement: page.options.map((opt, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: opt.name,
    })),
  }

  const comparePage = page.compareSlug ? getCompetitorBySlug(page.compareSlug) : undefined
  const otherPages = ALTERNATIVES_PAGES.filter((p) => p.slug !== slug).slice(0, 4)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, itemList, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/alternatives" className="hover:text-ink transition-colors shrink-0">Alternatives</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{page.competitor} Alternatives</span>
          </nav>

          <div className="max-w-4xl pb-20">
            <p className="label-eyebrow mb-4">Alternatives</p>

            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.95] mb-5"
              style={{ fontSize: "clamp(28px, 7vw, 52px)" }}
            >
              {page.headline}
            </h1>

            <p className="text-[15px] sm:text-[17px] text-tertiary mb-10">
              {page.intro}
            </p>

            <AnswerBox>{page.answerBox}</AnswerBox>

            {/* Why people switch */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-4">
                Why People Look for {page.competitor} Alternatives
              </h2>
              <div className="space-y-4">
                {page.whySwitch.map((reason) => (
                  <div key={reason.title} className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-muted shrink-0 mt-1" />
                    <div>
                      <p className="text-[15px] font-medium text-ink">{reason.title}</p>
                      <p className="text-[14px] text-body leading-[1.8] mt-1">{reason.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Alternatives list */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-5">
                The Alternatives
              </h2>
              <div className="space-y-6">
                {page.options.map((opt, i) => (
                  <article
                    key={opt.name}
                    className={`card p-5 sm:p-7 ${opt.isUs ? "border-accent/40 border-2" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                      <h3 className="text-[17px] font-semibold text-ink">
                        {i + 1}. {opt.name}
                        {opt.isUs && (
                          <span className="ml-2 text-[12px] font-mono uppercase tracking-wider text-accent align-middle">
                            That&apos;s us
                          </span>
                        )}
                      </h3>
                      <span className="font-mono text-[13px] text-tertiary">{opt.pricing}</span>
                    </div>
                    <p className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-3">
                      Best for: <span className="text-ink normal-case font-sans font-medium">{opt.bestFor}</span>
                    </p>
                    <p className="text-[14px] text-body leading-[1.8] mb-5">{opt.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[13px] font-semibold text-success mb-2">Pros</p>
                        <ul className="space-y-1.5">
                          {opt.pros.map((pro) => (
                            <li key={pro} className="flex items-start gap-2 text-[13px] text-body">
                              <Check size={13} className="text-success shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-tertiary mb-2">Cons</p>
                        <ul className="space-y-1.5">
                          {opt.cons.map((con) => (
                            <li key={con} className="flex items-start gap-2 text-[13px] text-body">
                              <X size={13} className="text-muted shrink-0 mt-0.5" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {opt.isUs && (
                      <div className="mt-5 pt-4 border-t border-border">
                        <Link href="/states" className="inline-flex items-center gap-2 text-[14px] text-accent font-medium hover:underline">
                          Browse the agent database
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* Pricing disclaimer */}
            <p className="text-[13px] text-tertiary leading-[1.8] mb-12">
              Competitor pricing verified against vendor pricing pages and independent pricing guides as of July 2026. Quote-based products are described using reported ranges. Vendors change pricing frequently — confirm current rates on each vendor&apos;s site before purchasing.
            </p>

            {/* How to choose */}
            <section className="card p-5 sm:p-7 bg-subtle border-border mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-3">How to Choose</h2>
              <p className="text-[15px] text-body leading-[1.8]">{page.howToChoose}</p>
              {comparePage && (
                <Link
                  href={`/compare/${comparePage.slug}`}
                  className="inline-flex items-center gap-2 text-[14px] text-accent font-medium hover:underline mt-4"
                >
                  See the full {page.competitor} vs USAgentLeads comparison
                  <ArrowRight size={14} />
                </Link>
              )}
            </section>

            {/* FAQ */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {page.faqs.map((faq) => (
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

            {/* Other alternative guides */}
            <section>
              <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                Other Alternative Guides
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherPages.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/alternatives/${p.slug}`}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                               hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                  >
                    <span className="text-ink font-medium">{p.competitor} Alternatives</span>
                  </Link>
                ))}
                <Link
                  href="/alternatives"
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
