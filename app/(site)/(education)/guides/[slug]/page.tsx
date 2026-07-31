import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IMPORT_GUIDES, getGuideBySlug } from "@/lib/data/guides"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { ChevronRight, Check, ExternalLink, ArrowRight, Lightbulb } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return IMPORT_GUIDES.map((g) => ({ slug: g.slug }))
}

function trimDescription(text: string, limit = 155): string {
  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…"
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) return {}

  const desc = trimDescription(guide.description)
  return {
    title: `${guide.title} (2026 Steps)`,
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/guides/${slug}`,
      languages: { "en-US": `${BASE_URL}/guides/${slug}`, "x-default": `${BASE_URL}/guides/${slug}` },
    },
    openGraph: {
      locale: "en_US",
      title: guide.title,
      description: desc,
      url: `${BASE_URL}/guides/${slug}`,
      type: "article",
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: desc,
    },
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Import Guides", url: `${BASE_URL}/guides` },
    { name: guide.tool, url: `${BASE_URL}/guides/${slug}` },
  ])
  const faqSchema = generateFAQSchema(guide.faqs)

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    description: trimDescription(guide.description),
    totalTime: "PT10M",
    supply: [{ "@type": "HowToSupply", name: "USAgentLeads CSV (name, email, phone, state)" }],
    tool: [{ "@type": "HowToTool", name: guide.tool }],
    step: guide.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.detail,
    })),
  }

  const otherGuides = IMPORT_GUIDES.filter((g) => g.slug !== slug).slice(0, 4)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, howToSchema, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/guides" className="hover:text-ink transition-colors shrink-0">Import Guides</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{guide.tool}</span>
          </nav>

          <div className="max-w-4xl pb-20">
            <p className="label-eyebrow mb-4">{guide.category} · Import Guide</p>

            <h1
              className="font-semibold text-ink tracking-[-0.04em] leading-[0.95] mb-5"
              style={{ fontSize: "clamp(28px, 7vw, 52px)" }}
            >
              {guide.headline}
            </h1>

            <p className="text-[15px] sm:text-[17px] text-tertiary mb-6">
              {guide.description}
            </p>

            <a
              href={guide.docsUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 text-[13px] text-tertiary hover:text-accent transition-colors mb-10"
            >
              Official {guide.tool} import documentation
              <ExternalLink size={13} />
            </a>

            <AnswerBox label="In Short">
              To import your agent list into {guide.tool}: {guide.steps.map((s, i) => `(${i + 1}) ${s.title.charAt(0).toLowerCase()}${s.title.slice(1)}`).join(", ")}. The USAgentLeads CSV&apos;s columns — name, email, phone, state — map directly; full field mappings below.
            </AnswerBox>

            {/* Prerequisites */}
            <section className="card p-5 sm:p-6 bg-subtle border-border mb-10">
              <h2 className="text-[15px] font-semibold text-ink mb-3">Before You Start</h2>
              <ul className="space-y-2.5">
                {guide.prerequisites.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-body">
                    <Check size={15} className="text-success shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Steps */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-5">Step-by-Step</h2>
              <ol className="space-y-5">
                {guide.steps.map((step, i) => (
                  <li key={step.title} className="card p-5 sm:p-6 flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-accent-light border border-accent-mid flex items-center justify-center shrink-0 font-mono text-[14px] font-semibold text-accent">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-ink mb-1.5">{step.title}</h3>
                      <p className="text-[14px] text-body leading-[1.8]">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Field mapping */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-4">Field Mapping Reference</h2>
              <div className="card overflow-hidden overflow-x-auto">
                <table className="data-table min-w-120">
                  <thead>
                    <tr>
                      <th scope="col" className="text-left">Our CSV Column</th>
                      <th scope="col" className="text-left">{guide.tool} Field</th>
                      <th scope="col" className="text-left">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.fieldMapping.map((row) => (
                      <tr key={row.ourColumn}>
                        <td className="font-mono text-[13px] text-ink">{row.ourColumn}</td>
                        <td className="text-[14px] text-ink font-medium">{row.toolField}</td>
                        <td className="text-[13px] text-tertiary">{row.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tips */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-4">Tips for Better Results</h2>
              <div className="space-y-3">
                {guide.tips.map((tip) => (
                  <div key={tip} className="flex items-start gap-3 text-[14px] text-body">
                    <Lightbulb size={15} className="text-accent shrink-0 mt-0.5" />
                    <span className="leading-[1.8]">{tip}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="card p-5 sm:p-7 border-accent/30 border-2 mb-12 text-center">
              <p className="text-[15px] text-body mb-4">
                Need the data first? 1,100,000+ verified agent contacts as a ready-to-import CSV. $49/state or $199 for all 50.
              </p>
              <Link href="/states" className="btn-primary inline-flex items-center gap-2">
                Get the Agent List
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* FAQ */}
            <section className="mb-12">
              <h2 className="text-[17px] font-semibold text-ink mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {guide.faqs.map((faq) => (
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

            {/* Other guides */}
            <section>
              <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                Other Import Guides
              </h2>
              <div className="flex flex-wrap gap-2">
                {otherGuides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/guides/${g.slug}`}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                               hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                  >
                    <span className="text-ink font-medium">{g.tool}</span>
                  </Link>
                ))}
                <Link
                  href="/guides"
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
