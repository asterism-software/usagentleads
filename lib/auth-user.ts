type UserMetadata = Record<string, unknown> | null | undefined

/** Return a safe provider avatar URL when one is present in auth metadata. */
export function getUserAvatarUrl(metadata: UserMetadata): string | null {
  if (!metadata) return null

  for (const field of ["avatar_url", "picture"] as const) {
    const value = metadata[field]
    if (typeof value !== "string" || !value.trim()) continue

    try {
      const url = new URL(value)
      if (url.protocol === "https:") return url.toString()
    } catch {
      // Try the next supported metadata field.
    }
  }

  return null
}
