import { describe, expect, it } from "vitest"
import { calculateAgentPartnershipValue } from "@/lib/calculators/agentPartnershipValue"

describe("calculateAgentPartnershipValue", () => {
  it("models introductions, qualified opportunities, wins, and contribution from supplied assumptions", () => {
    const result = calculateAgentPartnershipValue({
      prospectiveAgents: 1_000,
      introductionRate: 20,
      qualifiedOpportunityRate: 25,
      winRate: 10,
      grossProfitPerWin: 500,
      relationshipMarketingCost: 1_000,
    })

    expect(result).toMatchObject({
      prospectiveAgents: 1_000,
      introductions: 200,
      qualifiedOpportunities: 50,
      wins: 5,
      modeledContribution: 2_500,
      estimatedNetContribution: 1_500,
      estimatedRoi: 150,
      estimatedCostPerWin: 200,
    })
  })

  it("caps percentage inputs at 100 percent", () => {
    const result = calculateAgentPartnershipValue({
      prospectiveAgents: 10,
      introductionRate: 150,
      qualifiedOpportunityRate: 200,
      winRate: 125,
      grossProfitPerWin: 100,
      relationshipMarketingCost: 100,
    })

    expect(result.introductions).toBe(10)
    expect(result.qualifiedOpportunities).toBe(10)
    expect(result.wins).toBe(10)
    expect(result.modeledContribution).toBe(1_000)
  })

  it("handles negative or non-finite inputs without NaN or infinity", () => {
    const result = calculateAgentPartnershipValue({
      prospectiveAgents: Number.POSITIVE_INFINITY,
      introductionRate: 150,
      qualifiedOpportunityRate: -25,
      winRate: Number.NaN,
      grossProfitPerWin: -500,
      relationshipMarketingCost: -100,
    })

    expect(result).toEqual({
      prospectiveAgents: 0,
      introductions: 0,
      qualifiedOpportunities: 0,
      wins: 0,
      modeledContribution: 0,
      estimatedNetContribution: 0,
      estimatedRoi: null,
      estimatedCostPerWin: null,
    })
  })

  it("returns a usable zero cost per win but no ROI when marketing cost is zero", () => {
    const result = calculateAgentPartnershipValue({
      prospectiveAgents: 100,
      introductionRate: 10,
      qualifiedOpportunityRate: 50,
      winRate: 20,
      grossProfitPerWin: 1_000,
      relationshipMarketingCost: 0,
    })

    expect(result.wins).toBeCloseTo(1)
    expect(result.modeledContribution).toBeCloseTo(1_000)
    expect(result.estimatedNetContribution).toBeCloseTo(1_000)
    expect(result.estimatedRoi).toBeNull()
    expect(result.estimatedCostPerWin).toBe(0)
  })

  it("reports a negative ROI and no cost per win when the model yields no wins", () => {
    const result = calculateAgentPartnershipValue({
      prospectiveAgents: 100,
      introductionRate: 10,
      qualifiedOpportunityRate: 50,
      winRate: 0,
      grossProfitPerWin: 1_000,
      relationshipMarketingCost: 250,
    })

    expect(result.wins).toBe(0)
    expect(result.modeledContribution).toBe(0)
    expect(result.estimatedNetContribution).toBe(-250)
    expect(result.estimatedRoi).toBe(-100)
    expect(result.estimatedCostPerWin).toBeNull()
  })
})
