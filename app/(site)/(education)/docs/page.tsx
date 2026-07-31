import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Key,
  Shield,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ChevronRight,
} from "lucide-react"
import { generateBreadcrumbSchema } from "@/lib/utils/seo"
import { getTotalCount } from "@/lib/supabase/server"
import { formatAgentCount } from "@/lib/utils/states"

export async function generateMetadata(): Promise<Metadata> {
  const totalCount = await getTotalCount()
  const countLabel = totalCount > 0 ? formatAgentCount(totalCount) : "500K+"

  return {
    title: "Real Estate Agent API 2026 | REST API Documentation",
    description: `Integrate ${countLabel} verified real estate agent contacts into your app via REST API. Updated for 2026 with simple authentication, state filtering, search, and paginated JSON responses.`,
    alternates: {
      canonical: "https://www.usagentleads.com/docs",
      languages: {
        "en-US": "https://www.usagentleads.com/docs",
        "x-default": "https://www.usagentleads.com/docs",
      },
    },
    openGraph: {
      locale: "en_US",
      title: "Real Estate Agent API | REST API Documentation | USAgentLeads",
      description: `Integrate ${countLabel} verified real estate agent contacts into your app via REST API. Simple authentication, state filtering, search, and paginated JSON responses.`,
      url: "https://www.usagentleads.com/docs",
      images: [{ url: "https://www.usagentleads.com/opengraph-image", width: 1200, height: 630, alt: "USAgentLeads - Real Estate Agent Contact Database" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Real Estate Agent API | REST API Documentation",
      description: `Integrate ${countLabel} verified real estate agent contacts into your app via REST API.`,
      images: ["https://www.usagentleads.com/twitter-image"],
    },
  }
}

function CodeBlock({
  title,
  lang,
  children,
}: {
  title?: string
  lang?: string
  children: string
}) {
  return (
    <div className="rounded-xl bg-ink overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-dark-border">
          <span className="text-[12px] font-mono uppercase tracking-wider text-tertiary">
            {title}
          </span>
          {lang && (
            <span className="text-[11px] font-mono text-body ml-auto">
              {lang}
            </span>
          )}
        </div>
      )}
      <pre className="p-4 sm:p-5 text-[12px] sm:text-[13px] font-mono text-code-text leading-relaxed overflow-x-auto whitespace-pre-wrap break-all sm:break-normal">
        {children}
      </pre>
    </div>
  )
}

function SectionAnchor({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-[22px] font-semibold text-ink mb-4 mt-16 first:mt-0 scroll-mt-24 flex items-center gap-3">
      <a href={`#${id}`} className="hover:text-accent transition-colors">
        {children}
      </a>
    </h2>
  )
}

function SectionAnchorH3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-[18px] font-semibold text-ink mb-3 mt-10 scroll-mt-24">
      <a href={`#${id}`} className="hover:text-accent transition-colors">
        {children}
      </a>
    </h3>
  )
}

function ParamRow({
  name,
  type,
  required,
  children,
}: {
  name: string
  type: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 align-top">
        <code className="font-mono text-[13px] font-medium text-accent bg-accent-light px-1.5 py-0.5 rounded">
          {name}
        </code>
      </td>
      <td className="py-3 pr-4 align-top">
        <span className="font-mono text-[13px] text-tertiary">{type}</span>
      </td>
      <td className="py-3 pr-4 align-top">
        {required ? (
          <span className="text-[12px] font-medium text-danger">Required</span>
        ) : (
          <span className="text-[12px] text-muted">Optional</span>
        )}
      </td>
      <td className="py-3 align-top text-[14px] text-body">{children}</td>
    </tr>
  )
}

function StatusBadge({ code, label }: { code: number; label: string }) {
  const color =
    code < 300
      ? "bg-success-bg text-success border-success/20"
      : code < 500
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-danger border-red-200"

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[13px] font-medium px-2.5 py-1 rounded-full border ${color}`}
    >
      {code} {label}
    </span>
  )
}

const tocItems = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "base-url", label: "Base URL" },
  { id: "get-agents", label: "GET /agents" },
  { id: "rate-limiting", label: "Rate Limiting" },
  { id: "monthly-quota", label: "Monthly Quota" },
  { id: "errors", label: "Error Handling" },
  { id: "examples", label: "Code Examples" },
  { id: "api-keys", label: "Managing API Keys" },
  { id: "security", label: "Security" },
]

const docsBreadcrumb = generateBreadcrumbSchema([
  { name: "Home", url: "https://www.usagentleads.com" },
  { name: "API Docs", url: "https://www.usagentleads.com/docs" },
])

export default async function DocsPage() {
  const totalCount = await getTotalCount()
  const countLabel = totalCount > 0 ? formatAgentCount(totalCount) : "500K+"

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(docsBreadcrumb) }}
      />
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-28 max-sm:py-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[14px] text-tertiary mb-10 -mt-6 sm:-mt-12">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight size={14} className="text-muted" />
          <span className="text-ink font-medium">API Docs</span>
        </nav>

        {/* Header */}
        <div className="mb-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light">
              <BookOpen size={16} className="text-accent" />
            </div>
            <p className="label-eyebrow">Documentation</p>
          </div>
          <h1 className="text-[34px] sm:text-[40px] font-semibold text-ink tracking-tight leading-tight mb-4">
            API Reference
          </h1>
          <p className="text-[17px] text-body leading-relaxed max-w-2xl">
            Integrate {countLabel} verified US real estate agent contacts into your CRM,
            marketing tools, or applications with our simple REST API.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="inline-flex items-center gap-2 text-[13px] font-mono text-tertiary bg-subtle rounded-full px-3 py-1.5">
              <Zap size={13} className="text-accent" />
              60 requests/min
            </div>
            <div className="inline-flex items-center gap-2 text-[13px] font-mono text-tertiary bg-subtle rounded-full px-3 py-1.5">
              <BarChart3 size={13} className="text-accent" />
              10,000 requests/month
            </div>
            <div className="inline-flex items-center gap-2 text-[13px] font-mono text-tertiary bg-subtle rounded-full px-3 py-1.5">
              <Shield size={13} className="text-accent" />
              SHA-256 hashed keys
            </div>
          </div>
        </div>

        {/* Mobile TOC */}
        <details className="lg:hidden mb-8 card p-4">
          <summary className="cursor-pointer text-[14px] font-medium text-ink flex items-center justify-between">
            On this page
            <ChevronRight size={16} className="text-muted" />
          </summary>
          <nav className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-1">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-[14px] text-tertiary hover:text-ink transition-colors py-1.5"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </details>

        <div className="flex gap-12">
          {/* TOC sidebar — desktop only */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-24 self-start">
            <p className="text-[12px] font-mono uppercase tracking-wider text-muted mb-3">
              On this page
            </p>
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-[14px] text-tertiary hover:text-ink transition-colors py-1 pl-3 border-l-2 border-transparent hover:border-accent"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 p-4 rounded-xl border border-border bg-subtle/50">
              <p className="text-[13px] font-medium text-ink mb-2">Need API access?</p>
              <p className="text-[13px] text-body mb-3">
                Subscribe to the Pro API plan to get started.
              </p>
              <Link
                href="/pricing"
                className="btn-primary text-[13px] px-4 py-2 w-full justify-center"
              >
                View Plans <ArrowRight size={12} />
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-3xl">
            {/* ========== OVERVIEW ========== */}
            <SectionAnchor id="overview">Overview</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              The USAgentLeads API provides read-only access to our database of US real
              estate agent contacts. All responses are JSON. The API uses API key
              authentication and includes rate limiting and monthly quota tracking.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-border">
                <p className="text-[13px] font-mono text-accent mb-1">Protocol</p>
                <p className="text-[15px] font-medium text-ink">HTTPS only</p>
              </div>
              <div className="p-4 rounded-xl border border-border">
                <p className="text-[13px] font-mono text-accent mb-1">Format</p>
                <p className="text-[15px] font-medium text-ink">JSON</p>
              </div>
              <div className="p-4 rounded-xl border border-border">
                <p className="text-[13px] font-mono text-accent mb-1">Auth</p>
                <p className="text-[15px] font-medium text-ink">API Key</p>
              </div>
            </div>

            {/* ========== AUTHENTICATION ========== */}
            <SectionAnchor id="authentication">Authentication</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              All API requests require a valid API key. Include your key in the request
              headers using one of these methods:
            </p>
            <CodeBlock title="Option 1 — X-API-Key header (recommended)">{`curl -H "X-API-Key: sk_live_abc123..." \\
  https://www.usagentleads.com/api/v1/agents`}</CodeBlock>

            <div className="my-4" />

            <CodeBlock title="Option 2 — Bearer token">{`curl -H "Authorization: Bearer sk_live_abc123..." \\
  https://www.usagentleads.com/api/v1/agents`}</CodeBlock>

            <div className="mt-5 p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-medium text-amber-800 mb-1">
                  Keep your API key secret
                </p>
                <p className="text-[14px] text-amber-700 leading-relaxed">
                  Never expose your API key in client-side code, public repos, or browser
                  requests. Use it only in server-to-server calls. If compromised, revoke
                  it immediately from your dashboard.
                </p>
              </div>
            </div>

            {/* ========== BASE URL ========== */}
            <SectionAnchor id="base-url">Base URL</SectionAnchor>
            <CodeBlock>{`https://www.usagentleads.com/api/v1`}</CodeBlock>
            <p className="text-[14px] text-tertiary mt-3">
              All endpoints are relative to this base URL. HTTPS is required — HTTP
              requests will be rejected.
            </p>

            {/* ========== GET /agents ========== */}
            <SectionAnchor id="get-agents">GET /agents</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              Search and retrieve real estate agent contacts. Returns paginated results
              with name, email, phone, and state.
            </p>

            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg bg-subtle border border-border">
              <span className="font-mono text-[13px] font-semibold text-success">GET</span>
              <code className="font-mono text-[13px] text-ink">/api/v1/agents</code>
            </div>

            <SectionAnchorH3 id="query-params">Query Parameters</SectionAnchorH3>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Parameter
                    </th>
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Type
                    </th>
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Status
                    </th>
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <ParamRow name="state" type="string">
                    Two-letter US state code (e.g., <code className="font-mono text-[13px] bg-subtle px-1 rounded">CA</code>,{" "}
                    <code className="font-mono text-[13px] bg-subtle px-1 rounded">TX</code>,{" "}
                    <code className="font-mono text-[13px] bg-subtle px-1 rounded">NY</code>).
                    Filters agents by state.
                  </ParamRow>
                  <ParamRow name="search" type="string">
                    Search agents by name or email. Case-insensitive partial match.
                    Max 100 characters, alphanumeric and common punctuation only.
                  </ParamRow>
                  <ParamRow name="page" type="integer">
                    Page number for pagination. Defaults to{" "}
                    <code className="font-mono text-[13px] bg-subtle px-1 rounded">1</code>.
                  </ParamRow>
                  <ParamRow name="pageSize" type="integer">
                    Results per page. Accepted values:{" "}
                    <code className="font-mono text-[13px] bg-subtle px-1 rounded">25</code>,{" "}
                    <code className="font-mono text-[13px] bg-subtle px-1 rounded">50</code>, or{" "}
                    <code className="font-mono text-[13px] bg-subtle px-1 rounded">100</code>.
                    Defaults to <code className="font-mono text-[13px] bg-subtle px-1 rounded">25</code>.
                  </ParamRow>
                </tbody>
              </table>
            </div>

            <SectionAnchorH3 id="response-format">Response Format</SectionAnchorH3>
            <CodeBlock title="200 OK" lang="JSON">{`{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "name": "Jane Smith",
      "email": "jane.smith@realty.com",
      "phone": "(310) 555-0142",
      "state": "California"
    },
    {
      "id": "e5f6g7h8-...",
      "name": "John Doe",
      "email": "john.doe@homes.com",
      "phone": "(212) 555-0198",
      "state": "New York"
    }
  ],
  "count": 42318,
  "page": 1,
  "totalPages": 1693,
  "quota": {
    "used": 148,
    "limit": 10000,
    "resets_at": "2026-04-01T00:00:00.000Z"
  }
}`}</CodeBlock>

            <SectionAnchorH3 id="response-fields">Response Fields</SectionAnchorH3>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left min-w-[440px]">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Field
                    </th>
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Type
                    </th>
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">data</code>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-tertiary">array</td>
                    <td className="py-3 text-[14px] text-body">
                      Array of agent objects with id, name, email, phone, and state
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">count</code>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-tertiary">integer</td>
                    <td className="py-3 text-[14px] text-body">
                      Total matching agents (across all pages)
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">page</code>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-tertiary">integer</td>
                    <td className="py-3 text-[14px] text-body">Current page number</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">totalPages</code>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-tertiary">integer</td>
                    <td className="py-3 text-[14px] text-body">Total pages available</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">quota</code>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[13px] text-tertiary">object</td>
                    <td className="py-3 text-[14px] text-body">
                      Monthly quota status: used count, limit, and reset timestamp
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========== RATE LIMITING ========== */}
            <SectionAnchor id="rate-limiting">Rate Limiting</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              The API enforces a per-key rate limit of <strong>60 requests per minute</strong>.
              Rate limit status is returned in response headers:
            </p>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-left mb-4 min-w-[440px]">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Header
                    </th>
                    <th className="pb-2 text-[12px] font-mono uppercase tracking-wider text-muted">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">X-RateLimit-Limit</code>
                    </td>
                    <td className="py-3 text-[14px] text-body">
                      Maximum requests per minute (60)
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">
                        X-RateLimit-Remaining
                      </code>
                    </td>
                    <td className="py-3 text-[14px] text-body">
                      Remaining requests in current window
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">
                        X-Monthly-Quota-Limit
                      </code>
                    </td>
                    <td className="py-3 text-[14px] text-body">
                      Monthly quota limit (10,000)
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-[13px] text-ink">
                        X-Monthly-Quota-Remaining
                      </code>
                    </td>
                    <td className="py-3 text-[14px] text-body">
                      Remaining monthly requests
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[14px] text-body">
              When rate limited, the API returns a{" "}
              <code className="font-mono text-[13px] bg-subtle px-1 rounded">429</code>{" "}
              status. Wait and retry after the window resets (1 minute).
            </p>

            {/* ========== MONTHLY QUOTA ========== */}
            <SectionAnchor id="monthly-quota">Monthly Quota</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              Each Pro API subscription includes <strong>10,000 successful requests per
              calendar month</strong>. Only requests that return a 2xx or 3xx status code
              count toward your quota. Failed requests (4xx, 5xx) do not count.
            </p>

            <div className="p-4 rounded-xl border border-border bg-subtle/50 flex gap-3 mb-4">
              <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
              <p className="text-[14px] text-body">
                Quota resets on the 1st of each month at midnight UTC. Track your usage
                in real-time from the{" "}
                <Link href="/dashboard/api-keys" className="text-accent font-medium hover:underline">
                  API Keys dashboard
                </Link>.
              </p>
            </div>

            {/* ========== ERRORS ========== */}
            <SectionAnchor id="errors">Error Handling</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              The API uses standard HTTP status codes. All error responses include a JSON
              body with an <code className="font-mono text-[13px] bg-subtle px-1 rounded">error</code> field.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <StatusBadge code={200} label="OK" />
                <p className="text-[14px] text-body pt-0.5">
                  Successful request. Agent data returned.
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <StatusBadge code={401} label="Unauthorized" />
                <p className="text-[14px] text-body pt-0.5">
                  Missing, invalid, revoked, or expired API key.
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <StatusBadge code={403} label="Forbidden" />
                <p className="text-[14px] text-body pt-0.5">
                  API key is valid but subscription is inactive or not on the Pro API plan.
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <StatusBadge code={429} label="Too Many Requests" />
                <p className="text-[14px] text-body pt-0.5">
                  Rate limit exceeded (60/min) or monthly quota depleted (10,000/month).
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border">
                <StatusBadge code={500} label="Server Error" />
                <p className="text-[14px] text-body pt-0.5">
                  Internal server error. Retry after a brief delay.
                </p>
              </div>
            </div>

            <CodeBlock title="Error response example" lang="JSON">{`{
  "error": "Monthly API quota exceeded",
  "quota": {
    "used": 10000,
    "limit": 10000
  }
}`}</CodeBlock>

            {/* ========== EXAMPLES ========== */}
            <SectionAnchor id="examples">Code Examples</SectionAnchor>

            <SectionAnchorH3 id="example-curl">cURL</SectionAnchorH3>
            <CodeBlock title="Get all California agents">{`curl -s \\
  -H "X-API-Key: sk_live_abc123..." \\
  "https://www.usagentleads.com/api/v1/agents?state=CA&pageSize=50" | jq .`}</CodeBlock>

            <SectionAnchorH3 id="example-javascript">JavaScript / TypeScript</SectionAnchorH3>
            <CodeBlock title="Fetch agents with error handling" lang="JavaScript">{`async function getAgents({ state, search, page = 1, pageSize = 25 }) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (state) params.set("state", state);
  if (search) params.set("search", search);

  const res = await fetch(
    \`https://www.usagentleads.com/api/v1/agents?\${params}\`,
    { headers: { "X-API-Key": process.env.USAGENTLEADS_API_KEY } }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || \`HTTP \${res.status}\`);
  }

  return res.json();
}

// Usage
const { data, count, totalPages, quota } = await getAgents({ state: "TX" });
console.log(\`Found \${count} agents (\${quota.used}/\${quota.limit} quota used)\`);`}</CodeBlock>

            <SectionAnchorH3 id="example-python">Python</SectionAnchorH3>
            <CodeBlock title="Paginate through all agents in a state" lang="Python">{`import requests
import os

API_KEY = os.environ["USAGENTLEADS_API_KEY"]
BASE_URL = "https://www.usagentleads.com/api/v1/agents"

def get_all_agents(state: str):
    agents = []
    page = 1

    while True:
        res = requests.get(
            BASE_URL,
            params={"state": state, "page": page, "pageSize": 100},
            headers={"X-API-Key": API_KEY},
        )
        res.raise_for_status()
        data = res.json()

        agents.extend(data["data"])
        if page >= data["totalPages"]:
            break
        page += 1

    return agents

# Fetch all California agents
ca_agents = get_all_agents("CA")
print(f"Fetched {len(ca_agents)} California agents")`}</CodeBlock>

            {/* ========== API KEYS ========== */}
            <SectionAnchor id="api-keys">Managing API Keys</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              API keys are managed from your{" "}
              <Link
                href="/dashboard/api-keys"
                className="text-accent font-medium hover:underline"
              >
                dashboard
              </Link>
              . You can create up to 3 active keys per account.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-light shrink-0">
                  <Key size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-ink mb-0.5">Create a key</p>
                  <p className="text-[14px] text-body">
                    Go to Dashboard &rarr; API Keys &rarr; New Key. Copy the key immediately — it
                    is shown only once.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-light shrink-0">
                  <Shield size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-ink mb-0.5">Revoke a key</p>
                  <p className="text-[14px] text-body">
                    Click the trash icon next to any key. Revocation is instant and permanent —
                    any request using the revoked key will receive a 401.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-light shrink-0">
                  <BarChart3 size={14} className="text-accent" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-ink mb-0.5">Monitor usage</p>
                  <p className="text-[14px] text-body">
                    The API Keys page shows a live usage bar, daily breakdown, and last-used
                    timestamps for each key.
                  </p>
                </div>
              </div>
            </div>

            {/* ========== SECURITY ========== */}
            <SectionAnchor id="security">Security</SectionAnchor>
            <p className="text-[15px] text-body leading-relaxed mb-4">
              We take API security seriously. Here&apos;s how your keys and data are
              protected:
            </p>
            <ul className="space-y-2.5 mb-6">
              {[
                "API keys are SHA-256 hashed before storage — we never store plaintext keys",
                "All traffic is encrypted via HTTPS (TLS 1.2+)",
                "Keys are scoped to your account — you can only access your own subscription data",
                "Revoked keys are rejected immediately at the authentication layer",
                "Per-key rate limiting prevents abuse (60 requests/minute)",
                "Row-level security (RLS) enforced at the database level",
                "Input validation on all query parameters (state codes, search terms, pagination)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-body">
                  <CheckCircle2
                    size={16}
                    className="text-success shrink-0 mt-0.5"
                  />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-16 p-8 rounded-xl bg-accent-light/50 border border-accent/10 text-center">
              <h3 className="text-[18px] font-semibold text-ink mb-2">
                Ready to get started?
              </h3>
              <p className="text-[15px] text-body mb-6 max-w-lg mx-auto">
                Subscribe to the Pro API plan, create your first API key, and start
                querying {countLabel} agents in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/pricing" className="btn-primary text-[15px] px-6 py-3">
                  Get Pro API — $79/mo <ArrowRight size={14} />
                </Link>
                <Link
                  href="/dashboard/api-keys"
                  className="btn-outline text-[15px] px-6 py-3"
                >
                  Go to API Keys
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
