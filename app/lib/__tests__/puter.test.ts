import { describe, it, expect, beforeEach, vi } from "vitest"
import { getPuter } from "~/lib/puter"

describe("getPuter", () => {
  beforeEach(() => {
    // Reset window.puter before each test
    // @ts-expect-error – clear global
    delete window.puter
  })

  it("returns null if window.puter is undefined", () => {
    expect(getPuter()).toBeNull()
  })

  it("returns puter object if defined", () => {
    const fakePuter = {
      auth: {
        getUser: vi.fn(),
        isSignedIn: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
      },
      fs: {
        write: vi.fn(),
        read: vi.fn(),
        upload: vi.fn(),
        delete: vi.fn(),
        readdir: vi.fn(),
      },
      ai: {
        chat: vi.fn(),
        img2txt: vi.fn(),
      },
      kv: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        flush: vi.fn(),
      },
    }

    window.puter = fakePuter

    const result = getPuter()
    expect(result).toBe(fakePuter)
  })
})
