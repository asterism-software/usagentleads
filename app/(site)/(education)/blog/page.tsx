import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getAllPosts, getAllCategories } from "@/lib/blog"
import { BlogGrid } from "@/components/blog/BlogGrid"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"

export const metadata: Metadata = {
  title: "Real Estate Marketing Blog 2026 — Tips, Strategies & Insights",
  description:
    "2026 marketing strategies, email templates, and lead generation tips for real estate professionals and companies targeting the real estate industry.",
  alternates: {
    canonical: "https://www.usagentleads.com/blog",
    languages: {
      "en-US": "https://www.usagentleads.com/blog",
      "x-default": "https://www.usagentleads.com/blog",
    },
  },
  openGraph: {
    locale: "en_US",
    title: "Real Estate Marketing Blog | USAgentLeads",
    description:
      "Actionable marketing strategies, email templates, and lead generation tips for real estate professionals.",
    url: "https://www.usagentleads.com/blog",
    type: "website",
    images: [
      {
        url: "https://www.usagentleads.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "USAgentLeads Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Marketing Blog | USAgentLeads",
    description:
      "Actionable marketing strategies, email templates, and lead generation tips for real estate professionals.",
    images: ["https://www.usagentleads.com/twitter-image"],
  },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getAllCategories()

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Blog", url: "https://www.usagentleads.com/blog" },
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
          <span className="text-ink font-medium">Blog</span>
        </nav>

        {/* Page header */}
        <div className="pb-12 border-b border-border">
          <p className="label-eyebrow mb-3">Blog</p>
          <h1 className="section-heading">Real Estate Marketing Insights</h1>
          <p className="section-sub mt-3 max-w-[540px]">
            Strategies, templates, and guides to help you reach real estate
            professionals and grow your business.
          </p>
        </div>

        <BlogGrid posts={posts} categories={categories} />
      </div>
    </div>
    </>
  )
}
