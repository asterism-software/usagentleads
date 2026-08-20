import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  CheckCircle,
  Clock3,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { getDownloadAccess } from "@/lib/downloads/access"
import { getStateByCode } from "@/lib/utils/states"
import DownloadButton from "@/components/checkout/DownloadButton"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Download your data",
  description: "Securely download your USAgentLeads purchase.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

type DownloadPageProps = {
  searchParams: Promise<{
    token?: string
    status?: string
  }>
}

const transientMessages: Record<string, string> = {
  storage_error:
    "The file service was temporarily unavailable. Your download allowance was not used; please try again.",
  claim_conflict:
    "Another download request was processed at the same time. Please try again.",
}

export default async function DownloadPage({ searchParams }: DownloadPageProps) {
  const { token, status: requestStatus } = await searchParams
  const access = await getDownloadAccess(token)
  const purchase = access.purchase
  const state = purchase?.state_code ? getStateByCode(purchase.state_code) : undefined
  const productName =
    purchase?.purchase_type === "full_database"
      ? "Full U.S. real estate agent database"
      : state
        ? `${state.name} real estate agent list`
        : "Real estate agent data"
  const expiresAt = purchase?.expires_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(purchase.expires_at))
    : null
  const transientMessage = requestStatus ? transientMessages[requestStatus] : undefined

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-16">
      <div className="w-full max-w-xl">
        <section className="card overflow-hidden">
          <div className="border-b border-border px-7 py-6 sm:px-10">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="USAgentLeads home">
              <Image src="/icon-192.png" width="36" height="36" alt="" className="rounded-lg" />
              <span className="text-[18px] font-semibold text-ink">USAgentLeads</span>
            </Link>
          </div>

          <div className="px-7 py-9 sm:px-10 sm:py-11">
            {access.status === "available" && token && purchase ? (
              <>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-success/20 bg-success-bg">
                  <CheckCircle className="h-7 w-7 text-success" />
                </div>
                <p className="label-eyebrow mb-2">Secure download</p>
                <h1 className="text-[28px] font-semibold tracking-tight text-ink">
                  Your data is ready
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-body">
                  Pressing the button creates a fresh, short-lived file link. Merely opening this page does not use a download.
                </p>

                {transientMessage ? (
                  <div className="mt-6 flex gap-3 rounded-xl border border-warning/20 bg-warning-bg p-4 text-[14px] leading-relaxed text-body">
                    <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <p>{transientMessage}</p>
                  </div>
                ) : null}

                <dl className="mt-7 overflow-hidden rounded-xl border border-border bg-subtle">
                  <div className="flex gap-4 border-b border-border px-4 py-4">
                    <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <dt className="text-[12px] font-medium uppercase tracking-wide text-tertiary">Product</dt>
                      <dd className="mt-1 text-[14px] font-medium text-ink">{productName}</dd>
                    </div>
                  </div>
                  <div className="px-4 py-4 text-[13px] text-body">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-accent" />
                      {expiresAt ? `Available until ${expiresAt}` : "No scheduled expiration"}
                    </div>
                  </div>
                </dl>

                <DownloadButton
                  token={token}
                  label={`Download ${purchase.purchase_type === "full_database" ? "database files" : "CSV file"}`}
                />

                <p className="mt-4 flex items-center justify-center gap-2 text-center text-[12px] text-tertiary">
                  <ShieldCheck className="h-4 w-4" />
                  The generated file link is private and expires automatically.
                </p>
              </>
            ) : (
              <UnavailableState status={access.status} token={token} />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function UnavailableState({ status, token }: { status: string; token?: string }) {
  const content =
    status === "pending"
      ? {
          title: "Your download is being prepared",
          body: "Payment processing can take a moment. Refresh this page shortly or use the link in your fulfillment email.",
        }
      : status === "expired"
        ? {
            title: "This download link expired",
            body: "Reply to your fulfillment email or contact support and we’ll send a refreshed link after verifying the purchase.",
          }
        : status === "limit_reached"
          ? {
              title: "Download allowance reached",
              body: "Your file has been authorized the maximum number of times. Contact support if an interrupted transfer prevented you from receiving it.",
            }
          : {
              title: "This download link is not valid",
              body: "Check that the complete link was copied from your fulfillment email. If it still does not open, contact support.",
            }

  return (
    <div>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-warning/20 bg-warning-bg">
        <AlertCircle className="h-7 w-7 text-warning" />
      </div>
      <p className="label-eyebrow mb-2">Download assistance</p>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">{content.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-body">{content.body}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {status === "pending" ? (
          <Link
            href={token ? `/download?token=${encodeURIComponent(token)}` : "/download"}
            className="btn-primary flex-1 justify-center"
          >
            <RefreshCw size={16} /> Refresh page
          </Link>
        ) : null}
        <Link href="/contact" className="btn-outline flex-1 justify-center">
          Contact support
        </Link>
        <Link href="/" className="btn-outline flex-1 justify-center">
          Back to home
        </Link>
      </div>
    </div>
  )
}
