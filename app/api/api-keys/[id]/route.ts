import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/utils/rateLimit"
import { isSameOriginRequest, isValidUUID } from "@/lib/utils/security"
import { z } from "zod"
import { getSubscriptionAccess } from "@/lib/subscriptions"

const db = () => createServiceClient().schema("usagentleads")

const renameSchema = z.object({
  name: z.string().min(1).max(50),
})

async function hasApiAccess(userId: string) {
  const { data } = await db()
    .from("subscriptions")
    .select("billing_provider, status, plan, current_period_end, trial_ends_at, cancel_at_period_end")
    .eq("user_id", userId)
    .single()
  return getSubscriptionAccess(data).hasApi
}

// DELETE — revoke an API key
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { success } = await rateLimit(`api-keys-revoke:${user.id}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  if (!(await hasApiAccess(user.id))) {
    return NextResponse.json({ error: "Pro API subscription required", upgrade: true }, { status: 403 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid key ID" }, { status: 400 })
  }

  // Verify ownership and revoke
  const { data, error } = await db()
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .select("id")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 })
  }

  return NextResponse.json({ message: "API key revoked" })
}

// PATCH — rename an API key
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { success } = await rateLimit(`api-keys-rename:${user.id}`, 10)
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  if (!(await hasApiAccess(user.id))) {
    return NextResponse.json({ error: "Pro API subscription required", upgrade: true }, { status: 403 })
  }

  const { id } = await params
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid key ID" }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = renameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 })
  }

  const { data, error } = await db()
    .from("api_keys")
    .update({ name: parsed.data.name })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, key_prefix, created_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}
