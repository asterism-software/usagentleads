import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, ShieldCheck, Lock, Search as SearchIcon } from "lucide-react"
import { US_STATES, getStateBySlug, formatAgentCount } from "@/lib/utils/states"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/utils/seo"
import { DATA_LAST_REFRESHED } from "@/lib/utils/site"
import { createServiceClient } from "@/lib/supabase/server"
import { searchDirectory } from "@/lib/queries/directory"
import { DirectoryExplorer } from "@/components/directory/DirectoryExplorer"
import { FreeSampleDialog } from "@/components/home/FreeSampleDialog"

export const revalidate = 86400

interface Props {
  params: Promise<{ state: string }>
}

export async function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params
  const state = getStateBySlug(slug)
  if (!state) return {}
  const title = `${state.name} Real Estate Agent Directory — Search Licensed Realtors`
  const description = `Search the ${state.name} real estate agent directory by name. Look up licensed ${state.name} realtors and see which agents have verified email addresses and phone numbers on file.`
  const canonical = `https://www.usagentleads.com/directory/${state.slug}`
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: { "en-US": canonical, "x-default": canonical },
    },
    openGraph: {
      locale: "en_US",
      title,
      description,
      url: canonical,
      images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: `${state.name} real estate agent directory` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.usagentleads.com/twitter-image"],
    },
  }
}

export default async function StateDirectoryPage({ params }: Props) {
  const { state: slug } = await params
  const state = getStateBySlug(slug)
  if (!state) notFound()

  const supabase = createServiceClient()
  const { data: stateCountRow } = await supabase
    .schema("usagentleads")
    .from("state_count")
    .select("count")
    .eq("state", state.name)
    .single()

  const agentCount: number = stateCountRow?.count ?? state.agentCount

  // Server-render the first page of masked results so the list is crawlable.
  const initialResult = await searchDirectory({ state: state.code, page: 1 })

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Agent Directory", url: "https://www.usagentleads.com/directory" },
    { name: state.name, url: `https://www.usagentleads.com/directory/${state.slug}` },
  ])

  const faqs = [
    {
      question: `How do I look up a real estate agent in ${state.name}?`,
      answer: `Use the search box above to look up any of the ${agentCount.toLocaleString()} licensed real estate agents in ${state.name} by name. The directory shows each agent's name, state, and whether a verified email and phone number are on file. Full contact details are available in the downloadable ${state.name} agent list.`,
    },
    {
      question: `Is the ${state.name} real estate agent directory free?`,
      answer: `Yes — searching and browsing the ${state.name} agent directory is completely free. Contact details (email and phone) are masked in the free directory; the complete, unmasked ${state.name} realtor list is available as a CSV download for $49.`,
    },
    {
      question: `How many real estate agents are in ${state.name}?`,
      answer: `There are approximately ${agentCount.toLocaleString()} licensed real estate agents and brokers in ${state.name} in our directory, compiled from public licensing records and professional directories. The dataset was last refreshed in ${DATA_LAST_REFRESHED}.`,
    },
    {
      question: `Where does the ${state.name} agent data come from?`,
      answer: `Records are compiled from public ${state.name} real estate licensing records and public-facing professional directories, then cleaned, deduplicated, and verified. Only masked previews are shown publicly; the full data is delivered in the paid CSV.`,
    },
  ]
  const faqSchema = generateFAQSchema(faqs)

  const otherStates = [...US_STATES]
    .filter((s) => s.code !== state.code)
    .sort((a, b) => b.agentCount - a.agentCount)
    .slice(0, 10)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, faqSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/directory" className="hover:text-ink transition-colors shrink-0">Agent Directory</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{state.name}</span>
          </nav>

          <header className="pb-8">
            <p className="label-eyebrow mb-3">{state.name} Directory</p>
            <h1 className="text-ink font-semibold tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(30px, 6vw, 52px)" }}>
              {state.name} Real Estate Agent Directory
            </h1>
            <p className="section-sub mt-4 max-w-2xl">
              Search{" "}
              <span className="font-mono font-semibold text-ink">{agentCount.toLocaleString()}</span>{" "}
              licensed real estate agents in {state.name} by name. See which agents have a verified
              email and direct phone on file — then download the complete, unmasked {state.name} list.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-[13px] text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Data current as of <span className="font-medium text-ink">{DATA_LAST_REFRESHED}</span></span>
            </div>
          </header>

          {/* The tool */}
          <DirectoryExplorer
            initialResult={initialResult}
            initialStateCode={state.code}
            lockState
            stateAgentCount={agentCount}
          />

          {/* Free-sample capture */}
          <section className="mt-8">
            <div className="card flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-light border border-accent-mid">
                  <SearchIcon size={18} className="text-accent" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">Want to see real, unmasked records?</p>
                  <p className="text-[13px] text-tertiary leading-relaxed">
                    Download a free 500-row sample CSV and check the exact fields and quality — no card required.
                  </p>
                </div>
              </div>
              <FreeSampleDialog
                source={`directory_${state.code.toLowerCase()}`}
                triggerLabel="Get Free Sample"
                triggerClassName="btn-outline shrink-0 whitespace-nowrap text-[14px] px-5 py-2.5"
              />
            </div>
          </section>

          {/* SEO copy */}
          <section className="mt-14 border-t border-border pt-12">
            <div className="max-w-3xl">
              <h2 className="text-[22px] font-semibold text-ink mb-5">
                Look Up Any Licensed Real Estate Agent in {state.name}
              </h2>
              <p className="text-[15px] text-body leading-[1.8] mb-4">
                This free {state.name} real estate agent directory lets you search{" "}
                {agentCount.toLocaleString()}+ licensed {state.name} realtors and brokers by name.
                Every record is compiled from public {state.name} licensing records and professional
                directories, then cleaned and verified. For each agent you can instantly see their
                name, state, and whether a verified email address and phone number are on file.
              </p>
              <p className="text-[15px] text-body leading-[1.8]">
                Contact details are masked in the free directory to protect the data. When you&apos;re
                ready to run outreach, download the complete{" "}
                <Link href={`/states/${state.slug}`} className="text-accent font-medium hover:underline">
                  {state.name} real estate agent email list
                </Link>{" "}
                — a CRM-ready CSV with every agent&apos;s full name, email, and phone number.
              </p>
            </div>
          </section>

          {/* Convert */}
          <section className="mt-10">
            <div className="card border-accent/30 border-2 p-6 sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Lock size={20} className="mt-1 shrink-0 text-accent" />
                  <div>
                    <h2 className="text-[18px] font-semibold text-ink">
                      Unlock the full {state.name} agent list
                    </h2>
                    <p className="text-[14px] text-body mt-1 max-w-xl">
                      Get all {agentCount.toLocaleString()} {state.name} agents with unmasked emails
                      and phone numbers in one CSV — instant download, no account needed.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-success">
                      <ShieldCheck size={14} /> 30-day money-back guarantee
                    </div>
                  </div>
                </div>
                <Link
                  href={`/states/${state.slug}`}
                  className="btn-primary shrink-0 justify-center px-6 py-3 text-[15px]"
                >
                  Get {state.name} List — $49
                </Link>
              </div>
            </div>
          </section>

          {/* Other state directories */}
          <section className="mt-14 border-t border-border pt-12 pb-20">
            <h2 className="text-[13px] font-mono uppercase tracking-wider text-tertiary mb-4">
              Browse Other State Directories
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherStates.map((s) => (
                <Link
                  key={s.code}
                  href={`/directory/${s.slug}`}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-border hover:border-accent hover:bg-accent-light transition-all duration-150 text-[14px]"
                >
                  <span className="font-mono font-semibold text-ink">{s.code}</span>
                  <span className="text-tertiary">{s.name} Agents</span>
                  <span className="font-mono text-tertiary text-[13px] ml-1">~{formatAgentCount(s.agentCount)}</span>
                </Link>
              ))}
            </div>
            <Link href="/directory" className="inline-flex items-center gap-1.5 mt-4 text-[14px] text-accent font-medium hover:underline">
              View the full agent directory <ChevronRight size={14} />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
