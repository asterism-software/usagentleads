import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSubscriptionAccess } from "@/lib/subscriptions"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Skip middleware for webhook/auth endpoints (no user session needed)
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/v1/")) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Helper: check if user has an active subscription or valid trial/period
  async function hasActiveSubscription(userId: string): Promise<boolean> {
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    const { data: subscription } = await serviceClient
      .schema("usagentleads")
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, trial_ends_at")
      .eq("user_id", userId)
      .single()

    return getSubscriptionAccess(subscription).hasDashboard
  }

  // Signed-in user with active subscription on homepage → redirect to dashboard
  if (pathname === "/" && user) {
    const active = await hasActiveSubscription(user.id)
    if (active) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/pricing"
      return NextResponse.redirect(url)
    }

    const active = await hasActiveSubscription(user.id)
    if (!active) {
      const url = request.nextUrl.clone()
      url.pathname = "/pricing"
      url.searchParams.set("upgrade", "true")
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
