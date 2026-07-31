import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getAllPosts, getAllCategories } from "@/lib/blog"
import { BlogCard } from "@/components/blog/BlogCard"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"

interface Props {
  params: Promise<{ category: string }>
}

const CATEGORY_MAP: Record<string, { name: string; intro: string }> = {
  "email-marketing": {
    name: "Email Marketing",
    intro:
      "Email remains the highest-ROI channel for reaching real estate agents. Learn how to craft cold outreach sequences that get replies, maintain sender reputation, segment your lists for better engagement, and stay compliant with CAN-SPAM and state-level regulations.",
  },
  "lead-generation": {
    name: "Lead Generation",
    intro:
      "Building a pipeline of real estate agent contacts takes the right data and the right strategy. These guides cover sourcing verified agent lists, qualifying leads, building outbound funnels, and converting cold contacts into paying customers.",
  },
  "marketing": {
    name: "Marketing",
    intro:
      "From multi-channel campaigns to brand positioning, these articles cover the strategies that B2B companies use to reach and win over real estate professionals. Topics include content marketing, paid acquisition, event marketing, and partnership development.",
  },
  "technology": {
    name: "Technology",
    intro:
      "CRM integrations, API usage, data automation, and the tools that help you work with real estate agent data more efficiently. Practical guides for importing contacts into HubSpot, Salesforce, and other platforms.",
  },
  "market-data": {
    name: "Market Data",
    intro:
      "Data-driven insights into the US real estate market: agent counts by state, licensing trends, market sizing, and the metrics that matter for companies selling to real estate professionals.",
  },
}

function getCategory(slug: string): { name: string; intro: string } | undefined {
  return CATEGORY_MAP[slug]
}

function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-")
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((cat) => ({ category: categoryToSlug(cat) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}

  return {
    title: `${category.name} for Real Estate | Blog`,
    description: `Articles about ${category.name.toLowerCase()} for real estate professionals and companies targeting agents. Tips, strategies, and guides from USAgentLeads.`,
    alternates: {
      canonical: `https://www.usagentleads.com/blog/category/${slug}`,
    },
    openGraph: {
      locale: "en_US",
      title: `${category.name} for Real Estate | Blog | USAgentLeads`,
      description: `Articles about ${category.name.toLowerCase()} for real estate professionals and companies targeting agents.`,
      url: `https://www.usagentleads.com/blog/category/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} for Real Estate | Blog | USAgentLeads`,
      description: `Articles about ${category.name.toLowerCase()} for real estate professionals and companies targeting agents.`,
      images: ["https://www.usagentleads.com/twitter-image"],
    },
    robots: { index: false, follow: true },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const allPosts = getAllPosts()
  const posts = allPosts.filter((p) => categoryToSlug(p.category) === slug)

  if (posts.length === 0) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Blog", url: "https://www.usagentleads.com/blog" },
    { name: category.name, url: `https://www.usagentleads.com/blog/category/${slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">{category.name}</span>
          </nav>

          {/* Header */}
          <div className="pb-12 border-b border-border">
            <p className="label-eyebrow mb-3">{category.name}</p>
            <h1 className="section-heading">{category.name} for Real Estate</h1>
            <p className="text-[15px] text-body leading-[1.8] mt-4 max-w-2xl">
              {category.intro}
            </p>
          </div>

          {/* Posts grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
