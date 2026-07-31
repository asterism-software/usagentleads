import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Lock, Database, ShieldCheck } from "lucide-react"
import { US_STATES, CURRENT_YEAR, TOTAL_AGENTS, formatAgentCount } from "@/lib/utils/states"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { DATA_LAST_REFRESHED } from "@/lib/utils/site"
import { createServiceClient } from "@/lib/supabase/server"
import { searchDirectory } from "@/lib/queries/directory"
import { DirectoryExplorer } from "@/components/directory/DirectoryExplorer"

export const revalidate = 3600

const canonical = "https://www.usagentleads.com/directory"

export const metadata: Metadata = {
  title: { absolute: `Real Estate Agent Directory — Search Licensed Realtors by Name & State (${CURRENT_YEAR})` },
  description:
    "Free real estate agent directory. Search licensed realtors by name and state, and see which agents have verified email addresses and phone numbers on file. Download the full list as a CSV.",
  alternates: {
    canonical,
    languages: { "en-US": canonical, "x-default": canonical },
  },
  openGraph: {
    locale: "en_US",
    title: `Real Estate Agent Directory — Search Licensed Realtors by Name & State (${CURRENT_YEAR})`,
    description: "Search licensed real estate agents by name and state. Free to browse; download the full contact list as a CSV.",
    url: canonical,
    images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: "US real estate agent directory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Real Estate Agent Directory — Search Licensed Realtors by Name & State (${CURRENT_YEAR})`,
    description: "Search licensed real estate agents by name and state — free to browse.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

const faqs = [
  {
    question: "How do I find a real estate agent by name?",
    answer: "Type at least two letters of the agent's name into the search box above, or pick a state to browse. The directory returns matching licensed real estate agents with their name, state, and whether a verified email and phone number are on file.",
  },
  {
    question: "Is the real estate agent directory free to use?",
    answer: "Yes. Searching and browsing the directory is completely free. Contact details (email and phone) are masked in the free directory; the full, unmasked list for any state is available as a CSV download for $49.",
  },
  {
    question: "How many real estate agents are in the directory?",
    answer: `The directory covers roughly ${TOTAL_AGENTS.toLocaleString()} licensed real estate agents and brokers across all 50 US states, compiled from public licensing records and professional directories and last refreshed in ${DATA_LAST_REFRESHED}.`,
  },
  {
    question: "Can I download the agent contact list?",
    answer: "Yes. Choose a state to download the complete, unmasked list of that state's real estate agents as a CRM-ready CSV — full name, email, phone, and state for every agent — for $49, or get all 50 states in the Full Database.",
  },
]

export default async function DirectoryIndexPage() {
  const supabase = createServiceClient()
  const { data: stateCounts } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("state, count")

  const countMap: Record<string, number> = {}
  if (stateCounts) {
    for (const row of stateCounts) countMap[row.state] = row.count
  }
  const totalContacts = stateCounts?.length
    ? stateCounts.reduce((sum, row) => sum + row.count, 0)
    : TOTAL_AGENTS

  // No filter selected yet → an empty result (searchDirectory returns early).
  const initialResult = await searchDirectory({})

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Agent Directory", url: canonical },
  ])
  const faqSchema = generateFAQSchema(faqs)
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Real Estate Agent Directory by State",
    numberOfItems: US_STATES.length,
    itemListElement: US_STATES.map((state, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${state.name} Real Estate Agent Directory`,
      url: `https://www.usagentleads.com/directory/${state.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, itemList, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">Agent Directory</span>
          </nav>

          <header className="pb-8">
            <p className="label-eyebrow mb-3">Free Tool</p>
            <h1 className="text-ink font-semibold tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(30px, 6vw, 52px)" }}>
              Real Estate Agent Directory
            </h1>
            <p className="section-sub mt-4 max-w-2xl">
              Search{" "}
              <span className="font-mono font-semibold text-ink">{totalContacts.toLocaleString()}</span>{" "}
              licensed real estate agents across all 50 states by name. See which agents have a
              verified email and phone on file — free to browse, no account required.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Data current as of <span className="font-medium text-ink">{DATA_LAST_REFRESHED}</span></span>
            </div>
          </header>

          {/* The tool */}
          <DirectoryExplorer initialResult={initialResult} />

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Database, label: "Public licensing records & directories" },
              { icon: Lock, label: "Contact details masked in free view" },
              { icon: ShieldCheck, label: "Full CSV from $49 · 30-day guarantee" },
            ].map((item) => (
              <div key={item.label} className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-body">
                <item.icon size={14} className="text-accent shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* State grid */}
          <section className="mt-14 border-t border-border pt-12">
            <h2 className="text-[22px] font-semibold text-ink mb-2">Browse the Agent Directory by State</h2>
            <p className="section-sub mb-6 max-w-2xl">
              Jump straight to any state to search its licensed real estate agents.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {[...US_STATES].sort((a, b) => a.name.localeCompare(b.name)).map((s) => {
                const count = countMap[s.name] ?? s.agentCount
                return (
                  <Link
                    key={s.code}
                    href={`/directory/${s.slug}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 hover:border-accent hover:bg-accent-light transition-all duration-150"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[12px] font-semibold text-accent shrink-0">{s.code}</span>
                      <span className="text-[14px] text-ink truncate">{s.name}</span>
                    </span>
                    <span className="font-mono text-[12px] text-tertiary shrink-0">{formatAgentCount(count)}</span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* SEO copy */}
          <section className="mt-14 border-t border-border pt-12">
            <div className="max-w-3xl">
              <h2 className="text-[22px] font-semibold text-ink mb-5">The Free Real Estate Agent Lookup Tool</h2>
              <p className="text-[15px] text-body leading-[1.8] mb-4">
                Use this directory to look up any licensed real estate agent in the United States by
                name or state. It draws on a database of {totalContacts.toLocaleString()}+ agents and
                brokers compiled from public state licensing records and public-facing professional
                directories. For every match you can see the agent&apos;s name, the state they&apos;re
                licensed in, and whether a verified email address and direct phone number are on file.
              </p>
              <p className="text-[15px] text-body leading-[1.8]">
                Browsing is free and contact details are masked to protect the data. When you need to
                run outreach, download the complete, unmasked{" "}
                <Link href="/states" className="text-accent font-medium hover:underline">real estate agent email list</Link>{" "}
                for any state as a CRM-ready CSV, or grab all 50 states in the{" "}
                <Link href="/pricing" className="text-accent font-medium hover:underline">Full Database</Link>.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-14 border-t border-border pt-12 pb-20">
            <h2 className="text-[22px] font-semibold text-ink mb-6">Frequently Asked Questions</h2>
            <div className="max-w-3xl space-y-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="group card p-5">
                  <summary className="cursor-pointer text-[15px] font-semibold text-ink list-none flex items-center justify-between gap-3">
                    {faq.question}
                    <ChevronRight size={16} className="text-muted shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-[14px] text-body leading-[1.8] mt-3 pt-3 border-t border-border">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
