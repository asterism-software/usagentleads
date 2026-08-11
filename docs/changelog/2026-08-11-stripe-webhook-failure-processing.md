# Fix Stripe webhook processing for unsuccessful Checkout Sessions

**Date:** 2026-08-11

## Summary

Stripe `checkout.session.expired` and
`checkout.session.async_payment_failed` events no longer attempt to set a
purchase status that the production database rejects.

## Changes

- Keep unsuccessful one-time purchases in the existing `pending` fulfillment
  state while recording the final Stripe Checkout Session, PaymentIntent,
  customer, email, and metadata context for reconciliation.
- Limit failure-context updates to pending purchases billed through Stripe so a
  delayed event cannot modify a completed or refunded purchase.
- Continue releasing the matching checkout claim when an unsuccessful
  subscription Checkout Session is received.
- Add regression coverage for expired and asynchronous-payment-failed Checkout
  Sessions.

## Verification

- TypeScript type checking passes.
- The full Vitest suite passes with 243 tests.
- ESLint reports no errors; the five remaining warnings are pre-existing and
  unrelated to this change.
