import { describe, expect, it } from "vitest"
import { calculateAgentOutreachCampaign } from "@/lib/calculators/agentOutreachCampaign"

describe("calculateAgentOutreachCampaign", () => {
  it("models the full outreach funnel and goal plan from supplied assumptions", () => {
    const result = calculateAgentOutreachCampaign({
      marketEmailRecords: 10_000,
      plannedContacts: 1_000,
      touchesPerContact: 2,
      targetWins: 10,
      dailySendCapacity: 100,
      deliveryRate: 100,
      positiveReplyRate: 10,
      qualifiedConversationRate: 50,
      winRate: 20,
      valuePerWin: 500,
      campaignCost: 100,
    })

    expect(result).toMatchObject({
      plannedContacts: 1_000,
      touchesPerContact: 2,
      totalPlannedMessages: 2_000,
      marketCoverage: 10,
      deliveredMessages: 1_000,
      positiveReplies: 100,
      qualifiedConversations: 50,
      modeledWins: 10,
      modeledContribution: 5_000,
      estimatedNetContribution: 4_900,
      estimatedRoi: 4_900,
      estimatedCostPerPositiveReply: 1,
      estimatedCostPerQualifiedConversation: 2,
      estimatedCostPerWin: 10,
      campaignDays: 20,
      contactsNeededForGoal: 1_000,
      messagesNeededForGoal: 2_000,
      daysNeededForGoal: 20,
      campaignWavesNeededForGoal: 1,
      goalMarketCoverage: 10,
      goalFitsSelectedMarkets: true,
      breakEvenWins: 1,
      breakEvenContacts: 20,
    })
  })

  it("caps an oversized campaign to the available selected-market coverage", () => {
    const result = calculateAgentOutreachCampaign({
      marketEmailRecords: 200,
      plannedContacts: 500,
      touchesPerContact: 1,
      targetWins: 3,
      dailySendCapacity: 50,
      deliveryRate: 100,
      positiveReplyRate: 10,
      qualifiedConversationRate: 50,
      winRate: 20,
      valuePerWin: 500,
      campaignCost: 100,
    })

    expect(result.plannedContacts).toBe(200)
    expect(result.plannedContactsWereCapped).toBe(true)
    expect(result.marketCoverage).toBe(100)
    expect(result.goalFitsSelectedMarkets).toBe(false)
  })

  it("handles unusable rates and zero cost without infinity or NaN", () => {
    const result = calculateAgentOutreachCampaign({
      marketEmailRecords: 1_000,
      plannedContacts: 250,
      touchesPerContact: 1,
      targetWins: 5,
      dailySendCapacity: 0,
      deliveryRate: 0,
      positiveReplyRate: 5,
      qualifiedConversationRate: 25,
      winRate: 25,
      valuePerWin: 2_000,
      campaignCost: 0,
    })

    expect(result.modeledWins).toBe(0)
    expect(result.estimatedRoi).toBeNull()
    expect(result.estimatedCostPerWin).toBeNull()
    expect(result.campaignDays).toBeNull()
    expect(result.contactsNeededForGoal).toBeNull()
    expect(result.daysNeededForGoal).toBeNull()
  })
})
