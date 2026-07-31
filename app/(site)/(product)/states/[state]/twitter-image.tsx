import { ImageResponse } from "next/og"
import { getStateBySlug } from "@/lib/utils/states"

export const alt = "US Real Estate Agent Email List — USAgentLeads"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params
  const state = getStateBySlug(slug)

  const name = state?.name ?? "State"
  const count = state ? `${state.agentCount.toLocaleString()}+` : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          fontFamily: "sans-serif",
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

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
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
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>
            <span style={{ color: "#FFFFFF" }}>USAgent</span>
            <span style={{ color: "#60A5FA" }}>Leads</span>
          </div>
        </div>

        {/* State name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            letterSpacing: -2,
            marginBottom: 12,
          }}
        >
          {name}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: "#94A3B8",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          Real Estate Agent Email List
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {[`${count} Contacts`, "Name, Email & Phone", "CSV Download", "$49 One-Time"].map(
            (text) => (
              <div
                key={text}
                style={{
                  background: "rgba(29, 78, 216, 0.15)",
                  border: "1px solid rgba(29, 78, 216, 0.3)",
                  borderRadius: 100,
                  padding: "10px 24px",
                  fontSize: 16,
                  color: "#93C5FD",
                  fontWeight: 500,
                }}
              >
                {text}
              </div>
            )
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 18,
            color: "#475569",
            fontWeight: 500,
          }}
        >
          usagentleads.com
        </div>
      </div>
    ),
    { ...size }
  )
}
