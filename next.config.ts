import type { NextConfig } from "next"

const isDevelopment = process.env.NODE_ENV === "development"

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://us.i.posthog.com https://us-assets.i.posthog.com https://connect.facebook.net`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://us.i.posthog.com https://us-assets.i.posthog.com https://connect.facebook.net https://www.facebook.com",
      "frame-src https://www.facebook.com",
      // Hardening: block plugins, lock down <base>, disallow framing & off-site
      // form posts. Scripts still need 'unsafe-inline' (inline gtag/fbq/JSON-LD),
      // so this isn't a nonce-strict policy, but it closes the cheap XSS vectors.
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // Inline the page's CSS into <style> tags in the document head instead of
    // shipping render-blocking <link rel="stylesheet"> requests. Removes the two
    // blocking CSS round-trips Lighthouse flagged (~630ms mobile) from the
    // critical path. Trade-off: CSS rides in the HTML rather than a separately
    // cached file, but this site's pages are statically rendered / ISR-cached at
    // the edge, so the HTML is already cache-friendly.
    inlineCss: true,
  },
  trailingSlash: false,
  // Required for the PostHog reverse proxy below — PostHog's API ignores trailing slashes
  // and Next would otherwise issue a redirect that breaks the proxied request.
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "usagentleads.com" }],
        destination: "https://www.usagentleads.com/:path*",
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
      { source: "/ingest/decide", destination: "https://us.i.posthog.com/decide" },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/ingest/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default nextConfig
