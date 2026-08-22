import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only client for the static `usagentleads.leads` table.
 *
 * Leads now live in the same Supabase project as auth, billing, state counts, and
 * Storage. Keeping this dedicated client preserves the existing query boundary
 * while reusing the project's server-only service credential. The table itself
 * grants that role SELECT only.
 */
let client: SupabaseClient | null = null

export function createLeadsClient(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — the leads database is unconfigured"
    )
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}
