import crypto from "crypto"
import { createServiceClient } from "@/lib/supabase/server"
import { isValidStateCode, isValidUUID } from "@/lib/utils/security"
import {
  FULL_DATABASE_ZIP_PATH,
  LEGACY_FULL_DATABASE_GZIP_PATH,
} from "@/lib/csv/excel-safe-archive"

export const DEFAULT_DOWNLOAD_LIMIT = 5
export const STATE_SIGNED_URL_SECONDS = 15 * 60
export const FULL_DATABASE_SIGNED_URL_SECONDS = 60 * 60

export type DownloadAccessStatus =
  | "available"
  | "invalid"
  | "pending"
  | "expired"
  | "limit_reached"

export type DownloadPurchase = {
  id: string
  user_id: string | null
  guest_email: string | null
  purchase_type: "state" | "full_database"
  state_code: string | null
  status: string
  expires_at: string | null
  download_count: number
  download_limit: number
}

export type DownloadAccess = {
  status: DownloadAccessStatus
  purchase: DownloadPurchase | null
}

export type DownloadAuthorization =
  | { ok: true; signedUrl: string }
  | {
      ok: false
      reason: "invalid" | "pending" | "expired" | "limit_reached" | "storage_error" | "claim_conflict"
    }

type AttemptOutcome = Exclude<DownloadAuthorization, { ok: true }>['reason'] | "authorized"

const db = () => createServiceClient().schema("usagentleads")

function accessTokenFilter(token: string): string {
  return `page_token.eq.${token},download_token.eq.${token}`
}

export async function getDownloadAccess(token: string | null | undefined): Promise<DownloadAccess> {
  if (!token || !isValidUUID(token)) {
    return { status: "invalid", purchase: null }
  }

  const { data, error } = await db()
    .from("purchases")
    .select(
      "id, user_id, guest_email, purchase_type, state_code, status, expires_at, download_count, download_limit"
    )
    .or(accessTokenFilter(token))
    .maybeSingle()

  if (error) {
    console.error("Download access lookup failed", {
      code: error.code,
      message: error.message,
    })
    return { status: "invalid", purchase: null }
  }
  if (!data) return { status: "invalid", purchase: null }

  const purchase = data as DownloadPurchase
  if (purchase.status === "pending") return { status: "pending", purchase }
  if (purchase.status !== "completed") return { status: "invalid", purchase }
  if (purchase.expires_at && Date.parse(purchase.expires_at) <= Date.now()) {
    return { status: "expired", purchase }
  }
  if (purchase.download_count >= purchase.download_limit) {
    return { status: "limit_reached", purchase }
  }
  return { status: "available", purchase }
}

function filePathsForPurchase(purchase: DownloadPurchase): string[] | null {
  if (purchase.purchase_type === "full_database") {
    return [FULL_DATABASE_ZIP_PATH, LEGACY_FULL_DATABASE_GZIP_PATH]
  }
  if (
    purchase.purchase_type === "state" &&
    purchase.state_code &&
    isValidStateCode(purchase.state_code)
  ) {
    return [`states/${purchase.state_code}.csv`]
  }
  return null
}

function anonymizeIp(ip: string, purchaseId: string): string {
  const secret =
    process.env.DOWNLOAD_AUDIT_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "download-audit"
  return crypto
    .createHmac("sha256", secret)
    .update(`${purchaseId}:${ip}`)
    .digest("hex")
}

async function recordAttempt({
  purchase,
  outcome,
  requestId,
  userAgent,
  ip,
  downloadCount,
}: {
  purchase: DownloadPurchase
  outcome: AttemptOutcome
  requestId: string
  userAgent: string | null
  ip: string
  downloadCount?: number
}) {
  const { error } = await db().from("download_attempts").insert({
    purchase_id: purchase.id,
    outcome,
    download_count: downloadCount ?? purchase.download_count,
    request_id: requestId,
    user_agent: userAgent,
    ip_hash: anonymizeIp(ip, purchase.id),
  })
  if (error) {
    console.error("Download attempt audit failed", {
      requestId,
      outcome,
      code: error.code,
      message: error.message,
    })
  }
}

export async function authorizeDownload({
  token,
  ip,
  userAgent,
  requestId,
}: {
  token: string
  ip: string
  userAgent: string | null
  requestId: string
}): Promise<DownloadAuthorization> {
  const access = await getDownloadAccess(token)
  if (!access.purchase || access.status === "invalid") {
    return { ok: false, reason: "invalid" }
  }
  if (access.status !== "available") {
    await recordAttempt({
      purchase: access.purchase,
      outcome: access.status,
      requestId,
      userAgent,
      ip,
    })
    return { ok: false, reason: access.status }
  }

  const purchase = access.purchase
  const filePaths = filePathsForPurchase(purchase)
  if (!filePaths) return { ok: false, reason: "invalid" }

  const expiresIn =
    purchase.purchase_type === "full_database"
      ? FULL_DATABASE_SIGNED_URL_SECONDS
      : STATE_SIGNED_URL_SECONDS
  const supabase = createServiceClient()
  let signedUrl: string | null = null
  let lastStorageError: unknown = null

  for (const filePath of filePaths) {
    const { data, error } = await supabase.storage
      .from("agent-csvs")
      .createSignedUrl(filePath, expiresIn, {
        download: filePath.split("/").at(-1) || true,
      })
    if (!error && data?.signedUrl) {
      signedUrl = data.signedUrl
      break
    }
    lastStorageError = error
  }

  if (!signedUrl) {
    console.error("Storage signed URL error", { requestId, error: lastStorageError })
    await recordAttempt({
      purchase,
      outcome: "storage_error",
      requestId,
      userAgent,
      ip,
    })
    return { ok: false, reason: "storage_error" }
  }

  const { data: authorization, error: authorizationError } = await db().rpc(
    "authorize_purchase_download",
    { p_access_token: token }
  )
  const authorized = Array.isArray(authorization) ? authorization[0] : authorization

  if (authorizationError || !authorized) {
    await recordAttempt({
      purchase,
      outcome: "claim_conflict",
      requestId,
      userAgent,
      ip,
    })
    return { ok: false, reason: "claim_conflict" }
  }

  await Promise.all([
    recordAttempt({
      purchase,
      outcome: "authorized",
      requestId,
      userAgent,
      ip,
      downloadCount: authorized.authorized_download_count,
    }),
    db().from("download_logs").insert({
      user_id: purchase.user_id,
      guest_email: purchase.guest_email,
      download_type: purchase.purchase_type,
      state_code: purchase.state_code,
      user_agent: userAgent,
    }),
  ])

  return { ok: true, signedUrl }
}
