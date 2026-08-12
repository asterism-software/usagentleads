import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendFreeSampleEmail } from "@/lib/resend/emails"
import { rateLimit } from "@/lib/utils/rateLimit"
import { createHash } from "crypto"
import { captureServerEvent } from "@/lib/posthog-server"
import { sanitizePostHogDistinctId } from "@/lib/utils/attribution"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  // Rate limit: 3 requests per IP per minute
  const { success } = await rateLimit(`free-sample:${ip}`, 3, 60_000)
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  // Parse defensively: a malformed body, or a non-string `email` (e.g. a number
  // or object), previously threw before any handler and surfaced as a 500.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const {
    email: rawEmail,
    source: rawSource,
    posthogDistinctId: rawPostHogDistinctId,
  } = body as Record<string, unknown>
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
  // Optional capture-point label (e.g. "home_hero", "state_florida", "exit_intent").
  // Sanitized to a short slug so it's safe to store and group on.
  const source = typeof rawSource === "string"
    ? rawSource.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40) || null
    : null
  const posthogDistinctId = sanitizePostHogDistinctId(rawPostHogDistinctId)

  // Cap length before the regex: the address also becomes a rate-limit key and
  // a stored row, and an unbounded string is a cheap way to abuse both.
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Per-email rate limit: 1 request per email per 24 hours
  const { success: emailOk } = await rateLimit(`free-sample-email:${email}`, 1, 24 * 60 * 60 * 1000)
  if (!emailOk) {
    // Return success to avoid revealing whether email was already used
    return NextResponse.json({ success: true })
  }

  try {
    const supabase = createServiceClient()

    // Persist the lead first so we capture it even if email delivery is slow or
    // fails. First touch wins (keeps original created_at for accurate drip timing);
    // a repeat request just refreshes the source. Non-fatal if it errors.
    const { error: leadError } = await supabase
      .schema("usagentleads")
      .from("sample_leads")
      .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true })
    if (leadError) console.error("sample_leads insert error:", leadError)

    // Generate a signed URL (7 days) for the pre-generated sample CSV
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("agent-csvs")
      .createSignedUrl("free-sample/free-sample-data.csv", 60 * 60 * 24 * 7)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError)
      throw new Error("Failed to generate download link")
    }

    await sendFreeSampleEmail({
      to: email,
      downloadUrl: signedUrlData.signedUrl,
    })

    const leadId = createHash("sha256").update(email).digest("hex")
    captureServerEvent({
      distinctId: posthogDistinctId || `sample-lead:${leadId.slice(0, 32)}`,
      event: "lead_captured",
      properties: {
        $insert_id: `sample-lead:${leadId}`,
        source: source || "unknown",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Free sample error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
