import { describe, it, expect, vi } from "vitest"
import { cn, formatSize, generateUUID } from "~/lib/utils"

describe("formatSize", () => {
  it("returns '0 Bytes' for 0", () => {
    expect(formatSize(0)).toBe("0 Bytes")
  })

  it("formats bytes correctly", () => {
    expect(formatSize(500)).toBe("500 Bytes")
    expect(formatSize(1024)).toBe("1 KB")
    expect(formatSize(1048576)).toBe("1 MB")
    expect(formatSize(1073741824)).toBe("1 GB")
  })

  it("rounds to 2 decimal places", () => {
    expect(formatSize(1234)).toBe("1.21 KB")
  })
})

describe("generateUUID", () => {
  it("calls crypto.randomUUID and returns value", () => {
    const mockUUID = "123e4567-e89b-12d3-a456-426614174000"
    const spy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(mockUUID)

    expect(generateUUID()).toBe(mockUUID)
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })
})

describe("cn", () => {
  it("merges tailwind classes properly", () => {
    expect(cn("p-2", "m-2")).toBe("p-2 m-2")
  })

  it("removes conflicting classes", () => {
    // tailwind-merge will keep last conflicting class
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("handles conditional classes", () => {
    expect(cn("p-2", false && "hidden", "text-center")).toBe("p-2 text-center")
  })

  it("handles arrays and objects", () => {
    expect(cn("p-2", ["m-2", { "hidden": false, "block": true }])).toBe("p-2 m-2 block")
  })
})
