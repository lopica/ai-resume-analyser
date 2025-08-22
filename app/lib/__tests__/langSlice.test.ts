/**
 * Unit Tests: Language Redux Slice (langSlice)
 * 
 * Test Strategy:
 * This test suite validates the core Redux logic for language state management.
 * It's critical to test this thoroughly as it's the foundation of the entire i18n system.
 * 
 * Key Testing Areas:
 * 1. Initial State Validation:
 *    - Ensures default language matches i18n configuration
 *    - Validates state shape and type safety
 * 
 * 2. Action Creators:
 *    - setLanguage action creates correct action objects
 *    - Type safety for language parameter ("vi" | "en")
 * 
 * 3. Reducer Logic:
 *    - State updates correctly when language changes
 *    - Immutability is maintained (important for Redux)
 *    - Invalid actions don't break the state
 * 
 * 4. Edge Cases:
 *    - Handles same language being set multiple times
 *    - Validates TypeScript type constraints are working
 * 
 * Why This Matters:
 * - The Redux store is the single source of truth for language state
 * - Any bugs here affect the entire application's i18n functionality
 * - These tests catch type safety issues at build time
 */

import { describe, test, expect } from "vitest";
import langSlice, { setLanguage, type Language } from "../langSlice";

describe("langSlice Redux Slice", () => {
  describe("Initial State", () => {
    test("should have correct initial state matching i18n default", () => {
      const initialState = langSlice.getInitialState();
      
      expect(initialState).toEqual({
        lang: "vi" // Should match the default in i18n config
      });
      expect(initialState.lang).toMatch(/^(vi|en)$/); // Type validation
    });
  });

  describe("Action Creators", () => {
    test("setLanguage should create correct action for Vietnamese", () => {
      const action = setLanguage("vi");
      
      expect(action).toEqual({
        type: "lang/setLanguage",
        payload: "vi"
      });
    });

    test("setLanguage should create correct action for English", () => {
      const action = setLanguage("en");
      
      expect(action).toEqual({
        type: "lang/setLanguage",
        payload: "en"
      });
    });

    // TypeScript compile-time test - this should fail if types are wrong
    test("setLanguage should be type-safe", () => {
      const validLanguages: Language[] = ["vi", "en"];
      
      validLanguages.forEach(lang => {
        const action = setLanguage(lang);
        expect(action.payload).toBe(lang);
      });
    });
  });

  describe("Reducer Logic", () => {
    test("should handle setLanguage action to Vietnamese", () => {
      const initialState = { lang: "en" as Language };
      const action = setLanguage("vi");
      
      const newState = langSlice.reducer(initialState, action);
      
      expect(newState.lang).toBe("vi");
      // Verify immutability
      expect(newState).not.toBe(initialState);
      expect(initialState.lang).toBe("en"); // Original state unchanged
    });

    test("should handle setLanguage action to English", () => {
      const initialState = { lang: "vi" as Language };
      const action = setLanguage("en");
      
      const newState = langSlice.reducer(initialState, action);
      
      expect(newState.lang).toBe("en");
      expect(newState).not.toBe(initialState);
    });

    test("should handle setting same language (idempotent operation)", () => {
      const initialState = { lang: "vi" as Language };
      const action = setLanguage("vi");
      
      const newState = langSlice.reducer(initialState, action);
      
      expect(newState.lang).toBe("vi");
      // Redux Toolkit optimizes and may return the same reference for identical states
      // This is actually a performance optimization, so we just verify the state is correct
      expect(newState.lang).toBe(initialState.lang);
    });

    test("should handle undefined state (Redux internal usage)", () => {
      const action = setLanguage("en");
      
      const newState = langSlice.reducer(undefined, action);
      
      expect(newState.lang).toBe("en");
    });

    test("should handle unknown actions gracefully", () => {
      const initialState = { lang: "vi" as Language };
      const unknownAction = { type: "unknown/action", payload: "something" };
      
      const newState = langSlice.reducer(initialState, unknownAction);
      
      expect(newState).toBe(initialState); // Should return same reference for unknown actions
      expect(newState.lang).toBe("vi");
    });
  });

  describe("Slice Configuration", () => {
    test("should have correct slice name", () => {
      expect(langSlice.name).toBe("lang");
    });

    test("should export correct action types", () => {
      const action = setLanguage("en");
      expect(action.type).toBe("lang/setLanguage");
    });
  });
});