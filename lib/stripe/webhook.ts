import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe/client"

export function constructWebhookEvent(
  rawBody: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured")

  // Stripe's SDK verifies the signed timestamp and applies its default replay
  // tolerance. Do not reject legitimate delivery retries based on event age.
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    webhookSecret
  )
}
