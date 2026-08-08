import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  ShieldCheck,
  Users,
} from "lucide-react"
import { BrokerageRecruitingRoiCalculator } from "@/components/tools/BrokerageRecruitingRoiCalculator"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { SITE_URL } from "@/lib/utils/site"

const canonical = `${SITE_URL}/tools/brokerage-recruiting-roi-calculator`

export const metadata: Metadata = {
  title: { absolute: "Brokerage Recruiting ROI Calculator — Free Company Dollar Model" },
  description:
    "Estimate retained recruits, annual company dollar, recruiting cost per retained recruit, net contribution, ROI, and payback using your own brokerage assumptions.",
  keywords: [
    "brokerage recruiting ROI calculator",
    "real estate agent recruiting calculator",
    "brokerage company dollar calculator",
    "agent retention ROI calculator",
    "recruiting cost per agent calculator",
  ],
  alternates: {
    canonical,
    languages: { "en-US": canonical, "x-default": canonical },
  },
  openGraph: {
    locale: "en_US",
    title: "Brokerage Recruiting ROI Calculator — Free Company Dollar Model",
    description:
      "Model retained recruits, annual company dollar, recruiting cost, ROI, and payback with your own assumptions.",
    url: canonical,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brokerage Recruiting ROI Calculator | USAgentLeads",
    description: "A free browser-based model for real estate brokerage recruiting economics.",
    images: [`${SITE_URL}/opengraph-image.png`],
  },
  robots: { index: true, follow: true },
}

const faqs = [
  {
    question: "What does the Brokerage Recruiting ROI Calculator estimate?",
    answer:
      "Using only the values you enter, it estimates the retained portion of a recruited cohort, gross commission income per recruit, annual company dollar, cost per retained recruit, net contribution, ROI, and payback period.",
  },
  {
    question: "How is annual company dollar calculated?",
    answer:
      "The model multiplies retained recruits by annual sales volume per recruit, gross commission rate, and the brokerage share of gross commission. It treats the result as an annual planning estimate for the cohort that remains through the modeled year.",
  },
  {
    question: "How does the calculator use retention?",
    answer:
      "Your 12-month retention rate determines the modeled count of recruits that remain in the cohort. The calculator applies company dollar only to that retained count; it does not attempt to model the timing of departures or partial-year production.",
  },
  {
    question: "Does this calculator guarantee recruiting or financial results?",
    answer:
      "No. It is an educational planning tool, not a forecast or guarantee. Production, commission structures, agent splits, retention, recruiting cost, and timing vary by brokerage and agent. Review your assumptions with the appropriate finance, legal, and brokerage leaders.",
  },
]

export default function BrokerageRecruitingRoiCalculatorPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    { name: "Brokerage Recruiting ROI Calculator", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Brokerage Recruiting ROI Calculator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: canonical,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A free browser-based planning calculator for modeling real estate brokerage recruiting economics from visitor-entered assumptions.",
    featureList: [
      "Retained-recruit cohort model",
      "Annual company-dollar calculation",
      "Cost per retained recruit, net contribution, ROI, and payback",
      "No performance benchmarks or financial guarantees",
    ],
    publisher: {
      "@type": "Organization",
      name: "USAgentLeads",
      url: SITE_URL,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, toolSchema, faqSchema]) }}
      />
      <div className="min-h-screen bg-page">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 pb-6 pt-10 text-[14px] text-tertiary" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-ink">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <Link href="/tools" className="transition-colors hover:text-ink">Free Tools</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium text-ink">Recruiting ROI Calculator</span>
          </nav>

          <header className="border-b border-border pb-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div className="max-w-3xl">
                <p className="label-eyebrow mb-3">Free tool</p>
                <h1 className="section-heading">Brokerage Recruiting ROI Calculator</h1>
                <p className="section-sub mt-4">
                  Turn your own recruiting, production, split, retention, and cost assumptions into a transparent company-dollar and payback model.
                </p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                {[
                  { icon: Users, label: "Cohort" },
                  { icon: CircleDollarSign, label: "Company $" },
                  { icon: BarChart3, label: "Payback" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="border-r border-border px-2 py-4 text-center last:border-r-0">
                      <Icon className="mx-auto text-accent" size={18} />
                      <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.08em] text-muted">{item.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </header>

          <section id="calculator" className="scroll-mt-24 py-10" aria-label="Brokerage recruiting ROI calculator">
            <BrokerageRecruitingRoiCalculator />
          </section>

          <section className="border-t border-border py-16" aria-labelledby="how-it-works-heading">
            <div className="max-w-3xl">
              <p className="label-eyebrow mb-3">How it works</p>
              <h2 id="how-it-works-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                Make your recruiting assumptions visible before you set a target
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-body">
                Start with the agents you expect to recruit, then enter the annual volume, gross commission rate, company share, and retention rate you consider realistic for the modeled year. Add the full recruiting cost to see cost per retained recruit, net contribution, ROI, and a simple payback estimate.
              </p>
              <p className="mt-4 text-[15px] leading-[1.8] text-body">
                Need to turn a recruiting target into a market, list-size, and outreach-workload plan? Try the{" "}
                <Link href="/tools/agent-outreach-campaign-planner" className="font-medium text-accent hover:underline">
                  Agent Outreach Campaign Planner
                </Link>.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Building2,
                    title: "Company-dollar view",
                    body: "Model gross commission income and the brokerage share separately so the calculation remains clear.",
                  },
                  {
                    icon: Users,
                    title: "Retained cohort",
                    body: "Apply your own 12-month retention assumption before valuing the recruited group.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "No hidden benchmarks",
                    body: "The tool supplies no recruiting, production, or retention benchmarks and makes no result promise.",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="card p-5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-mid bg-accent-light text-accent">
                        <Icon size={18} />
                      </span>
                      <h3 className="mt-4 text-[14px] font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">{item.body}</p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-7 rounded-xl border border-border bg-subtle/60 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-accent" size={18} />
                  <p className="text-[13px] leading-relaxed text-tertiary">
                    This calculator is educational and planning-only. It does not guarantee agent production, retention, company dollar, recruiting results, or financial return. It excludes departure timing, partial-year production, operating costs, taxes, fees, and other costs unless you account for them in your inputs. Confirm figures with your finance, legal, and brokerage leadership.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-border pb-20 pt-16" id="faq" aria-labelledby="faq-heading">
            <div className="max-w-3xl">
              <p className="label-eyebrow mb-3">FAQs</p>
              <h2 id="faq-heading" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                Before you model brokerage recruiting economics
              </h2>
              <div className="mt-7 space-y-3">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group card p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-ink">
                      {faq.question}
                      <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 border-t border-border pt-3 text-[14px] leading-[1.75] text-body">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
