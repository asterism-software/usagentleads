import { ImageResponse } from "next/og"
import { getAllPosts, getPostBySlug } from "@/lib/blog"

export const alt = "USAgentLeads blog article"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

function trimText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  const end = text.lastIndexOf(" ", maxLength)
  return `${text.slice(0, end > 0 ? end : maxLength)}…`
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
        <path
          d="M32 2C19.85 2 10 11.85 10 24c0 16.5 22 38 22 38s22-21.5 22-38C54 11.85 44.15 2 32 2z"
          fill="#1D4ED8"
        />
        <circle cx="32" cy="19" r="6" fill="white" />
        <path d="M24 33c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: -1.2 }}>
        <span style={{ color: "#0F1623" }}>USAgent</span>
        <span style={{ color: "#1D4ED8" }}>Leads</span>
      </div>
    </div>
  )
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  const meta = post?.meta
  const title = meta?.title ?? "Real Estate Agent Data Insights"
  const description = trimText(meta?.description ?? "Practical insights for reaching real estate agents.", 175)
  const titleSize = title.length > 90 ? 40 : title.length > 65 ? 46 : 52

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          padding: "46px 52px 38px",
          background: "#F8F9FB",
          color: "#0F1623",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.55,
            backgroundImage:
              "linear-gradient(to right, rgba(29,78,216,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,78,216,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "#1D4ED8" }} />
        <div
          style={{
            position: "absolute",
            right: -130,
            top: 150,
            width: 420,
            height: 420,
            borderRadius: 210,
            background: "rgba(29, 78, 216, 0.07)",
          }}
        />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Brand />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #BFDBFE",
              borderRadius: 999,
              padding: "9px 15px",
              background: "#EEF2FF",
              color: "#1D4ED8",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.1,
            }}
          >
            INSIGHTS
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", flex: 1, gap: 46, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 650 }}>
            <div
              style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              marginBottom: 18,
                borderRadius: 6,
                padding: "7px 11px",
                background: "#EEF2FF",
                color: "#1D4ED8",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.2,
              }}
            >
              {meta?.category?.toUpperCase() ?? "REAL ESTATE DATA"}
            </div>
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: -2,
                maxWidth: 650,
              }}
            >
              {title}
            </div>
            <div style={{ marginTop: 18, fontSize: 19, lineHeight: 1.45, color: "#4B5563", maxWidth: 625 }}>
              {description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 400,
              padding: "24px",
              border: "1px solid #E2E5EB",
              borderRadius: 18,
              background: "#FFFFFF",
              boxShadow: "0 16px 36px rgba(15,22,35,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #E2E5EB" }}>
              <span style={{ color: "#4B5563", fontSize: 13, fontWeight: 700, letterSpacing: 1.2 }}>ARTICLE BRIEF</span>
              <span style={{ color: "#1D4ED8", fontSize: 13, fontWeight: 700 }}>01</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>TOPIC</span>
                <span style={{ color: "#0F1623", fontSize: 20, fontWeight: 700 }}>{meta?.category ?? "Real Estate Data"}</span>
              </div>
              <div style={{ height: 1, background: "#E2E5EB" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>READ TIME</span>
                  <span style={{ color: "#0F1623", fontSize: 17, fontWeight: 700 }}>{meta?.readingTime ?? "Guide"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: "right" }}>
                  <span style={{ color: "#6B7280", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>PUBLISHED</span>
                  <span style={{ color: "#0F1623", fontSize: 17, fontWeight: 700 }}>{meta?.date ?? "2026"}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 24, padding: "12px 14px", borderRadius: 10, background: "#EEF2FF", color: "#1D4ED8" }}>
              <span style={{ fontSize: 22, fontWeight: 700 }}>1.1M+</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>verified agent contacts</span>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, color: "#6B7280", fontSize: 13, fontWeight: 700, letterSpacing: 1.1 }}>
          <span>USAGENTLEADS.COM</span>
          <span style={{ color: "#1D4ED8" }}>•</span>
          <span>REAL ESTATE DATA &amp; OUTREACH</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
