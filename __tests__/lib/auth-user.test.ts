import { describe, expect, it } from "vitest"

import { getUserAvatarUrl } from "@/lib/auth-user"

describe("getUserAvatarUrl", () => {
  it("uses the provider avatar URL when available", () => {
    expect(
      getUserAvatarUrl({
        avatar_url: "https://lh3.googleusercontent.com/a/example",
        picture: "https://example.com/fallback.jpg",
      })
    ).toBe("https://lh3.googleusercontent.com/a/example")
  })

  it("falls back to the standard OIDC picture field", () => {
    expect(
      getUserAvatarUrl({ picture: "https://example.com/avatar.jpg" })
    ).toBe("https://example.com/avatar.jpg")
  })

  it.each([
    null,
    undefined,
    {},
    { avatar_url: "" },
    { avatar_url: "not-a-url" },
    { avatar_url: "http://example.com/avatar.jpg" },
  ])("returns null when there is no safe avatar: %o", (metadata) => {
    expect(getUserAvatarUrl(metadata)).toBeNull()
  })
})
