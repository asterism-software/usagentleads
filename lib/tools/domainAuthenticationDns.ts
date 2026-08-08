interface DnsJsonAnswer {
  type?: number
  data?: string
}

interface DnsJsonResponse {
  Status?: number
  Answer?: DnsJsonAnswer[]
}

interface DnsOverHttpsProvider {
  name: string
  url(name: string): string
}

const TXT_RECORD_TYPE = 16
const DEFAULT_TIMEOUT_MS = 2_500

const providers: DnsOverHttpsProvider[] = [
  {
    name: "Google Public DNS",
    url: (name) =>
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT&edns_client_subnet=0.0.0.0%2F0`,
  },
  {
    name: "Cloudflare DNS",
    url: (name) =>
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`,
  },
]

/** Decode the quoted, sometimes segmented presentation format used for TXT data. */
export function decodeDnsTxtData(data: string): string {
  const value = data.trim()
  if (!value.startsWith('"')) return value

  let output = ""
  let index = 0

  while (index < value.length) {
    while (/\s/.test(value[index] ?? "")) index += 1
    if (index >= value.length) break
    if (value[index] !== '"') return value
    index += 1

    let closed = false
    while (index < value.length) {
      const character = value[index]
      if (character === '"') {
        closed = true
        index += 1
        break
      }

      if (character === "\\") {
        const decimalEscape = value.slice(index + 1, index + 4)
        if (/^\d{3}$/.test(decimalEscape)) {
          output += String.fromCharCode(Number(decimalEscape))
          index += 4
          continue
        }

        const escapedCharacter = value[index + 1]
        if (escapedCharacter === undefined) return value
        output += escapedCharacter
        index += 2
        continue
      }

      output += character
      index += 1
    }

    if (!closed) return value
  }

  return output
}

async function queryProvider(
  provider: DnsOverHttpsProvider,
  name: string,
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<string[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(provider.url(name), {
      headers: { Accept: "application/dns-json" },
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`${provider.name} returned HTTP ${response.status}`)
    }

    const payload = (await response.json()) as DnsJsonResponse
    // NOERROR with no answers and NXDOMAIN are valid "record missing" results.
    if (payload.Status === 3) return []
    if (payload.Status !== 0) {
      throw new Error(`${provider.name} returned DNS status ${payload.Status ?? "unknown"}`)
    }

    return (payload.Answer ?? [])
      .filter((answer) => answer.type === TXT_RECORD_TYPE && typeof answer.data === "string")
      .map((answer) => decodeDnsTxtData(answer.data as string))
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Resolve public TXT records over HTTPS so the tool behaves consistently in
 * local development and serverless environments that restrict direct DNS.
 */
export async function readTxtRecordsOverHttps(
  name: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string[]> {
  const failures: string[] = []

  for (const provider of providers) {
    try {
      return await queryProvider(provider, name, fetchImpl, timeoutMs)
    } catch (error) {
      failures.push(error instanceof Error ? `${provider.name}: ${error.message}` : provider.name)
    }
  }

  throw new Error(`DNS-over-HTTPS lookup failed (${failures.join("; ")})`)
}
