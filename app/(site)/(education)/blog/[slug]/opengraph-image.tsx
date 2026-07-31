import { ImageResponse } from "next/og"
import { getPostBySlug, getAllPosts } from "@/lib/blog"

export const alt = "USAgentLeads Blog"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  const title = post?.meta.title ?? "Blog Post"
  const category = post?.meta.category ?? "Blog"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          fontFamily: "sans-serif",
          padding: "60px 80px",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#1D4ED8",
          }}
        />

        {/* Top: Brand + Category */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
              <path
                d="M32 2C19.85 2 10 11.85 10 24c0 16.5 22 38 22 38s22-21.5 22-38C54 11.85 44.15 2 32 2z"
                fill="#1D4ED8"
              />
              <circle cx="32" cy="19" r="6" fill="white" />
              <path
                d="M24 33c0-4.42 3.58-8 8-8s8 3.58 8 8"
                stroke="white"
                stroke-width="4"
                stroke-linecap="round"
                fill="none"
              />
            </svg>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>
              <span style={{ color: "#FFFFFF" }}>USAgent</span>
              <span style={{ color: "#60A5FA" }}>Leads</span>
            </div>
          </div>
          <div
            style={{
              background: "rgba(29, 78, 216, 0.15)",
              border: "1px solid rgba(29, 78, 216, 0.3)",
              borderRadius: 100,
              padding: "8px 20px",
              fontSize: 16,
              color: "#93C5FD",
              fontWeight: 500,
            }}
          >
            {category}
          </div>
        </div>

        {/* Middle: Title */}
        <div
          style={{
            fontSize: title.length > 60 ? 40 : 48,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.2,
            letterSpacing: -1,
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        {/* Bottom: Domain */}
        <div
          style={{
            fontSize: 18,
            color: "#475569",
            fontWeight: 500,
          }}
        >
          usagentleads.com/blog
        </div>
      </div>
    ),
    { ...size }
  )
}
