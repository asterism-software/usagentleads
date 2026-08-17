"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BadgeCheck, X } from "lucide-react"
import type { RecentOrder } from "@/lib/supabase/server"

const FIRST_DELAY = 3500 // show shortly after the visitor lands
const VISIBLE_MS = 4000 // how long each toast stays up
const GAP_MS = 4000 // short gap before the next order

export function RecentOrdersToastClient({ orders }: { orders: RecentOrder[] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  // Dismissal is in-memory only: closing it stops the toasts for this page view,
  // but a reload brings them back.
  const [dismissed, setDismissed] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Drive the show / hide / advance cycle.
  useEffect(() => {
    if (dismissed || orders.length === 0) return

    const clear = () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }

    const showAt = (delay: number) => {
      timers.current.push(
        setTimeout(() => {
          setVisible(true)
          // Hide after VISIBLE_MS, then advance and schedule the next one.
          timers.current.push(
            setTimeout(() => {
              setVisible(false)
              timers.current.push(
                setTimeout(() => {
                  setIndex((i) => (i + 1) % orders.length)
                  showAt(0)
                }, GAP_MS)
              )
            }, VISIBLE_MS)
          )
        }, delay)
      )
    }

    showAt(FIRST_DELAY)
    return clear
  }, [dismissed, orders.length])

  function dismiss() {
    setVisible(false)
    setDismissed(true)
  }

  if (dismissed || orders.length === 0) return null

  const order = orders[index]

  return (
    <div
      className={`fixed left-4 right-4 z-40 w-auto sm:right-auto sm:w-[320px]
                  bottom-24 sm:bottom-4
                  transition-all duration-500 ease-out
                  motion-reduce:transition-none motion-reduce:translate-y-0
                  ${
                    visible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0 pointer-events-none"
                  }`}
      aria-hidden={!visible}
      aria-label="Recent purchase"
    >
      <div className="relative rounded-xl border border-border bg-white shadow-lg">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-1.5 top-1.5 flex size-8 sm:size-7 items-center justify-center rounded-md
                     text-tertiary hover:bg-subtle hover:text-ink transition-colors"
        >
          <X size={14} aria-hidden="true" />
        </button>

        <Link href="/pricing" className="flex items-start gap-3 p-4 pr-10">
          <span
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-light"
            aria-hidden="true"
          >
            <BadgeCheck size={18} className="text-accent" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-ink truncate">
              {order.product}
            </span>
            <span className="mt-0.5 block text-[12px] text-tertiary">
              {order.location ? `A customer in ${order.location}` : "A customer"} · Purchased recently
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-accent">
              <BadgeCheck size={12} aria-hidden="true" />
              Verified purchase
            </span>
          </span>
        </Link>
      </div>
    </div>
  )
}
