# Deliver the Full Database as Excel-safe CSV parts

**Date:** 2026-08-13

## Summary

Full Database purchases now download a ZIP archive containing as many numbered
CSV parts as needed to stay safely within Microsoft Excel's worksheet row limit.

## Root cause

The generated Full Database archive contained one CSV with 1,168,775 data rows.
Excel worksheets support at most 1,048,576 total rows, including the header, so
Excel displayed only the first 1,048,575 records. The cutoff occurred during
Texas, making Utah through Wyoming appear to be missing even though all 51
jurisdictions were present in the downloaded CSV.

This was an Excel display limit, not a laptop limitation or an incomplete data
export.

## Changes

- Build `full/usa_agents_full.zip` instead of a single oversized CSV gzip.
- Cap each numbered CSV at 1,000,000 data rows plus its own header, leaving
  48,575 rows of headroom below Excel's worksheet limit.
- Calculate the number of parts dynamically as the dataset grows rather than
  assuming that two files will always be sufficient.
- Distribute rows as evenly as possible across the calculated parts so files
  have comparable sizes instead of leaving a small final remainder file.
- Preserve quoted CSV records, including commas, escaped quotes, CRLF input, and
  embedded newlines, when a part boundary is created.
- Prefer the new ZIP in `/api/download`, with the previous gzip retained as a
  rollout fallback.
- Create the Storage URL before atomically consuming the one-time token, so a
  Storage failure no longer burns the customer's download link.
- Explain the multipart ZIP and Excel limit in Full Database delivery emails and
  clarify the delivery format on the pricing and FAQ pages.
- Update the weekly generation workflow and operator runbook for the new
  archive format.

## Current archive verification

- 1,168,775 data rows across 51 jurisdictions.
- Part 1: 584,388 data rows.
- Part 2: 584,387 data rows.
- Both parts include `name,email,phone,state` headers.
- ZIP integrity and CRC checks pass for both files.
- The verified 24,691,498-byte ZIP was uploaded to
  `agent-csvs/full/usa_agents_full.zip` alongside the legacy archive.

## Test coverage

- Dynamic creation of more than two parts under an injected test limit.
- Header repetition and preservation of multiline quoted CSV records.
- ZIP creation through the scheduled combine route.
- Full Database ZIP delivery, legacy fallback, and State Pack delivery.
- Token preservation when Storage cannot create a signed URL.
- Full Database and State Pack delivery-email format copy.

## Customer recovery

- Sent the affected buyer a replacement email with a fresh 48-hour signed link
  to the verified balanced two-part ZIP.
- Resend accepted the replacement message with provider ID
  `3e259ee4-5007-4380-8f38-9bcaf0ed916e`.

No database migration is required.
