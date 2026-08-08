export type AuthenticationStatus = "present" | "missing" | "attention"

export interface DomainAuthenticationAnalysis {
  domain: string
  spf: {
    status: AuthenticationStatus
    records: string[]
  }
  dmarc: {
    status: AuthenticationStatus
    records: string[]
    policy: "none" | "quarantine" | "reject" | null
  }
  dkim: {
    status: "not_checked"
    message: string
  }
}

/**
 * Accept only a normal public DNS name. The DNS route never follows URLs or
 * accepts hosts/IPs, which keeps this public lookup endpoint narrowly scoped.
 */
export function normalizeDomain(value: string): string | null {
  const domain = value.trim().toLowerCase().replace(/\.$/, "")
  if (!domain || domain.length > 253 || domain.includes("@")) return null

  const labels = domain.split(".")
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$|^[a-z0-9]$/.test(label))) {
    return null
  }

  const topLevelDomain = labels.at(-1) ?? ""
  if (!/[a-z]/.test(topLevelDomain) || domain === "localhost") return null
  return domain
}

function matchingRecords(records: string[], matcher: RegExp): string[] {
  return records.filter((record) => matcher.test(record.trim()))
}

function getDmarcPolicy(records: string[]): "none" | "quarantine" | "reject" | null {
  const record = records[0]
  if (!record) return null
  const policy = record.match(/(?:^|;)\s*p\s*=\s*(none|quarantine|reject)\s*(?:;|$)/i)?.[1]?.toLowerCase()
  return policy === "none" || policy === "quarantine" || policy === "reject" ? policy : null
}

/** Analyze public TXT records only; this is not a deliverability or compliance assessment. */
export function analyzeDomainAuthentication(
  domain: string,
  rootTxtRecords: string[],
  dmarcTxtRecords: string[]
): DomainAuthenticationAnalysis {
  const spfRecords = matchingRecords(rootTxtRecords, /^v=spf1(?:\s|$)/i)
  const dmarcRecords = matchingRecords(dmarcTxtRecords, /^v=dmarc1(?:\s*;|$)/i)
  const dmarcPolicy = getDmarcPolicy(dmarcRecords)

  return {
    domain,
    spf: {
      status: spfRecords.length === 0 ? "missing" : spfRecords.length === 1 ? "present" : "attention",
      records: spfRecords,
    },
    dmarc: {
      status:
        dmarcRecords.length === 0 || !dmarcPolicy
          ? "missing"
          : dmarcRecords.length === 1
            ? "present"
            : "attention",
      records: dmarcRecords,
      policy: dmarcPolicy,
    },
    dkim: {
      status: "not_checked",
      message:
        "DKIM records use a provider-specific selector. Confirm the selector and passing DKIM result in your sending platform or message headers.",
    },
  }
}
