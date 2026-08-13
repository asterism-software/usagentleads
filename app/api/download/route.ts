import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { isValidUUID, isValidStateCode } from "@/lib/utils/security"
import { rateLimit } from "@/lib/utils/rateLimit"
import {
  FULL_DATABASE_ZIP_PATH,
  LEGACY_FULL_DATABASE_GZIP_PATH,
} from "@/lib/csv/excel-safe-archive"

const db = () => createServiceClient().schema("usagentleads")

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  const { success } = await rateLimit(`download:${ip}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token || !isValidUUID(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  // Validate the purchase and prepare its Storage URL before claiming the token.
  // The signed URL is not exposed unless the atomic claim below succeeds.
  const { data: purchase } = await db()
    .from("purchases")
    .select("id, user_id, guest_email, purchase_type, state_code, expires_at")
    .eq("download_token", token)
    .eq("token_used", false)
    .eq("status", "completed")
    .single()

  if (!purchase) {
    return NextResponse.json(
      { error: "Invalid or expired download link" },
      { status: 403 }
    )
  }

  if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired download link" },
      { status: 403 }
    )
  }

  // Determine preferred and rollout-fallback file paths.
  let filePaths: string[]
  if (purchase.purchase_type === "full_database") {
    filePaths = [FULL_DATABASE_ZIP_PATH, LEGACY_FULL_DATABASE_GZIP_PATH]
  } else if (purchase.purchase_type === "state" && purchase.state_code && isValidStateCode(purchase.state_code)) {
    filePaths = [`states/${purchase.state_code}.csv`]
  } else {
    return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 })
  }

  // Generate a signed URL, allowing the pre-ZIP archive during rollout only.
  const supabase = createServiceClient()
  let signedUrl: string | null = null
  let lastStorageError: unknown = null

  for (const filePath of filePaths) {
    const { data, error } = await supabase.storage
      .from("agent-csvs")
      .createSignedUrl(filePath, 300, {
        download: filePath.split("/").at(-1) || true,
      })

    if (!error && data?.signedUrl) {
      signedUrl = data.signedUrl
      break
    }
    lastStorageError = error
  }

  if (!signedUrl) {
    console.error("Storage signed URL error:", lastStorageError)
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    )
  }

  // Atomic: claim the token only after Storage has supplied a working URL.
  const { data: claimedPurchase, error } = await db()
    .from("purchases")
    .update({ token_used: true })
    .eq("download_token", token)
    .eq("token_used", false)
    .eq("status", "completed")
    .select("id")
    .single()

  if (error || !claimedPurchase) {
    return NextResponse.json(
      { error: "Invalid or expired download link" },
      { status: 403 }
    )
  }

  // Log download
  await db().from("download_logs").insert({
    user_id: purchase.user_id,
    guest_email: purchase.guest_email,
    download_type: purchase.purchase_type,
    state_code: purchase.state_code,
    ip_address: ip,
    user_agent: request.headers.get("user-agent") || null,
  })

  return NextResponse.redirect(signedUrl)
}
