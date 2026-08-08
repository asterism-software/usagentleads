export type ColdEmailComplianceFindingStatus =
  | "needs_attention"
  | "manual_review"
  | "detected"
  | "not_checked"

export interface ColdEmailComplianceInput {
  subject: string
  body: string
  footer: string
}

export interface ColdEmailComplianceFinding {
  id: string
  status: ColdEmailComplianceFindingStatus
  title: string
  detail: string
}

export interface ColdEmailComplianceAnalysis {
  findings: ColdEmailComplianceFinding[]
  needsAttentionCount: number
  manualReviewCount: number
  detectedCount: number
}

const POSTAL_BOX_PATTERN =
  /\b(?:p(?:ost)?\.?\s*o(?:ffice)?\.?\s*box|pmb|private mailbox)\s*#?\s*\d{1,10}\b/i

const STREET_ADDRESS_PATTERN =
  /\b\d{1,6}[a-z]?\s+(?:[a-z0-9.'#-]+\s+){0,7}(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|parkway|pkwy\.?|place|pl\.?|way|terrace|ter\.?|circle|cir\.?|highway|hwy\.?)\b/i

const OPT_OUT_PATTERN =
  /\b(?:unsubscribe|opt[\s-]?out|stop receiving|remove me|manage (?:my )?(?:email )?preferences|do not email)\b/i

const COMMERCIAL_DISCLOSURE_PATTERN =
  /\b(?:advertisement|advertising|promotional (?:email|message)|marketing (?:email|message)|this email is (?:an )?(?:advertisement|promotional))\b/i

const MERGE_TAG_PATTERN = /(?:\{\{[^}]{1,80}\}\}|\[\[[^\]]{1,80}\]\]|<%=?[^%]{1,80}%>|%[a-z][a-z0-9_]*%)/i

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function hasLikelyPostalAddress(value: string): boolean {
  return POSTAL_BOX_PATTERN.test(value) || STREET_ADDRESS_PATTERN.test(value)
}

function hasUnresolvedMergeTags(value: string): boolean {
  return MERGE_TAG_PATTERN.test(value)
}

/**
 * Checks pasted copy for common, text-level CAN-SPAM review points. It does
 * not inspect mail headers, sender identity, a real unsubscribe mechanism, or
 * legal applicability, so callers must never treat this as certification.
 */
export function analyzeColdEmailCompliance(
  input: ColdEmailComplianceInput
): ColdEmailComplianceAnalysis {
  const subject = plainText(input.subject)
  const body = plainText(input.body)
  const footer = plainText(input.footer)
  const allMessageText = `${body}\n${footer}`.trim()
  const findings: ColdEmailComplianceFinding[] = []

  if (!subject) {
    findings.push({
      id: "subject-missing",
      status: "needs_attention",
      title: "No subject line was provided",
      detail:
        "Commercial-email subject lines should accurately reflect the message. Add the subject you plan to send, then review it against the final email manually.",
    })
  } else {
    findings.push({
      id: "subject-manual-review",
      status: "manual_review",
      title: "Subject line needs a manual accuracy review",
      detail:
        "The checker can see that a subject was provided, but it cannot determine whether it accurately reflects the final message or would be considered deceptive.",
    })
  }

  if (!body) {
    findings.push({
      id: "body-missing",
      status: "needs_attention",
      title: "No email body was provided",
      detail:
        "Paste the body you intend to send so you can review the visible disclosure, postal address, and opt-out language together.",
    })
  }

  if (!allMessageText) {
    findings.push({
      id: "message-content-missing",
      status: "needs_attention",
      title: "No message or footer copy was provided",
      detail:
        "The checker needs pasted email text before it can look for common CAN-SPAM review points.",
    })
  }

  if (allMessageText && hasLikelyPostalAddress(allMessageText)) {
    findings.push({
      id: "postal-address-detected",
      status: "detected",
      title: "Likely postal address detected",
      detail:
        "A street address or mailbox pattern appears in the pasted copy. Confirm it is a current, valid postal address in the final sent email.",
    })
  } else {
    findings.push({
      id: "postal-address-not-detected",
      status: "needs_attention",
      title: "No likely postal address detected",
      detail:
        "Commercial email generally needs a valid physical postal address. Add and manually verify your street address, registered post-office box, or eligible private mailbox.",
    })
  }

  if (allMessageText && OPT_OUT_PATTERN.test(allMessageText)) {
    findings.push({
      id: "opt-out-language-detected",
      status: "detected",
      title: "Opt-out wording detected",
      detail:
        "Visible opt-out language appears in the pasted copy. Confirm the final mechanism is clear, works, and is honored as required.",
    })
  } else {
    findings.push({
      id: "opt-out-language-not-detected",
      status: "needs_attention",
      title: "No visible opt-out wording detected",
      detail:
        "Add a clear way for recipients to ask not to receive future commercial email, then test the final mechanism before sending.",
    })
  }

  if (allMessageText && COMMERCIAL_DISCLOSURE_PATTERN.test(allMessageText)) {
    findings.push({
      id: "commercial-disclosure-detected",
      status: "detected",
      title: "Commercial-message disclosure phrase detected",
      detail:
        "The pasted copy includes language such as “advertisement” or “promotional message.” Confirm the disclosure is clear and conspicuous in the final email.",
    })
  } else {
    findings.push({
      id: "commercial-disclosure-manual-review",
      status: "manual_review",
      title: "Commercial-message disclosure needs review",
      detail:
        "No common disclosure phrase was detected. Review whether the final email clearly and conspicuously identifies itself as an advertisement or solicitation where required.",
    })
  }

  if (!footer) {
    findings.push({
      id: "separate-footer-not-provided",
      status: "not_checked",
      title: "No separate footer was provided",
      detail:
        "That is not necessarily a problem: the checker reviewed the body for address and opt-out language. Add the actual footer if it contains additional sent-email copy.",
    })
  }

  if (hasUnresolvedMergeTags(`${subject}\n${body}\n${footer}`)) {
    findings.push({
      id: "merge-tags-detected",
      status: "needs_attention",
      title: "Possible unresolved merge tag detected",
      detail:
        "Replace placeholders before sending so recipients receive accurate sender and message information. Re-check the final rendered email afterward.",
    })
  }

  findings.push({
    id: "headers-not-checked",
    status: "not_checked",
    title: "Sender identity and headers are not checked",
    detail:
      "This browser-only review cannot inspect From, To, Reply-To, routing information, sender identity, or whether an unsubscribe link actually works. Review those items in your sending platform.",
  })

  return {
    findings,
    needsAttentionCount: findings.filter((finding) => finding.status === "needs_attention").length,
    manualReviewCount: findings.filter((finding) => finding.status === "manual_review").length,
    detectedCount: findings.filter((finding) => finding.status === "detected").length,
  }
}
