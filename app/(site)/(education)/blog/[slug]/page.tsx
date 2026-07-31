import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { ChevronRight } from "lucide-react"
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog"
import { generateBreadcrumbSchema, generateArticleSchema, generateFAQSchema } from "@/lib/utils/seo"
import { mdxComponents } from "@/components/blog/MDXComponents"
import { BlogCover } from "@/components/blog/BlogCover"
import { ShareRow } from "@/components/blog/ShareRow"
import { BlogCard } from "@/components/blog/BlogCard"
import { BlogCTA } from "@/components/blog/BlogCTA"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const { meta } = post
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: `https://www.usagentleads.com/blog/${meta.slug}`,
      languages: {
        "en-US": `https://www.usagentleads.com/blog/${meta.slug}`,
        "x-default": `https://www.usagentleads.com/blog/${meta.slug}`,
      },
    },
    openGraph: {
      locale: "en_US",
      title: `${meta.title} | USAgentLeads`,
      description: meta.description,
      url: `https://www.usagentleads.com/blog/${meta.slug}`,
      type: "article",
      publishedTime: meta.date,
      modifiedTime: meta.updatedAt || meta.date,
      authors: [meta.author],
      tags: meta.tags,
      images: [
        {
          url: `https://www.usagentleads.com${meta.coverImage}`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [`https://www.usagentleads.com${meta.coverImage}`],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const { meta, content } = post
  const related = getRelatedPosts(slug, meta.category)

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: "https://www.usagentleads.com" },
    { name: "Blog", url: "https://www.usagentleads.com/blog" },
    { name: meta.title, url: `https://www.usagentleads.com/blog/${meta.slug}` },
  ])
  const articleSchema = generateArticleSchema(meta)
  const faqSchema = meta.faqs?.length ? generateFAQSchema(meta.faqs) : null
  const schemas = [breadcrumb, articleSchema, ...(faqSchema ? [faqSchema] : [])]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />

      <div className="bg-page min-h-screen">
        {/* Breadcrumb — full width */}
        <div className="mx-auto max-w-[720px] px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-[14px] text-tertiary pt-10 pb-6 overflow-hidden">
            <Link href="/" className="hover:text-ink transition-colors shrink-0">Home</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <Link href="/blog" className="hover:text-ink transition-colors shrink-0">Blog</Link>
            <ChevronRight size={14} className="text-muted shrink-0" />
            <span className="text-ink font-medium truncate">{meta.title}</span>
          </nav>
        </div>

        {/* Post header */}
        <div className="mx-auto max-w-[720px] px-4 sm:px-6">
          <span className="badge-info">{meta.category}</span>

          <h1
            className="text-[28px] sm:text-[36px] md:text-[40px] font-semibold text-ink
                       tracking-[-0.02em] leading-[1.15] mt-4"
          >
            {meta.title}
          </h1>

          <p className="text-[16px] sm:text-[17px] text-tertiary leading-relaxed mt-4 max-w-[600px]">
            {meta.description}
          </p>

          {/* Author & date bar */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] sm:text-[14px] font-mono text-muted border-t border-b border-border py-4 mt-6">
            <Link
              href={`/blog/author/${meta.author.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-ink transition-colors"
            >
              {meta.author}
            </Link>
            <span className="hidden sm:inline">&middot;</span>
            <time dateTime={meta.date}>
              {new Date(meta.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            {meta.updatedAt && (
              <>
                <span className="hidden sm:inline">&middot;</span>
                <time dateTime={meta.updatedAt}>
                  Updated{" "}
                  {new Date(meta.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
            <span className="hidden sm:inline">&middot;</span>
            <span>{meta.readingTime}</span>
          </div>

          {/* Cover image */}
          <div className="relative rounded-xl overflow-hidden my-8 aspect-[2/1]">
            <BlogCover
              src={meta.coverImage}
              alt={meta.title}
              category={meta.category}
              sizes="720px"
              priority
            />
          </div>

          {/* Article content */}
          <article className="prose">
            <MDXRemote
              source={content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>

          {/* Share row */}
          <ShareRow title={meta.title} slug={meta.slug} />
        </div>

        {/* Related posts — full width */}
        {related.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 mb-4">
            <p className="label-eyebrow mb-6">Related Articles</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlogCTA />
        </div>
      </div>
    </>
  )
}
