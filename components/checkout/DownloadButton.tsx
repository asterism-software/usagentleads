"use client"

import { FormEvent, useState } from "react"
import { Download, Loader2 } from "lucide-react"

type DownloadButtonProps = {
  token: string
  label: string
}

type DownloadResponse = {
  downloadUrl?: string
  error?: string
}

export default function DownloadButton({ token, label }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token }),
      })
      const result = (await response.json()) as DownloadResponse

      if (!response.ok || !result.downloadUrl) {
        throw new Error(result.error || "The download could not be prepared. Please try again.")
      }

      window.location.assign(result.downloadUrl)
      // Attachment navigation leaves this page open. Keep the processing state
      // visible long enough for the browser's download UI to appear.
      window.setTimeout(() => setIsLoading(false), 2_000)
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "The download could not be prepared. Please try again."
      )
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={startDownload} className="mt-7">
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full justify-center py-3.5 text-[15px] disabled:cursor-wait disabled:opacity-75"
      >
        {isLoading ? (
          <>
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            Preparing download…
          </>
        ) : (
          <>
            <Download size={17} aria-hidden="true" />
            {label}
          </>
        )}
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-center text-[13px] leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </form>
  )
}
