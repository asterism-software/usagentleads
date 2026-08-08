import { ImageResponse } from "next/og"
import { getStateBySlug, US_STATES } from "@/lib/utils/states"

export const alt = "US real estate agent email list — USAgentLeads"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return US_STATES.map((state) => ({ state: state.slug }))
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

function DataRow({ label, width, code }: { label: string; width: number; code?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 0", borderBottom: "1px solid #E2E5EB" }}>
      <div style={{ width: 30, height: 30, borderRadius: 15, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#1D4ED8", fontSize: 13, fontWeight: 700 }}>
        {code ?? "OK"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <span style={{ color: "#4B5563", fontSize: 11, fontWeight: 700, letterSpacing: 0.8 }}>{label}</span>
        <div style={{ width, height: 7, borderRadius: 6, background: "#D7DCE5" }} />
      </div>
      <div style={{ width: 11, height: 11, borderRadius: 6, background: "#1D4ED8" }} />
    </div>
  )
}

export default async function OGImage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params
  const state = getStateBySlug(slug)
  const name = state?.name ?? "State"
  const code = state?.code ?? "US"
  const contacts = state ? `${state.agentCount.toLocaleString()}+` : "Verified"
  const title = `${name} Real Estate Agent Email List`
  const titleSize = name.length > 13 ? 44 : 52

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
            left: -160,
            bottom: -210,
            width: 480,
            height: 480,
            borderRadius: 240,
            background: "rgba(29, 78, 216, 0.06)",
          }}
        />

        <div style={{ position: "absolute", top: 46, left: 52, display: "flex" }}>
          <Brand />
        </div>
        <div
          style={{
            position: "absolute",
            top: 46,
            right: 52,
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
          STATE DATABASE
        </div>

        <div style={{ position: "absolute", top: 146, left: 52, right: 52, height: 350, display: "flex", gap: 48, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 650 }}>
            <div
              style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              marginBottom: 17,
                borderRadius: 6,
                padding: "7px 11px",
                background: "#EEF2FF",
                color: "#1D4ED8",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.2,
              }}
            >
              {code} · VERIFIED CONTACT DATA
            </div>
            <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 650 }}>
              {title}
            </div>
            <div style={{ marginTop: 18, fontSize: 20, lineHeight: 1.42, color: "#4B5563", maxWidth: 610 }}>
              Licensed agent contacts, ready for targeted outreach and instant CSV download.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ color: "#1D4ED8", fontSize: 34, fontWeight: 700, letterSpacing: -1.5 }}>{contacts}</span>
                <span style={{ color: "#4B5563", fontSize: 14, fontWeight: 700, letterSpacing: 0.8 }}>VERIFIED CONTACTS</span>
              </div>
              <div style={{ width: 1, height: 47, background: "#C9CDD6" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ color: "#0F1623", fontSize: 18, fontWeight: 700 }}>Name · Email · Phone</span>
                <span style={{ color: "#4B5563", fontSize: 15 }}>CRM-ready fields · $49 one-time</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 398,
              padding: "22px 24px 18px",
              border: "1px solid #E2E5EB",
              borderRadius: 18,
              background: "#FFFFFF",
              boxShadow: "0 16px 36px rgba(15,22,35,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottom: "1px solid #E2E5EB" }}>
              <span style={{ color: "#4B5563", fontSize: 13, fontWeight: 700, letterSpacing: 1.2 }}>DATABASE PREVIEW</span>
              <span style={{ borderRadius: 6, padding: "5px 8px", background: "#EEF2FF", color: "#1D4ED8", fontSize: 13, fontWeight: 700 }}>{code}</span>
            </div>
            <DataRow label="FULL NAME" width={118} />
            <DataRow label="VERIFIED EMAIL" width={152} />
            <DataRow label="PHONE NUMBER" width={132} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, padding: "12px 14px", borderRadius: 10, background: "#EEF2FF" }}>
              <span style={{ color: "#1D4ED8", fontSize: 14, fontWeight: 700 }}>INSTANT CSV DELIVERY</span>
              <span style={{ color: "#1D4ED8", fontSize: 18, fontWeight: 700 }}>→</span>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 52, bottom: 38, display: "flex", alignItems: "center", gap: 10, color: "#6B7280", fontSize: 13, fontWeight: 700, letterSpacing: 1.1 }}>
          <span>USAGENTLEADS.COM</span>
          <span style={{ color: "#1D4ED8" }}>•</span>
          <span>ALL 50 STATES</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
