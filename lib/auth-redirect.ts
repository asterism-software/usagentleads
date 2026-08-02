export const DEFAULT_AUTH_RETURN_PATH = "/dashboard"

const authRedirectBase = new URL("https://auth.local")

/**
 * Keep post-auth redirects on this application and normalize unusual URL input.
 */
export function sanitizeAuthReturnPath(
  path: string | null | undefined
): string {
  if (!path?.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_AUTH_RETURN_PATH
  }

  try {
    const url = new URL(path, authRedirectBase)
    if (url.origin !== authRedirectBase.origin) {
      return DEFAULT_AUTH_RETURN_PATH
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return DEFAULT_AUTH_RETURN_PATH
  }
}

export function buildAuthCallbackUrl(
  origin: string,
  returnPath: string | null | undefined
): string {
  const callbackUrl = new URL("/auth/callback", origin)
  callbackUrl.searchParams.set("next", sanitizeAuthReturnPath(returnPath))
  return callbackUrl.toString()
}
