import { inflateRawSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import {
  buildExcelSafeCsvArchive,
  EXCEL_SAFE_DATA_ROWS_PER_PART,
  EXCEL_WORKSHEET_ROW_LIMIT,
} from "@/lib/csv/excel-safe-archive"

function extractLocalZipEntries(archive: Buffer) {
  const entries = new Map<string, string>()
  let offset = 0

  while (archive.readUInt32LE(offset) === 0x04034b50) {
    const method = archive.readUInt16LE(offset + 8)
    const compressedSize = archive.readUInt32LE(offset + 18)
    const nameLength = archive.readUInt16LE(offset + 26)
    const extraLength = archive.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLength + extraLength
    const name = archive.subarray(nameStart, nameStart + nameLength).toString("utf8")
    const compressed = archive.subarray(dataStart, dataStart + compressedSize)

    expect(method).toBe(8)
    entries.set(name, inflateRawSync(compressed).toString("utf8"))
    offset = dataStart + compressedSize
  }

  return entries
}

describe("buildExcelSafeCsvArchive", () => {
  it("creates as many numbered parts as needed and repeats the header", () => {
    const result = buildExcelSafeCsvArchive([
      {
        fileName: "TX.csv",
        csv: [
          "name,email,phone,state",
          '"Jane, Agent",jane@example.com,111,Texas',
          '"Line\nBreak",line@example.com,222,Texas',
          "Third,third@example.com,333,Texas",
          "Fourth,fourth@example.com,444,Texas",
        ].join("\n"),
      },
      {
        fileName: "WY.csv",
        csv: [
          "name,email,phone,state",
          "Fifth,fifth@example.com,555,Wyoming",
          "Sixth,sixth@example.com,666,Wyoming",
          "Seventh,seventh@example.com,777,Wyoming",
        ].join("\n"),
      },
    ], 3)

    expect(result.totalRows).toBe(7)
    expect(result.parts.map((part) => part.dataRows)).toEqual([3, 2, 2])
    expect(
      Math.max(...result.parts.map((part) => part.dataRows)) -
      Math.min(...result.parts.map((part) => part.dataRows))
    ).toBeLessThanOrEqual(1)
    expect(result.parts.map((part) => part.fileName)).toEqual([
      "usa_agents_part_001.csv",
      "usa_agents_part_002.csv",
      "usa_agents_part_003.csv",
    ])

    const entries = extractLocalZipEntries(result.archive)
    expect([...entries.keys()]).toEqual(result.parts.map((part) => part.fileName))
    for (const csv of entries.values()) {
      expect(csv.startsWith("name,email,phone,state\n")).toBe(true)
    }
    expect(entries.get("usa_agents_part_001.csv")).toContain('"Line\nBreak"')
    expect(entries.get("usa_agents_part_003.csv")).toContain(
      "Seventh,seventh@example.com,777,Wyoming"
    )
  })

  it("keeps the production part size below Excel's worksheet limit", () => {
    expect(EXCEL_SAFE_DATA_ROWS_PER_PART).toBe(1_000_000)
    expect(EXCEL_SAFE_DATA_ROWS_PER_PART + 1).toBeLessThan(EXCEL_WORKSHEET_ROW_LIMIT)
  })

  it("rejects unsafe row limits and unexpected source headers", () => {
    expect(() => buildExcelSafeCsvArchive([], EXCEL_WORKSHEET_ROW_LIMIT)).toThrow(
      "maxDataRowsPerPart"
    )
    expect(() => buildExcelSafeCsvArchive([
      { fileName: "bad.csv", csv: "wrong,header\nvalue,row" },
    ])).toThrow("Unexpected CSV header in bad.csv")
  })

  it("creates a valid header-only archive when no data rows exist", () => {
    const result = buildExcelSafeCsvArchive([
      { fileName: "empty.csv", csv: "name,email,phone,state\n" },
    ])
    const entries = extractLocalZipEntries(result.archive)

    expect(result.totalRows).toBe(0)
    expect(result.parts).toHaveLength(1)
    expect(entries.get("usa_agents_part_001.csv")).toBe("name,email,phone,state\n")
  })
})
