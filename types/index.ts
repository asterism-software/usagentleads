export interface Agent {
  id: string
  name: string
  email: string | null
  phone: string | null
  state: string
}

export interface CheckoutMetadataSnapshot {
  ip?: string
  timezone?: string
  country?: string
  referrer?: string
  first_landing_page?: string
  plan_name?: string
  plan_price?: string
  plan_price_cents?: string
  currency?: string
  [key: string]: string | undefined
}

export interface Purchase {
  id: string
  user_id: string | null
  guest_email: string | null
  purchase_type: "state" | "full_database" | "subscription"
  state_code: string | null
  billing_provider: "legacy" | "stripe"
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_customer_id: string | null
  amount_paid: number
  amount_refunded: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  download_token: string
  token_used: boolean
  fulfillment_email_sent_at: string | null
  metadata: CheckoutMetadataSnapshot
  expires_at: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  billing_provider: "legacy" | "stripe"
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  stripe_price_id: string | null
  provider_status: string | null
  plan: "pro_monthly" | "pro_api"
  status: "active" | "paused" | "cancelled" | "expired" | "on_trial"
  current_period_start: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  metadata: CheckoutMetadataSnapshot
  created_at: string
  updated_at: string
}

export interface DownloadLog {
  id: string
  user_id: string | null
  guest_email: string | null
  download_type: string
  state_code: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface USState {
  code: string
  name: string
  slug: string
  agentCount: number
}

export interface AgentsApiResponse {
  data: Agent[]
  count: number
  page: number
  totalPages: number
}
