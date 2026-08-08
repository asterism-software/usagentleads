import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedCron } from "@/lib/utils/cronAuth"
import { US_STATES } from "@/lib/utils/states"
import { getAllPosts } from "@/lib/blog"

const INDEXNOW_KEY = process.env.INDEXNOW_KEY!
const HOST = "usagentleads.com"
const BASE_URL = `https://${HOST}`

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const urlList = [
    BASE_URL,
    `${BASE_URL}/pricing`,
    `${BASE_URL}/states`,
    `${BASE_URL}/tools`,
    `${BASE_URL}/tools/agent-outreach-campaign-planner`,
    `${BASE_URL}/tools/cold-email-compliance-checker`,
    `${BASE_URL}/tools/real-estate-email-subject-line-tester`,
    `${BASE_URL}/tools/email-domain-authentication-checker`,
    `${BASE_URL}/tools/brokerage-recruiting-roi-calculator`,
    `${BASE_URL}/tools/agent-partnership-value-calculator`,
    `${BASE_URL}/contact`,
    `${BASE_URL}/blog`,
    ...US_STATES.map((state) => `${BASE_URL}/states/${state.slug}`),
    ...getAllPosts().map((post) => `${BASE_URL}/blog/${post.slug}`),
  ]

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const keyLocation = `${BASE_URL}/${INDEXNOW_KEY}.txt`
  const results: { url: string; status: number }[] = []
  const failed: string[] = []

  for (const url of urlList) {
    const response = await fetch(
      `https://api.indexnow.org/IndexNow?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}&keyLocation=${encodeURIComponent(keyLocation)}`,
      { method: "GET" }
    )

    results.push({ url, status: response.status })
    if (!response.ok) {
      failed.push(url)
    }

    await delay(2000)
  }

  return NextResponse.json({
    success: failed.length === 0,
    urlsSubmitted: urlList.length,
    urlsFailed: failed.length,
    results,
  })
}
