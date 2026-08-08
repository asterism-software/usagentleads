import type { MetadataRoute } from "next"
import { US_STATES } from "@/lib/utils/states"
import { getAllPosts } from "@/lib/blog"
import { PERSONAS } from "@/lib/data/personas"
import { COMPETITORS } from "@/lib/data/comparisons"
import { ALTERNATIVES_PAGES } from "@/lib/data/alternatives"
import { IMPORT_GUIDES } from "@/lib/data/guides"
import { GLOSSARY_TERMS } from "@/lib/data/glossary"
import { CONTENT_LAST_REVIEWED, SITE_URL } from "@/lib/utils/site"

const BASE_URL = SITE_URL
const TOOLS_LAST_MODIFIED = "2026-08-08"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/states`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/directory`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/agent-outreach-campaign-planner`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/cold-email-compliance-checker`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/real-estate-email-subject-line-tester`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/email-domain-authentication-checker`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/brokerage-recruiting-roi-calculator`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tools/agent-partnership-value-calculator`,
      lastModified: TOOLS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/for`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/alternatives`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/glossary`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/data-sources`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: CONTENT_LAST_REVIEWED,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  const statePages: MetadataRoute.Sitemap = US_STATES.map((state) => ({
    url: `${BASE_URL}/states/${state.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  const directoryPages: MetadataRoute.Sitemap = US_STATES.map((state) => ({
    url: `${BASE_URL}/directory/${state.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const personaPages: MetadataRoute.Sitemap = PERSONAS.map((persona) => ({
    url: `${BASE_URL}/for/${persona.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const comparisonPages: MetadataRoute.Sitemap = COMPETITORS.map((comp) => ({
    url: `${BASE_URL}/compare/${comp.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const alternativesPages: MetadataRoute.Sitemap = ALTERNATIVES_PAGES.map((page) => ({
    url: `${BASE_URL}/alternatives/${page.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const guidePages: MetadataRoute.Sitemap = IMPORT_GUIDES.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const glossaryPages: MetadataRoute.Sitemap = GLOSSARY_TERMS.map((term) => ({
    url: `${BASE_URL}/glossary/${term.slug}`,
    lastModified: CONTENT_LAST_REVIEWED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const posts = getAllPosts()
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.date,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...statePages, ...directoryPages, ...personaPages, ...comparisonPages, ...alternativesPages, ...guidePages, ...glossaryPages, ...blogPages]
}
