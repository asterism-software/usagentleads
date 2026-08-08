export type SubjectLineSignalTone = "ready" | "review" | "note"

export interface SubjectLineSignal {
  tone: SubjectLineSignalTone
  title: string
  detail: string
}

export interface SubjectLineAnalysis {
  subjectCharacters: number
  previewCharacters: number
  compactSubjectPreview: string
  compactPreviewText: string
  hasPersonalizationToken: boolean
  signals: SubjectLineSignal[]
}

const TOKEN_PATTERN = /\{\{[^}]+\}\}|\[\[[^\]]+\]\]|%[A-Z][A-Z0-9_]*%/g
const TONE_WORDS = /\b(free|guaranteed|urgent|act now|limited time)\b/i

function characters(value: string): string[] {
  return Array.from(value.trim())
}

function truncateForPreview(value: string, maxCharacters: number): string {
  const valueCharacters = characters(value)
  if (valueCharacters.length <= maxCharacters) return valueCharacters.join("")
  return `${valueCharacters.slice(0, Math.max(0, maxCharacters - 1)).join("")}…`
}

/** Provides editing prompts only—not a deliverability, spam, or open-rate score. */
export function analyzeSubjectLine(subject: string, previewText: string): SubjectLineAnalysis {
  const trimmedSubject = subject.trim()
  const trimmedPreview = previewText.trim()
  const subjectCharacters = characters(trimmedSubject).length
  const previewCharacters = characters(trimmedPreview).length
  const tokenMatches = trimmedSubject.match(TOKEN_PATTERN) ?? []
  const hasAllCapsWord = /\b[A-Z]{4,}\b/.test(trimmedSubject)
  const hasRepeatedPunctuation = /[!?]{2,}/.test(trimmedSubject)
  const signals: SubjectLineSignal[] = []

  if (!trimmedSubject) {
    signals.push({
      tone: "note",
      title: "Add a subject line to review it",
      detail: "Use a specific, plain-language subject that matches the email you plan to send.",
    })
  } else {
    if (subjectCharacters < 18) {
      signals.push({
        tone: "note",
        title: "Short subject line",
        detail: "Short can be useful, but make sure the recipient can still understand the relevance without opening the email.",
      })
    } else if (subjectCharacters > 60) {
      signals.push({
        tone: "review",
        title: "May truncate in some inboxes",
        detail: "Subject visibility varies by device and inbox. Put the clearest idea near the beginning and review the compact preview below.",
      })
    } else {
      signals.push({
        tone: "ready",
        title: "Compact length",
        detail: "The subject is within a compact editing range. Inbox displays still vary by device and recipient settings.",
      })
    }

    if (tokenMatches.length > 0) {
      signals.push({
        tone: "review",
        title: "Personalization token detected",
        detail: `Confirm ${tokenMatches.map((token) => `“${token}”`).join(", ")} resolves for every recipient before you schedule the campaign.`,
      })
    }
    if (hasAllCapsWord || hasRepeatedPunctuation) {
      signals.push({
        tone: "review",
        title: "Emphasis worth reviewing",
        detail: "All caps or repeated punctuation can make a business message harder to scan. Use only if it accurately reflects the message.",
      })
    }
    if (TONE_WORDS.test(trimmedSubject)) {
      signals.push({
        tone: "note",
        title: "Claim and urgency check",
        detail: "Make sure urgency or promotional wording is truthful, specific, and consistent with the body of the email.",
      })
    }
  }

  if (trimmedPreview && previewCharacters > 110) {
    signals.push({
      tone: "note",
      title: "Long preview text",
      detail: "Keep the opening sentence useful on its own; preview text can be cut off differently across inboxes.",
    })
  }
  if (!trimmedPreview && trimmedSubject) {
    signals.push({
      tone: "note",
      title: "Preview text is blank",
      detail: "Add a short opening or intentional preview text so the message has context beyond the subject line.",
    })
  }

  return {
    subjectCharacters,
    previewCharacters,
    compactSubjectPreview: truncateForPreview(trimmedSubject, 38),
    compactPreviewText: truncateForPreview(trimmedPreview, 72),
    hasPersonalizationToken: tokenMatches.length > 0,
    signals,
  }
}
