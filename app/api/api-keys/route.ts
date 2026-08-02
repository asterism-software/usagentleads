import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { generateApiKey, hashApiKey, extractPrefix } from "@/lib/utils/apiKeys"
import { rateLimit } from "@/lib/utils/rateLimit"
import { z } from "zod"
import { getSubscriptionAccess } from "@/lib/subscriptions"
import { isSameOriginRequest } from "@/lib/utils/security"

const MAX_ACTIVE_KEYS = 3

const createKeySchema = z.object({
  name: z.string().min(1).max(50).optional(),
})

const db = () => createServiceClient().schema("usagentleads")

// GET — list user's API keys
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success } = await rateLimit(`api-keys-list:${user.id}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  // Verify pro_api subscription
  const { data: subscription } = await db()
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_ends_at, cancel_at_period_end")
    .eq("user_id", user.id)
    .single()

  const access = getSubscriptionAccess(subscription)

  const { data: keys } = await db()
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ keys: access.hasApi ? keys || [] : [], access })
}

// POST — create a new API key
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { success } = await rateLimit(`api-keys-create:${user.id}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  // Verify pro_api subscription
  const { data: subscription } = await db()
    .from("subscriptions")
    .select("plan, status, current_period_end, trial_ends_at, cancel_at_period_end")
    .eq("user_id", user.id)
    .single()

  if (!getSubscriptionAccess(subscription).hasApi) {
    return NextResponse.json(
      { error: "Pro API subscription required", upgrade: true },
      { status: 403 }
    )
  }

  // Parse body
  let name = "Default"
  try {
    const body = await request.json()
    const parsed = createKeySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid key name" }, { status: 400 })
    if (parsed.data.name) name = parsed.data.name
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Check max active keys
  const { count } = await db()
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("revoked_at", null)

  if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_ACTIVE_KEYS} active API keys allowed` },
      { status: 400 }
    )
  }

  // Generate key
  const plainKey = generateApiKey()
  const keyHash = hashApiKey(plainKey)
  const keyPrefix = extractPrefix(plainKey)

  const { data: newKey, error } = await db()
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select("id, name, key_prefix, created_at")
    .single()

  if (error) {
    console.error("API key creation error:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }

  // Return the full key only this once
  return NextResponse.json({
    key: plainKey,
    id: newKey.id,
    name: newKey.name,
    key_prefix: newKey.key_prefix,
    created_at: newKey.created_at,
  })
}
