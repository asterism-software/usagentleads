import { deflateRawSync } from "node:zlib"

export const EXCEL_WORKSHEET_ROW_LIMIT = 1_048_576
export const EXCEL_SAFE_DATA_ROWS_PER_PART = 1_000_000
export const FULL_DATABASE_ZIP_PATH = "full/usa_agents_full.zip"
export const LEGACY_FULL_DATABASE_GZIP_PATH = "full/usa_agents_full.csv.gz"

const CSV_HEADER = "name,email,phone,state"
const ZIP_UTF8_FLAG = 0x0800
const ZIP_DEFLATE_METHOD = 8
const ZIP_VERSION = 20
const ZIP_DOS_DATE_1980_01_01 = 0x0021
const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit++) {
    value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0)
  }
  return value >>> 0
})

export interface CsvDocument {
  fileName: string
  csv: string
}

export interface CsvArchivePart {
  fileName: string
  dataRows: number
  uncompressedBytes: number
}

interface CompressedZipEntry {
  name: Buffer
  compressed: Buffer
  crc32: number
  uncompressedSize: number
}

class ZipBuilder {
  private readonly entries: CompressedZipEntry[] = []

  addFile(name: string, contents: string) {
    const input = Buffer.from(contents, "utf8")
    this.entries.push({
      name: Buffer.from(name, "utf8"),
      compressed: deflateRawSync(input),
      crc32: crc32(input),
      uncompressedSize: input.length,
    })
    return input.length
  }

  toBuffer(): Buffer {
    const localRecords: Buffer[] = []
    const centralRecords: Buffer[] = []
    let localOffset = 0

    for (const entry of this.entries) {
      const localHeader = Buffer.alloc(30)
      localHeader.writeUInt32LE(0x04034b50, 0)
      localHeader.writeUInt16LE(ZIP_VERSION, 4)
      localHeader.writeUInt16LE(ZIP_UTF8_FLAG, 6)
      localHeader.writeUInt16LE(ZIP_DEFLATE_METHOD, 8)
      localHeader.writeUInt16LE(0, 10)
      localHeader.writeUInt16LE(ZIP_DOS_DATE_1980_01_01, 12)
      localHeader.writeUInt32LE(entry.crc32, 14)
      localHeader.writeUInt32LE(entry.compressed.length, 18)
      localHeader.writeUInt32LE(entry.uncompressedSize, 22)
      localHeader.writeUInt16LE(entry.name.length, 26)
      localHeader.writeUInt16LE(0, 28)

      localRecords.push(localHeader, entry.name, entry.compressed)

      const centralHeader = Buffer.alloc(46)
      centralHeader.writeUInt32LE(0x02014b50, 0)
      centralHeader.writeUInt16LE(ZIP_VERSION, 4)
      centralHeader.writeUInt16LE(ZIP_VERSION, 6)
      centralHeader.writeUInt16LE(ZIP_UTF8_FLAG, 8)
      centralHeader.writeUInt16LE(ZIP_DEFLATE_METHOD, 10)
      centralHeader.writeUInt16LE(0, 12)
      centralHeader.writeUInt16LE(ZIP_DOS_DATE_1980_01_01, 14)
      centralHeader.writeUInt32LE(entry.crc32, 16)
      centralHeader.writeUInt32LE(entry.compressed.length, 20)
      centralHeader.writeUInt32LE(entry.uncompressedSize, 24)
      centralHeader.writeUInt16LE(entry.name.length, 28)
      centralHeader.writeUInt16LE(0, 30)
      centralHeader.writeUInt16LE(0, 32)
      centralHeader.writeUInt16LE(0, 34)
      centralHeader.writeUInt16LE(0, 36)
      centralHeader.writeUInt32LE(0, 38)
      centralHeader.writeUInt32LE(localOffset, 42)
      centralRecords.push(centralHeader, entry.name)

      localOffset += localHeader.length + entry.name.length + entry.compressed.length
    }

    const centralSize = centralRecords.reduce((size, record) => size + record.length, 0)
    const endRecord = Buffer.alloc(22)
    endRecord.writeUInt32LE(0x06054b50, 0)
    endRecord.writeUInt16LE(0, 4)
    endRecord.writeUInt16LE(0, 6)
    endRecord.writeUInt16LE(this.entries.length, 8)
    endRecord.writeUInt16LE(this.entries.length, 10)
    endRecord.writeUInt32LE(centralSize, 12)
    endRecord.writeUInt32LE(localOffset, 16)
    endRecord.writeUInt16LE(0, 20)

    return Buffer.concat([...localRecords, ...centralRecords, endRecord])
  }
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function* csvRecords(csv: string): Generator<string> {
  let recordStart = 0
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]
    if (char === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "\n" && !inQuotes) {
      const record = csv.slice(recordStart, i)
      yield record.endsWith("\r") ? record.slice(0, -1) : record
      recordStart = i + 1
    }
  }

  if (recordStart < csv.length) {
    const record = csv.slice(recordStart)
    yield record.endsWith("\r") ? record.slice(0, -1) : record
  }
}

export function buildExcelSafeCsvArchive(
  documents: Iterable<CsvDocument>,
  maxDataRowsPerPart = EXCEL_SAFE_DATA_ROWS_PER_PART
) {
  if (
    !Number.isInteger(maxDataRowsPerPart) ||
    maxDataRowsPerPart < 1 ||
    maxDataRowsPerPart >= EXCEL_WORKSHEET_ROW_LIMIT
  ) {
    throw new Error(
      `maxDataRowsPerPart must be an integer between 1 and ${EXCEL_WORKSHEET_ROW_LIMIT - 1}`
    )
  }

  const sourceDocuments = Array.from(documents)
  let totalRows = 0

  for (const document of sourceDocuments) {
    const records = csvRecords(document.csv)
    const header = records.next()
    if (header.done || header.value.replace(/^\uFEFF/, "") !== CSV_HEADER) {
      throw new Error(`Unexpected CSV header in ${document.fileName}`)
    }
    for (const record of records) {
      if (record) totalRows++
    }
  }

  const partCount = Math.max(1, Math.ceil(totalRows / maxDataRowsPerPart))
  const baseRowsPerPart = Math.floor(totalRows / partCount)
  const remainder = totalRows % partCount
  const targetRowsPerPart = Array.from(
    { length: partCount },
    (_, index) => baseRowsPerPart + (index < remainder ? 1 : 0)
  )

  const zip = new ZipBuilder()
  const parts: CsvArchivePart[] = []
  let currentPartRows = 0
  let currentChunks: string[] = []
  let rowBatch: string[] = []

  const flushBatch = () => {
    if (rowBatch.length === 0) return
    currentChunks.push(rowBatch.join("\n"))
    rowBatch = []
  }

  const flushPart = () => {
    if (currentPartRows === 0) return
    flushBatch()
    const fileName = `usa_agents_part_${String(parts.length + 1).padStart(3, "0")}.csv`
    const contents = `${CSV_HEADER}\n${currentChunks.join("\n")}\n`
    const uncompressedBytes = zip.addFile(fileName, contents)
    parts.push({ fileName, dataRows: currentPartRows, uncompressedBytes })
    currentPartRows = 0
    currentChunks = []
  }

  for (const document of sourceDocuments) {
    const records = csvRecords(document.csv)
    records.next() // Header was validated during the counting pass above.

    for (const record of records) {
      if (!record) continue
      rowBatch.push(record)
      currentPartRows++

      if (rowBatch.length === 10_000) flushBatch()
      if (currentPartRows === targetRowsPerPart[parts.length]) flushPart()
    }
  }

  flushPart()

  if (totalRows === 0) {
    const fileName = "usa_agents_part_001.csv"
    const contents = `${CSV_HEADER}\n`
    const uncompressedBytes = zip.addFile(fileName, contents)
    parts.push({ fileName, dataRows: 0, uncompressedBytes })
  }

  return {
    archive: zip.toBuffer(),
    parts,
    totalRows,
  }
}
