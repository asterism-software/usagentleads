import posthog from "posthog-js"
import { captureFirstTouchAttribution } from "@/lib/utils/attribution"

// Runs before the app hydrates, preserving the original document referrer and
// landing pathname before any client-side navigation can change the page.
captureFirstTouchAttribution()

// PostHog pulls in autocapture, web-vitals, and — when session replay is enabled
// server-side — the rrweb recorder (posthog-recorder.js, ~53 KiB). Initializing
// it eagerly on startup put all of that on the critical path, where Lighthouse
// attributed long main-thread tasks, legacy/unused JS, and a forced reflow to it.
//
// We keep every feature enabled but defer init until the main thread is idle, or
// the first user interaction — whichever comes first — so analytics never competes
// with first paint, LCP, or hydration. PostHog captures the initial $pageview when
// it inits, so no pageview is lost; it's just recorded a beat later. Kicking off on
// first interaction guarantees PostHog is ready before any conversion event fires.
let started = false

function initPostHog() {
  if (started) return
  started = true
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    disable_surveys: true,
    capture_dead_clicks: false,
  })
}

if (typeof window !== "undefined") {
  const INTERACTION_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const

  const removeInteractionListeners = () => {
    for (const evt of INTERACTION_EVENTS) window.removeEventListener(evt, start)
  }

  function start() {
    removeInteractionListeners()
    initPostHog()
  }

  for (const evt of INTERACTION_EVENTS) {
    window.addEventListener(evt, start, { once: true, passive: true })
  }

  const requestIdle = window.requestIdleCallback
  if (typeof requestIdle === "function") {
    requestIdle(start, { timeout: 4000 })
  } else {
    setTimeout(start, 2500)
  }
}
