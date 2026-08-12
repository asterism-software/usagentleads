# Fix discounted Full Database webhook fulfillment

**Date:** 2026-08-12

## Summary

Paid Full Database checkouts that use a valid Stripe promotion code can now
complete fulfillment and send the buyer's download email.

## Root cause

Stripe Checkout allows promotion codes for every plan, but the webhook required
a Full Database session's final `amount_total` to equal the undiscounted $199.00
price. Because Stripe calculates `amount_total` after discounts, a legitimate
discounted payment was rejected as an unexpected amount before the purchase row
or Resend delivery could be completed.

## Changes

- Keep the existing allowlist checks for Stripe Price ID, quantity, purchase
  type, and USD currency.
- Validate `amount_subtotal` against the configured plan price so the original
  product price must still match.
- Accept a non-negative `amount_total` no greater than the validated subtotal,
  allowing legitimate Stripe discounts, including a 100% promotion.
- Add regression coverage for a 20%-discounted Full Database purchase and for
  invalid subtotals, negative totals, and totals above the original price.

## Incident recovery

- Replay the affected signed completion event through the patched idempotent
  webhook handler.
- Confirm the purchase is completed, the fulfillment email is accepted by the
  email provider, and the Stripe event is recorded as processed.
- Preserve the buyer's unused download token and its 48-hour expiration window.

## Verification

- The full Vitest suite passes with 247 tests.
- TypeScript type checking passes.
- The production Next.js build passes locally.
- ESLint reports no errors; the five remaining warnings are pre-existing and
  unrelated to this change.

No database migration is required.
