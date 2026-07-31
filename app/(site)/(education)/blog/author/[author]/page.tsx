import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getAllPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blog/BlogCard"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"

interface Props {
  params: Promise<{ author: string }>
}

const AUTHORS: Record<string, { name: string; bio: string }> = {
  "usagentleads-team": {
    name: "USAgentLeads Team",
    bio: "The USAgentLeads editorial team covers B2B marketing strategies, lead generation tactics, and data-driven outreach for companies selling to real estate professionals. Our guides are informed by real-world campaign data and conversations with marketers, agencies, and SaaS founders in the real estate space.",
  },
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-")
}

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((author) => ({ author }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author: slug } = await params
  const author = AUTHORS[slug]
  if (!author) return {}

  return {
    title: `Articles by ${author.name} | Blog`,
    description: `Read all blog posts by ${author.name} on real estate marketing, lead generation, and B2B outreach strategies.`,
    alternates: {
      canonical: `https://www.usagentleads.com/blog/author/${slug}`,
    },
    openGraph: {
      locale: "en_US",
      title: `Articles by ${author.name} | USAgentLeads Blog`,
      description: `Read all blog posts by ${author.name} on real estate marketing, lead generation, and B2B outreach strategies.`,
      url: `https://www.usagentleads.com/blog/author/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Articles by ${author.name} | USAgentLeads Blog`,
      description: `Read all blog posts by ${author.name}.`,
      images: ["https://www.usagentleads.com/twitter-image"],
    },
    robots: { index: false, follow: true },
  }
}

export default async function AuthorPage({ params }: Props) {
  const { author: slug } = await params
  const author = AUTHORS[slug]
  if (!author) notFound()

  const allPosts = getAllPosts()
  const posts = allPosts.filter((p) => nameToSlug(p.author) === slug)

  if (posts.length === 0) notFound()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Blog", url: "https://www.usagentleads.com/blog" },
    { name: author.name, url: `https://www.usagentleads.com/blog/author/${slug}` },
  ])

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `https://www.usagentleads.com/blog/author/${slug}`,
    worksFor: {
      "@type": "Organization",
      name: "USAgentLeads",
      url: "https://www.usagentleads.com",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, personSchema]) }}
      />
      <div className="bg-page min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} className="text-muted" />
            <Link href="/blog" className="hover:text-ink transition-colors">Blog</Link>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-ink font-medium">{author.name}</span>
          </nav>

          {/* Author header */}
          <div className="pb-12 border-b border-border">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-[24px] font-mono font-semibold text-white shrink-0">
                {author.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="label-eyebrow mb-1">Author</p>
                <h1 className="section-heading">{author.name}</h1>
              </div>
            </div>
            <p className="text-[15px] text-body leading-[1.8] mt-6 max-w-2xl">
              {author.bio}
            </p>
            <p className="text-[14px] text-tertiary mt-3">
              {posts.length} article{posts.length !== 1 ? "s" : ""} published
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
