"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Menu, X, LogOut, LayoutDashboard, CreditCard } from "lucide-react"
import { LogoIcon } from "@/components/ui/Logo"
import { formatAgentCount } from "@/lib/utils/states"
import type { User } from "@supabase/supabase-js"

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    supabase
      .schema("usagentleads")
      .from("state_count")
      .select("count")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTotalCount(data.reduce((sum: number, row: { count: number }) => sum + row.count, 0))
        }
      })
  }, [supabase])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled((prev) => {
          const next = window.scrollY > 10
          return prev === next ? prev : next
        })
        ticking = false
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  useEffect(() => {
    if (!dropdownOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [dropdownOpen])

  const handleSignIn = () => {
    window.location.href = "/login?next=/dashboard"
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDropdownOpen(false)
  }

  // Primary links shown in the desktop bar — kept lean so it never crowds.
  // Dashboard is intentionally omitted (it lives in the account menu / Sign In).
  const primaryLinks = [
    { href: "/states", label: "Browse States" },
    { href: "/directory", label: "Agent Directory" },
    { href: "/tools", label: "Free Tools" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    // { href: "/docs", label: "API Docs" },
  ]

  // The mobile overlay has room to spare, so it also surfaces Contact.
  const mobileLinks = [...primaryLinks, { href: "/contact", label: "Contact" }]

  const initials = user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"

  const agentCountLabel = totalCount > 0 ? formatAgentCount(totalCount) : "1M+"

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-200 ${
          scrolled
            ? "border-b border-border bg-white/80 backdrop-blur-md"
            : "border-b border-transparent bg-white"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-[19px] font-semibold tracking-tight">
            <LogoIcon className="h-7 w-7" />
            <span>
              <span className="text-ink">USAgent</span>
              <span className="text-accent">Leads</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 xl:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-transparent px-3 py-2 text-[14px] font-medium text-body transition-all duration-150 hover:text-ink hover:border-border hover:bg-subtle"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[12px] font-mono font-medium text-white"
                >
                  {initials}
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div
                      role="menu"
                      onKeyDown={(e) => { if (e.key === "Escape") setDropdownOpen(false) }}
                      className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-white p-1.5 shadow-lg"
                    >
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-body transition-colors hover:bg-subtle hover:text-ink"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <a
                        href="/api/billing-portal"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-body transition-colors hover:bg-subtle hover:text-ink"
                      >
                        <CreditCard className="h-4 w-4" />
                        Subscription
                      </a>
                      <div className="my-1 h-px bg-border" />
                      <button
                        onClick={handleSignOut}
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-body transition-colors hover:bg-subtle hover:text-danger"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-body transition-all duration-150 hover:text-ink hover:bg-subtle"
                >
                  Sign In
                </button>
                <Link
                  href="/pricing"
                  className="btn-primary text-[14px] px-5 py-2.5 font-medium"
                >
                  Get {agentCountLabel} Agents — <span className="font-bold">$399</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-tertiary transition-colors hover:text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-white lg:hidden animate-fade-in">
          {/* Mobile header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2 text-[19px] font-semibold tracking-tight" onClick={() => setMobileOpen(false)}>
              <LogoIcon className="h-7 w-7" />
              <span>
                <span className="text-ink">USAgent</span>
                <span className="text-accent">Leads</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-tertiary transition-colors hover:text-ink"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile nav links */}
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
            {mobileLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-[18px] font-medium text-ink transition-colors hover:text-accent"
                style={{
                  animation: `fade-in-up 0.35s ease-out forwards`,
                  animationDelay: `${i * 70}ms`,
                  animationFillMode: "backwards",
                }}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px w-12 bg-border my-1" />

            {user ? (
              <>
                <div
                  className="flex flex-col items-center gap-1"
                  style={{
                    animation: `fade-in-up 0.35s ease-out forwards`,
                    animationDelay: `${mobileLinks.length * 70}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-[14px] font-mono font-medium text-white">
                    {initials}
                  </div>
                  <span className="text-[13px] text-tertiary truncate max-w-50">{user.email}</span>
                </div>
                <div
                  className="flex flex-col items-center gap-3"
                  style={{
                    animation: `fade-in-up 0.35s ease-out forwards`,
                    animationDelay: `${(mobileLinks.length + 1) * 70}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-[16px] font-medium text-body transition-colors hover:text-ink"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <a
                    href="/api/billing-portal"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-[16px] font-medium text-body transition-colors hover:text-ink"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                  </a>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false) }}
                    className="flex items-center gap-2 text-[16px] font-medium text-tertiary transition-colors hover:text-danger"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center gap-4"
                style={{
                  animation: `fade-in-up 0.35s ease-out forwards`,
                  animationDelay: `${mobileLinks.length * 70}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <button
                  onClick={() => { handleSignIn(); setMobileOpen(false) }}
                  className="text-[16px] font-medium text-body transition-colors hover:text-ink"
                >
                  Sign In
                </button>
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary text-[16px] px-7 py-2.5 font-semibold"
                >
                  Get {agentCountLabel} Agents — <span className="font-bold">$399</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
