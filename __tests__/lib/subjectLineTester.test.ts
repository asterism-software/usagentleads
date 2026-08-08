import { describe, expect, it } from "vitest"
import { analyzeSubjectLine } from "@/lib/tools/subjectLineTester"

describe("analyzeSubjectLine", () => {
  it("reports a compact subject and unresolved personalization token", () => {
    const result = analyzeSubjectLine("{{first_name}}, a quick idea for your team", "A useful resource for next week.")

    expect(result.subjectCharacters).toBe(42)
    expect(result.hasPersonalizationToken).toBe(true)
    expect(result.signals.some((signal) => signal.title === "Personalization token detected")).toBe(true)
  })

  it("adds editing prompts for long, emphatic subject lines without producing a spam score", () => {
    const result = analyzeSubjectLine("URGENT!!! A LIMITED TIME GUARANTEED OFFER FOR YOUR ENTIRE BROKERAGE TEAM", "")

    expect(result.signals.map((signal) => signal.title)).toEqual(expect.arrayContaining([
      "May truncate in some inboxes",
      "Emphasis worth reviewing",
      "Claim and urgency check",
      "Preview text is blank",
    ]))
    expect(result.compactSubjectPreview.endsWith("…")).toBe(true)
  })
})
