export interface AgentOutreachCampaignInputs {
  /** Email records currently available across the selected markets. */
  marketEmailRecords: number
  /** Unique email contacts the campaign will attempt to reach. */
  plannedContacts: number
  /** One to six planned messages per unique contact. */
  touchesPerContact: number
  /** New customers, recruits, or partners the visitor wants to win. */
  targetWins: number
  /** Planned daily sending capacity, across all sending infrastructure. */
  dailySendCapacity: number
  /** Assumed share of messages that are delivered. */
  deliveryRate: number
  /** Assumed share of delivered messages that receive a positive reply. */
  positiveReplyRate: number
  /** Assumed share of positive replies that become qualified conversations. */
  qualifiedConversationRate: number
  /** Assumed share of qualified conversations that become a win. */
  winRate: number
  /** Estimated first-year contribution or gross profit for one win. */
  valuePerWin: number
  /** Total campaign cost, including data, tools, and team time if desired. */
  campaignCost: number
}

export interface AgentOutreachCampaignResults {
  marketEmailRecords: number
  plannedContacts: number
  plannedContactsWereCapped: boolean
  touchesPerContact: number
  totalPlannedMessages: number
  marketCoverage: number
  deliveredMessages: number
  positiveReplies: number
  qualifiedConversations: number
  modeledWins: number
  modeledContribution: number
  estimatedNetContribution: number
  estimatedRoi: number | null
  estimatedCostPerPositiveReply: number | null
  estimatedCostPerQualifiedConversation: number | null
  estimatedCostPerWin: number | null
  campaignDays: number | null
  contactsNeededForGoal: number | null
  messagesNeededForGoal: number | null
  daysNeededForGoal: number | null
  campaignWavesNeededForGoal: number | null
  goalMarketCoverage: number | null
  goalFitsSelectedMarkets: boolean | null
  breakEvenWins: number | null
  breakEvenContacts: number | null
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function wholeNumber(value: number): number {
  return Math.round(nonNegative(value))
}

function percentageAsFraction(value: number): number {
  return Math.min(100, nonNegative(value)) / 100
}

/**
 * Produces a planning estimate from visitor-entered assumptions. This module
 * deliberately contains no performance benchmarks: callers decide the rates.
 */
export function calculateAgentOutreachCampaign(
  inputs: AgentOutreachCampaignInputs
): AgentOutreachCampaignResults {
  const marketEmailRecords = wholeNumber(inputs.marketEmailRecords)
  const requestedPlannedContacts = wholeNumber(inputs.plannedContacts)
  const plannedContacts = Math.min(requestedPlannedContacts, marketEmailRecords)
  const touchesPerContact = Math.min(6, Math.max(1, wholeNumber(inputs.touchesPerContact)))
  const targetWins = wholeNumber(inputs.targetWins)
  const dailySendCapacity = wholeNumber(inputs.dailySendCapacity)
  const deliveryRate = percentageAsFraction(inputs.deliveryRate)
  const positiveReplyRate = percentageAsFraction(inputs.positiveReplyRate)
  const qualifiedConversationRate = percentageAsFraction(inputs.qualifiedConversationRate)
  const winRate = percentageAsFraction(inputs.winRate)
  const valuePerWin = nonNegative(inputs.valuePerWin)
  const campaignCost = nonNegative(inputs.campaignCost)

  const totalPlannedMessages = plannedContacts * touchesPerContact
  const deliveredMessages = plannedContacts * deliveryRate
  const positiveReplies = deliveredMessages * positiveReplyRate
  const qualifiedConversations = positiveReplies * qualifiedConversationRate
  const modeledWins = qualifiedConversations * winRate
  const modeledContribution = modeledWins * valuePerWin
  const estimatedNetContribution = modeledContribution - campaignCost
  const estimatedRoi = campaignCost > 0 ? (estimatedNetContribution / campaignCost) * 100 : null
  const estimatedCostPerPositiveReply = positiveReplies > 0 ? campaignCost / positiveReplies : null
  const estimatedCostPerQualifiedConversation =
    qualifiedConversations > 0 ? campaignCost / qualifiedConversations : null
  const estimatedCostPerWin = modeledWins > 0 ? campaignCost / modeledWins : null
  const campaignDays = dailySendCapacity > 0 ? Math.ceil(totalPlannedMessages / dailySendCapacity) : null

  const endToEndConversion = deliveryRate * positiveReplyRate * qualifiedConversationRate * winRate
  const contactsNeededForGoal =
    endToEndConversion > 0 ? Math.ceil(targetWins / endToEndConversion) : null
  const messagesNeededForGoal =
    contactsNeededForGoal !== null ? contactsNeededForGoal * touchesPerContact : null
  const daysNeededForGoal =
    messagesNeededForGoal !== null && dailySendCapacity > 0
      ? Math.ceil(messagesNeededForGoal / dailySendCapacity)
      : null
  const campaignWavesNeededForGoal =
    contactsNeededForGoal !== null && plannedContacts > 0
      ? Math.ceil(contactsNeededForGoal / plannedContacts)
      : null
  const goalMarketCoverage =
    contactsNeededForGoal !== null && marketEmailRecords > 0
      ? (contactsNeededForGoal / marketEmailRecords) * 100
      : null
  const breakEvenWins = valuePerWin > 0 ? Math.ceil(campaignCost / valuePerWin) : null
  const breakEvenContacts =
    valuePerWin > 0 && endToEndConversion > 0
      ? Math.ceil(campaignCost / (valuePerWin * endToEndConversion))
      : null

  return {
    marketEmailRecords,
    plannedContacts,
    plannedContactsWereCapped: requestedPlannedContacts > plannedContacts,
    touchesPerContact,
    totalPlannedMessages,
    marketCoverage: marketEmailRecords > 0 ? (plannedContacts / marketEmailRecords) * 100 : 0,
    deliveredMessages,
    positiveReplies,
    qualifiedConversations,
    modeledWins,
    modeledContribution,
    estimatedNetContribution,
    estimatedRoi,
    estimatedCostPerPositiveReply,
    estimatedCostPerQualifiedConversation,
    estimatedCostPerWin,
    campaignDays,
    contactsNeededForGoal,
    messagesNeededForGoal,
    daysNeededForGoal,
    campaignWavesNeededForGoal,
    goalMarketCoverage,
    goalFitsSelectedMarkets:
      goalMarketCoverage === null
        ? null
        : contactsNeededForGoal !== null && contactsNeededForGoal <= marketEmailRecords,
    breakEvenWins,
    breakEvenContacts,
  }
}
