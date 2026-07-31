import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PERSONAS, getPersonaBySlug } from "@/lib/data/personas"
import { AnswerBox } from "@/components/seo/AnswerBox"
import { TOTAL_AGENTS } from "@/lib/utils/states"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"

function trimDescription(text: string, limit = 155): string {
  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)) + "…"
}
import { getPostBySlug } from "@/lib/blog"
import { ChevronRight, Check, AlertCircle, ArrowRight } from "lucide-react"

const BASE_URL = "https://www.usagentleads.com"

interface Props {
  params: Promise<{ persona: string }>
}

export function generateStaticParams() {
  return PERSONAS.map((p) => ({ persona: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { persona: slug } = await params
  const persona = getPersonaBySlug(slug)
  if (!persona) return {}

  return {
    title: `${persona.title} 2026 | ${TOTAL_AGENTS.toLocaleString()}+ Contacts`,
    description: trimDescription(persona.description),
    alternates: {
      canonical: `${BASE_URL}/for/${slug}`,
      languages: { "en-US": `${BASE_URL}/for/${slug}`, "x-default": `${BASE_URL}/for/${slug}` },
    },
    openGraph: {
      locale: "en_US",
      title: `${persona.title} | USAgentLeads`,
      description: trimDescription(persona.description),
      url: `${BASE_URL}/for/${slug}`,
      type: "website",
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: persona.title,
      description: trimDescription(persona.description),
    },
  }
}

export default async function PersonaPage({ params }: Props) {
  const { persona: slug } = await params
  const persona = getPersonaBySlug(slug)
  if (!persona) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Use Cases", url: `${BASE_URL}/for` },
    { name: persona.name, url: `${BASE_URL}/for/${slug}` },
  ])
  const faqSchema = generateFAQSchema(persona.faqs)

  const otherPersonas = PERSONAS.filter((p) => p.slug !== slug).slice(0, 3)

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
            <Link href="/for" className="hover:text-ink transition-colors shrink-0">Use Cases</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{persona.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start pb-20">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <p className="label-eyebrow mb-4">Use Case</p>

              <h1
                className="font-semibold text-ink tracking-[-0.04em] leading-[0.95] mb-5"
                style={{ fontSize: "clamp(28px, 7vw, 56px)" }}
              >
                {persona.headline}
              </h1>

              <p className="text-[15px] sm:text-[17px] text-tertiary mb-4">
                <span className="font-mono text-ink font-semibold">{TOTAL_AGENTS.toLocaleString()}+</span>{" "}
                verified agent contacts across all 50 states
              </p>

              <p className="text-[15px] text-body leading-[1.8] mb-10">
                {persona.description}
              </p>

              <AnswerBox>
                {persona.name} can buy a verified list of {TOTAL_AGENTS.toLocaleString()}+ licensed US real estate agents — name, email, phone, and state — from USAgentLeads for $49 per state or $199 one-time for all 50 states. The data is delivered instantly as a CSV that imports into any CRM or email tool, with no subscription and a 30-day money-back guarantee.
              </AnswerBox>

              {/* Mobile CTA */}
              <div className="lg:hidden mb-10">
                <CTACard cta={persona.cta} />
              </div>

              {/* Pain points */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-4">
                  Problems You&apos;re Probably Running Into
                </h2>
                <div className="space-y-3">
                  {persona.painPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-[15px] text-body">
                      <AlertCircle size={16} className="text-muted shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Use cases */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-4">
                  How {persona.name} Use Our Data
                </h2>
                <div className="space-y-3">
                  {persona.useCases.map((uc) => (
                    <div key={uc} className="flex items-start gap-3 text-[15px] text-body">
                      <Check size={16} className="text-success shrink-0 mt-0.5" />
                      <span>{uc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* What you get */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-3">
                  What&apos;s in the Database
                </h2>
                <p className="text-[15px] text-body mb-4">
                  Every record includes verified contact information sourced from state licensing authorities:
                </p>
                <ul className="space-y-2.5 text-[15px] text-body">
                  {["Full Name — the agent's registered legal name",
                    "Email Address — verified professional email",
                    "Phone Number — direct phone when available",
                    "State — all 50 US states covered",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check size={15} className="text-success shrink-0 mt-0.5" />
                      <span><strong>{item.split(" — ")[0]}</strong> — {item.split(" — ")[1]}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* FAQ */}
              <section className="mb-10">
                <h2 className="text-[17px] font-semibold text-ink mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {persona.faqs.map((faq) => (
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

              {/* Related guides */}
              <section className="mb-10">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Related Guides
                </h2>
                <div className="space-y-2">
                  {persona.relatedBlogSlugs.map((slug) => {
                    const post = getPostBySlug(slug)
                    if (!post) return null
                    return (
                      <Link
                        key={slug}
                        href={`/blog/${slug}`}
                        className="flex items-center gap-2 text-[14px] text-accent font-medium hover:underline"
                      >
                        {post.meta.title}
                        <ChevronRight size={14} />
                      </Link>
                    )
                  })}
                </div>
              </section>

              {/* Other use cases */}
              <section>
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
                  Other Use Cases
                </h2>
                <div className="flex flex-wrap gap-2">
                  {otherPersonas.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/for/${p.slug}`}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                                 hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                    >
                      <span className="text-ink font-medium">{p.name}</span>
                    </Link>
                  ))}
                  <Link
                    href="/for"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border
                               hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px] text-accent font-medium"
                  >
                    View All
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </section>
            </div>

            {/* Sticky CTA (desktop) */}
            <div className="hidden lg:block w-75 shrink-0 sticky top-24">
              <CTACard cta={persona.cta} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CTACard({ cta }: { cta: string }) {
  return (
    <div className="card p-5 sm:p-7 border-accent/30 border-2 shadow-lg">
      <p className="label-eyebrow mb-1">Agent Database</p>
      <p className="text-[13px] font-mono text-tertiary mb-5">One-time purchase</p>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-mono text-[18px] font-medium text-muted line-through decoration-muted/60 decoration-2">$99</span>
            <span className="font-mono text-[36px] font-semibold text-ink leading-none">$49</span>
            <span className="text-tertiary text-[15px]">per state</span>
          </div>
          <p className="text-[13px] text-tertiary">Pick the states you need</p>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-mono text-[18px] font-medium text-muted line-through decoration-muted/60 decoration-2">$399</span>
            <span className="font-mono text-[36px] font-semibold text-ink leading-none">$199</span>
            <span className="text-tertiary text-[15px]">all 50 states</span>
          </div>
          <p className="text-[13px] text-tertiary">
            <span className="font-mono font-semibold text-accent">{TOTAL_AGENTS.toLocaleString()}</span> contacts
          </p>
        </div>
      </div>

      <Link
        href="/states"
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {cta}
        <ArrowRight size={16} />
      </Link>

      <p className="text-center mt-4 text-[13px] text-tertiary">
        Instant CSV delivery &middot; No subscription
      </p>
    </div>
  )
}
