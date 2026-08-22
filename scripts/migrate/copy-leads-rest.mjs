#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"

const EXPECTED_TARGET_PROJECT_REF = "vgbzldrsuxhzjxibyatw"
const DEFAULT_CHECKPOINT = "/tmp/usagentleads-rest-copy-checkpoint.json"
const DEFAULT_BATCH_SIZE = 500
const DEFAULT_DELAY_MS = 75
const MAX_RETRIES = 6
const ROW_COLUMNS = [
  "id",
  "email",
  "name",
  "email1_sent_at",
  "email2_sent_at",
  "email3_sent_at",
  "email4_sent_at",
  "email5_sent_at",
  "email6_sent_at",
  "email_status",
  "email_error",
  "email_message_id",
  "created_at",
  "updated_at",
  "replied",
  "state",
  "phone",
]
const TIMESTAMP_COLUMNS = new Set([
  "email1_sent_at",
  "email2_sent_at",
  "email3_sent_at",
  "email4_sent_at",
  "email5_sent_at",
  "email6_sent_at",
  "created_at",
  "updated_at",
])

function argument(name, fallback) {
  const prefix = `--${name}=`
  const value = process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length)
  return value ?? fallback
}

function positiveInteger(name, fallback, max) {
  const raw = argument(name, String(fallback))
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new Error(`--${name} must be an integer between 1 and ${max}`)
  }
  return value
}

const execute = process.argv.includes("--execute")
const verifyOnly = process.argv.includes("--verify-only")
const resetCheckpoint = process.argv.includes("--reset-checkpoint")
if (execute && verifyOnly) throw new Error("Use only one of --execute or --verify-only")
const batchSize = positiveInteger("batch-size", DEFAULT_BATCH_SIZE, 1000)
const delayMs = positiveInteger("delay-ms", DEFAULT_DELAY_MS, 60_000)
const maxBatchesRaw = argument("max-batches", "")
const maxBatches = maxBatchesRaw ? positiveInteger("max-batches", 1, 1_000_000) : null
const checkpointPath = argument("checkpoint", DEFAULT_CHECKPOINT)

const sourceUrl = process.env.LEADS_REST_URL?.replace(/\/$/, "")
const sourceKey = process.env.LEADS_REST_KEY
const targetUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
const targetKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!sourceUrl || !sourceKey || !targetUrl || !targetKey) {
  throw new Error(
    "LEADS_REST_URL, LEADS_REST_KEY, NEXT_PUBLIC_SUPABASE_URL, and " +
      "SUPABASE_SERVICE_ROLE_KEY are required"
  )
}

const sourceHost = new URL(sourceUrl).host
const targetHost = new URL(targetUrl).host
if (sourceHost === targetHost) throw new Error("Source and target hosts must differ")
if (!targetHost.startsWith(`${EXPECTED_TARGET_PROJECT_REF}.`)) {
  throw new Error(
    `Refusing target ${targetHost}; expected Supabase project ${EXPECTED_TARGET_PROJECT_REF}`
  )
}

function authHeaders(key, profile, write = false) {
  const headers = {
    apikey: key,
    [write ? "Content-Profile" : "Accept-Profile"]: profile,
  }
  // Legacy Supabase service-role keys and the self-hosted source use JWT auth.
  // Modern sb_secret_ keys authenticate through `apikey` and must not be sent as
  // a Bearer token.
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`
  return headers
}

const sourceHeaders = authHeaders(sourceKey, "usagentleads")
const targetReadHeaders = authHeaders(targetKey, "usagentleads")
const targetWriteHeaders = {
  ...authHeaders(targetKey, "usagentleads", true),
  "Content-Type": "application/json",
  Prefer: "resolution=ignore-duplicates,return=minimal",
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function request(url, init, label) {
  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(60_000),
      })
      if (response.ok) return response

      const body = (await response.text()).slice(0, 500)
      const retryable = response.status === 429 || response.status >= 500
      if (!retryable || attempt === MAX_RETRIES) {
        throw new Error(`${label} failed (${response.status}): ${body}`)
      }
      lastError = new Error(`${label} retryable response ${response.status}`)
    } catch (error) {
      lastError = error
      if (attempt === MAX_RETRIES) throw error
    }

    const backoff = Math.min(30_000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250)
    await wait(backoff)
  }
  throw lastError
}

async function exactCount(baseUrl, headers, filters = "") {
  const response = await request(
    `${baseUrl}/rest/v1/leads?select=id${filters}`,
    {
      method: "HEAD",
      headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
    },
    "exact count"
  )
  const contentRange = response.headers.get("content-range")
  const count = Number(contentRange?.split("/")[1])
  if (!Number.isSafeInteger(count)) {
    throw new Error(`Could not parse exact count from Content-Range: ${contentRange}`)
  }
  return count
}

async function boundary(baseUrl, headers, column, ascending) {
  const params = new URLSearchParams({
    select: column,
    order: `${column}.${ascending ? "asc" : "desc"}`,
    limit: "1",
  })
  const response = await request(
    `${baseUrl}/rest/v1/leads?${params}`,
    { headers },
    `${column} boundary`
  )
  const rows = await response.json()
  return rows[0]?.[column] ?? null
}

async function sourceBaseline() {
  const [rows, emails, phones, minCreatedAt, maxCreatedAt, minUpdatedAt, maxUpdatedAt] =
    await Promise.all([
      exactCount(sourceUrl, sourceHeaders),
      exactCount(sourceUrl, sourceHeaders, "&email=not.is.null"),
      exactCount(sourceUrl, sourceHeaders, "&phone=not.is.null"),
      boundary(sourceUrl, sourceHeaders, "created_at", true),
      boundary(sourceUrl, sourceHeaders, "created_at", false),
      boundary(sourceUrl, sourceHeaders, "updated_at", true),
      boundary(sourceUrl, sourceHeaders, "updated_at", false),
    ])

  return { rows, emails, phones, minCreatedAt, maxCreatedAt, minUpdatedAt, maxUpdatedAt }
}

async function targetCountOrNull() {
  try {
    return await exactCount(targetUrl, targetReadHeaders)
  } catch (error) {
    if (!execute) return null
    throw error
  }
}

async function readCheckpoint() {
  if (resetCheckpoint) return null
  try {
    return JSON.parse(await readFile(checkpointPath, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") return null
    throw error
  }
}

async function saveCheckpoint(checkpoint) {
  const temporaryPath = `${checkpointPath}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(checkpoint, null, 2)}\n`, { mode: 0o600 })
  await rename(temporaryPath, checkpointPath)
}

async function fetchBatch(lastId) {
  const params = new URLSearchParams({
    select: "*",
    order: "id.asc",
    limit: String(batchSize),
  })
  if (lastId) params.set("id", `gt.${lastId}`)

  const response = await request(
    `${sourceUrl}/rest/v1/leads?${params}`,
    { headers: sourceHeaders },
    "source batch"
  )
  return response.json()
}

async function fetchTargetBatch(previousLastId, nextLastId) {
  const params = new URLSearchParams({
    select: ROW_COLUMNS.join(","),
    order: "id.asc",
    limit: String(batchSize),
  })
  if (previousLastId) params.append("id", `gt.${previousLastId}`)
  params.append("id", `lte.${nextLastId}`)

  const response = await request(
    `${targetUrl}/rest/v1/leads?${params}`,
    { headers: targetReadHeaders },
    "target verification batch"
  )
  return response.json()
}

function rowDigest(rows) {
  const hash = createHash("sha256")
  for (const row of rows) {
    const normalized = ROW_COLUMNS.map((column) => {
      const value = row[column]
      if (value !== null && value !== undefined && TIMESTAMP_COLUMNS.has(column)) {
        return new Date(value).toISOString()
      }
      return value ?? null
    })
    hash.update(JSON.stringify(normalized))
    hash.update("\n")
  }
  return hash.digest("hex")
}

async function verifyBatch(sourceRows, previousLastId, nextLastId) {
  const targetRows = await fetchTargetBatch(previousLastId, nextLastId)
  if (targetRows.length !== sourceRows.length) {
    throw new Error(
      `Verification length mismatch at ${nextLastId}: source=${sourceRows.length}, target=${targetRows.length}`
    )
  }
  if (rowDigest(targetRows) !== rowDigest(sourceRows)) {
    throw new Error(`Verification digest mismatch at ${nextLastId}`)
  }
}

async function insertBatch(rows) {
  await request(
    `${targetUrl}/rest/v1/leads?on_conflict=id`,
    {
      method: "POST",
      headers: targetWriteHeaders,
      body: JSON.stringify(rows),
    },
    "target batch"
  )
}

console.log("Leads REST migration preflight")
console.log(`  source: ${sourceHost}`)
console.log(`  target: ${targetHost}`)
console.log(`  mode:   ${execute ? "EXECUTE" : verifyOnly ? "read-only verification" : "read-only preflight"}`)

const baseline = await sourceBaseline()
const initialTargetCount = await targetCountOrNull()
console.log(`  source rows:          ${baseline.rows.toLocaleString()}`)
console.log(`  source non-null email:${baseline.emails.toLocaleString()}`)
console.log(`  source non-null phone:${baseline.phones.toLocaleString()}`)
console.log(`  created_at range:     ${baseline.minCreatedAt} .. ${baseline.maxCreatedAt}`)
console.log(`  updated_at range:     ${baseline.minUpdatedAt} .. ${baseline.maxUpdatedAt}`)
console.log(
  `  target rows:          ${initialTargetCount === null ? "table not available" : initialTargetCount.toLocaleString()}`
)

if (!execute && !verifyOnly) {
  console.log("Preflight complete. Re-run with --execute only after applying the pre-load migration.")
  process.exit(0)
}

const checkpoint = await readCheckpoint()
if (verifyOnly && !checkpoint) throw new Error("--verify-only requires an existing checkpoint")
if (checkpoint && checkpoint.sourceHost !== sourceHost) {
  throw new Error(`Checkpoint belongs to a different source: ${checkpoint.sourceHost}`)
}
if (checkpoint && checkpoint.sourceRows !== baseline.rows) {
  throw new Error(
    `Source row count changed since checkpoint (${checkpoint.sourceRows} -> ${baseline.rows})`
  )
}
if (!checkpoint && initialTargetCount !== 0) {
  throw new Error(
    `Target is not empty (${initialTargetCount} rows) and no matching checkpoint exists; refusing to start`
  )
}

if (checkpoint && initialTargetCount !== checkpoint.copied) {
  throw new Error(
    `Target/checkpoint mismatch: target=${initialTargetCount}, checkpoint=${checkpoint.copied}`
  )
}

if (verifyOnly) {
  let verified = 0
  let verificationLastId = null
  while (verified < checkpoint.copied) {
    const rows = await fetchBatch(verificationLastId)
    if (rows.length === 0) throw new Error("Source ended before the checkpoint boundary")
    const nextLastId = rows.at(-1)?.id
    if (!nextLastId || nextLastId > checkpoint.lastId) {
      throw new Error("Checkpoint boundary does not align with the configured batch size")
    }
    await verifyBatch(rows, verificationLastId, nextLastId)
    verified += rows.length
    verificationLastId = nextLastId
    if (verified % (batchSize * 10) === 0 || verified === checkpoint.copied) {
      console.log(`  verified ${verified.toLocaleString()}/${checkpoint.copied.toLocaleString()} rows`)
    }
  }
  if (verificationLastId !== checkpoint.lastId) {
    throw new Error("Verification did not finish at the checkpoint last ID")
  }
  console.log("Checkpointed source and target rows match column-for-column.")
  process.exit(0)
}

let lastId = checkpoint?.lastId ?? null
let copied = checkpoint?.copied ?? 0
let batches = 0
const startedAt = checkpoint?.startedAt ?? new Date().toISOString()

while (true) {
  const previousLastId = lastId
  const rows = await fetchBatch(lastId)
  if (rows.length === 0) break

  const nextLastId = rows.at(-1)?.id
  if (!nextLastId || (lastId && nextLastId <= lastId)) {
    throw new Error("Source keyset order did not advance")
  }

  await insertBatch(rows)
  await verifyBatch(rows, previousLastId, nextLastId)
  copied += rows.length
  batches += 1
  lastId = nextLastId
  await saveCheckpoint({
    sourceHost,
    targetHost,
    sourceRows: baseline.rows,
    copied,
    lastId,
    startedAt,
    updatedAt: new Date().toISOString(),
  })

  if (batches % 10 === 0 || rows.length < batchSize) {
    const percent = ((copied / baseline.rows) * 100).toFixed(2)
    console.log(`  copied ${copied.toLocaleString()}/${baseline.rows.toLocaleString()} (${percent}%)`)
  }
  if (maxBatches && batches >= maxBatches) {
    console.log(`Stopped after --max-batches=${maxBatches}; resume with the same checkpoint.`)
    process.exit(0)
  }
  await wait(delayMs)
}

const finalTargetCount = await exactCount(targetUrl, targetReadHeaders)
if (finalTargetCount !== baseline.rows) {
  throw new Error(
    `Final count mismatch: source=${baseline.rows}, target=${finalTargetCount}`
  )
}

console.log(`Copy complete: ${finalTargetCount.toLocaleString()} rows on target.`)
console.log(`Checkpoint retained at ${checkpointPath} for the validation record.`)
