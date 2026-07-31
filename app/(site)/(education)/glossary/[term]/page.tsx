import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { GLOSSARY_TERMS, getTermBySlug } from "@/lib/data/glossary"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { getPostBySlug } from "@/lib/blog"
import { ChevronRight, ArrowRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

interface Props {
  params: Promise<{ term: string }>
}

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ term: t.slug }))
}

function trimDescription(text: string, limit = 155): string {
  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…"
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term: slug } = await params
  const term = getTermBySlug(slug)
  if (!term) return {}

  const desc = trimDescription(term.definition)
  return {
    title: { absolute: `${term.title} | USAgentLeads Glossary` },
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/glossary/${slug}`,
      languages: { "en-US": `${BASE_URL}/glossary/${slug}`, "x-default": `${BASE_URL}/glossary/${slug}` },
    },
    openGraph: {
      locale: "en_US",
      title: term.title,
      description: desc,
      url: `${BASE_URL}/glossary/${slug}`,
      type: "article",
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: term.title,
      description: desc,
    },
  }
}

export default async function GlossaryTermPage({ params }: Props) {
  const { term: slug } = await params
  const term = getTermBySlug(slug)
  if (!term) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Glossary", url: `${BASE_URL}/glossary` },
    { name: term.term, url: `${BASE_URL}/glossary/${slug}` },
  ])

  const definitionSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    url: `${BASE_URL}/glossary/${slug}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "USAgentLeads Real Estate Glossary",
      url: `${BASE_URL}/glossary`,
    },
  }

  const relatedTerms = term.relatedTerms
    .map((slug) => getTermBySlug(slug))
    .filter(Boolean) as typeof GLOSSARY_TERMS[number][]

  // Parse body into paragraphs, handling markdown-style formatting
  const bodyParagraphs = term.body.split("\n\n")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, definitionSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/glossary" className="hover:text-ink transition-colors shrink-0">Glossary</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{term.term}</span>
          </nav>

          <div className="max-w-3xl pb-20">
            <p className="label-eyebrow mb-4">Glossary</p>

            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.95] mb-6"
              style={{ fontSize: "clamp(28px, 7vw, 48px)" }}
            >
              {term.title}
            </h1>

            {/* Definition box */}
            <div className="card p-5 sm:p-7 bg-accent-light/30 border-accent/20 mb-8">
              <p className="text-[15px] sm:text-[17px] text-ink leading-[1.8] font-medium">
                {term.definition}
              </p>
            </div>

            {/* Body content */}
            <div className="prose-custom mb-10">
              {bodyParagraphs.map((para, i) => {
                // Handle code blocks
                if (para.startsWith("```")) {
                  const code = para.replace(/```\w*\n?/, "").replace(/```$/, "")
                  return (
                    <pre key={i} className="card p-4 overflow-x-auto mb-4 text-[13px] font-mono text-body bg-subtle">
                      <code>{code}</code>
                    </pre>
                  )
                }

                // Handle markdown-style bold headings
                if (para.startsWith("**") && para.includes(":**")) {
                  const title = para.match(/^\*\*(.+?):\*\*/)?.[1] || ""
                  const rest = para.replace(/^\*\*.+?:\*\*\s*/, "")
                  return (
                    <div key={i} className="mb-4">
                      <h2 className="text-[17px] font-semibold text-ink mb-2">{title}</h2>
                      <p className="text-[15px] text-body leading-[1.8]">{rest}</p>
                    </div>
                  )
                }

                // Handle lists (lines starting with -)
                if (para.includes("\n- ")) {
                  const lines = para.split("\n")
                  const title = lines[0].startsWith("**") ? lines[0].replace(/\*\*/g, "").replace(/:$/, "") : null
                  const items = lines.filter((l) => l.startsWith("- ")).map((l) => l.replace(/^- /, ""))

                  return (
                    <div key={i} className="mb-4">
                      {title && <h2 className="text-[17px] font-semibold text-ink mb-2">{title}</h2>}
                      <ul className="space-y-1.5">
                        {items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-[15px] text-body">
                            <span className="text-muted mt-1.5 shrink-0">&#8226;</span>
                            <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                }

                // Handle table
                if (para.includes("| ")) {
                  const rows = para.split("\n").filter((r) => r.includes("|") && !r.includes("---"))
                  const headers = rows[0]?.split("|").map((c) => c.trim()).filter(Boolean)
                  const dataRows = rows.slice(1).map((r) => r.split("|").map((c) => c.trim()).filter(Boolean))

                  return (
                    <div key={i} className="card overflow-hidden overflow-x-auto mb-4">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {headers?.map((h, hi) => (
                              <th key={hi} className={hi === 0 ? "text-left" : "text-center"}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataRows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci} className={ci === 0 ? "text-[14px] text-ink font-medium" : "text-center text-[14px] text-body"}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }

                // Regular paragraph
                return (
                  <p key={i} className="text-[15px] text-body leading-[1.8] mb-4"
                    dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
                  />
                )
              })}
            </div>

            {/* CTA */}
            <div className="card p-5 sm:p-7 border-accent/30 border-2 mb-10 text-center">
              <p className="text-[15px] text-body mb-4">
                Need real estate agent contact data? 1,100,000+ verified contacts across all 50 states.
              </p>
              <Link href="/states" className="btn-primary inline-flex items-center gap-2">
                Browse Agent Data
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Related terms */}
            {relatedTerms.length > 0 && (
              <section className="mb-10">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Related Terms
                </h2>
                <div className="flex flex-wrap gap-2">
                  {relatedTerms.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/glossary/${t.slug}`}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                                 hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                    >
                      <span className="text-ink font-medium">{t.term}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related articles */}
            {term.relatedBlogSlugs && term.relatedBlogSlugs.length > 0 && (
              <section className="mb-10">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Related Articles
                </h2>
                <div className="space-y-2">
                  {term.relatedBlogSlugs.map((blogSlug) => {
                    const post = getPostBySlug(blogSlug)
                    if (!post) return null
                    return (
                      <Link
                        key={blogSlug}
                        href={`/blog/${blogSlug}`}
                        className="flex items-center gap-2 text-[14px] text-accent font-medium hover:underline"
                      >
                        {post.meta.title}
                        <ChevronRight size={14} />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Back to glossary */}
            <Link
              href="/glossary"
              className="inline-flex items-center gap-1.5 text-[14px] text-accent font-medium hover:underline"
            >
              View All Glossary Terms
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
