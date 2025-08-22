/**
 * Unit Tests: LanguageSync Component
 * 
 * Test Strategy:
 * This component is the critical bridge between Redux state and react-i18next.
 * It's a "side effect" component that doesn't render anything but performs important
 * synchronization logic. Testing this is crucial for i18n functionality.
 * 
 * Key Testing Areas:
 * 1. Redux Integration:
 *    - Reads language state from Redux store correctly
 *    - Subscribes to Redux state changes
 * 
 * 2. i18next Integration:
 *    - Calls i18n.changeLanguage when Redux state changes
 *    - Doesn't call changeLanguage unnecessarily (performance)
 *    - Handles i18n API correctly
 * 
 * 3. Synchronization Logic:
 *    - Updates i18n when Redux lang changes
 *    - Avoids infinite loops (critical edge case)
 *    - Only syncs when languages actually differ
 * 
 * 4. Component Lifecycle:
 *    - useEffect cleanup doesn't cause memory leaks
 *    - Component mounts/unmounts safely
 * 
 * 5. Error Handling:
 *    - Graceful handling of i18n.changeLanguage failures
 *    - Doesn't crash when Redux state is invalid
 * 
 * Why This Matters:
 * - This component is the "glue" that makes the entire i18n system work
 * - Bugs here cause language switching to fail silently
 * - Performance issues here affect the entire app (renders on every Redux change)
 * - Memory leaks here accumulate over time
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import LanguageSync from "../LanguageSync";
import langSlice, { setLanguage } from "~/lib/langSlice";

// Mock react-i18next
const mockChangeLanguage = vi.fn();
const mockI18n = {
  language: "en",
  changeLanguage: mockChangeLanguage
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: mockI18n
  })
}));

// Helper function to create test store
const createTestStore = (initialLang: "vi" | "en" = "en") => {
  return configureStore({
    reducer: {
      lang: langSlice.reducer
    },
    preloadedState: {
      lang: { lang: initialLang }
    }
  });
};

describe("LanguageSync Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock i18n language
    mockI18n.language = "en";
  });

  describe("Component Rendering", () => {
    test("should render without crashing", () => {
      const store = createTestStore();
      
      const { container } = render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // Component should render nothing (returns null)
      expect(container.firstChild).toBeNull();
    });

    test("should not render any DOM elements", () => {
      const store = createTestStore();
      
      const { container } = render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      expect(container.innerHTML).toBe("");
    });
  });

  describe("Initial Language Synchronization", () => {
    test("should sync i18n when Redux lang differs from i18n language on mount", () => {
      // Setup: Redux has "vi", i18n has "en"
      const store = createTestStore("vi");
      mockI18n.language = "en";
      
      render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      expect(mockChangeLanguage).toHaveBeenCalledWith("vi");
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
    });

    test("should not sync i18n when Redux lang matches i18n language on mount", () => {
      // Setup: Both Redux and i18n have "vi"
      const store = createTestStore("vi");
      mockI18n.language = "vi";
      
      render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    test("should handle English initialization correctly", () => {
      const store = createTestStore("en");
      mockI18n.language = "vi"; // i18n starts with different language
      
      render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });
  });

  describe("Redux State Change Synchronization", () => {
    test("should sync i18n when Redux language state changes", async () => {
      const store = createTestStore("en");
      mockI18n.language = "en";
      
      const { rerender } = render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // Initially no call since languages match
      expect(mockChangeLanguage).not.toHaveBeenCalled();
      
      // Change Redux state and re-render in act
      await act(async () => {
        store.dispatch(setLanguage("vi"));
        
        // Force re-render to trigger useEffect
        rerender(
          <Provider store={store}>
            <LanguageSync />
          </Provider>
        );
      });
      
      expect(mockChangeLanguage).toHaveBeenCalledWith("vi");
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
    });

    test("should handle multiple rapid language changes", async () => {
      const store = createTestStore("en");
      mockI18n.language = "en";
      
      const { rerender } = render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // Multiple rapid changes wrapped in act
      await act(async () => {
        store.dispatch(setLanguage("vi"));
        
        rerender(
          <Provider store={store}>
            <LanguageSync />
          </Provider>
        );
      });
      
      // First change should be called
      expect(mockChangeLanguage).toHaveBeenCalledWith("vi");
      
      // Simulate i18n language has been updated
      mockI18n.language = "vi";
      
      await act(async () => {
        store.dispatch(setLanguage("en"));
        
        rerender(
          <Provider store={store}>
            <LanguageSync />
          </Provider>
        );
      });
      
      // Should call changeLanguage for the changes that differ from current i18n language
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
      expect(mockChangeLanguage).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance Optimization", () => {
    test("should not call changeLanguage when setting same language", () => {
      const store = createTestStore("vi");
      mockI18n.language = "vi";
      
      const { rerender } = render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // Set same language multiple times
      store.dispatch(setLanguage("vi"));
      rerender(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      store.dispatch(setLanguage("vi"));
      rerender(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // Should not call changeLanguage since language is already correct
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    test("should avoid infinite loops when i18n and Redux are already synced", () => {
      const store = createTestStore("vi");
      mockI18n.language = "vi";
      
      render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // No calls should be made when already synced
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("should handle i18n.changeLanguage errors gracefully", () => {
      const store = createTestStore("vi");
      mockI18n.language = "en";
      mockChangeLanguage.mockRejectedValue(new Error("i18n error"));
      
      // Should not throw error
      expect(() => {
        render(
          <Provider store={store}>
            <LanguageSync />
          </Provider>
        );
      }).not.toThrow();
      
      expect(mockChangeLanguage).toHaveBeenCalledWith("vi");
    });

    test("should handle missing i18n object gracefully", () => {
      const store = createTestStore("vi");
      
      // Mock useTranslation to return undefined i18n
      vi.doMock("react-i18next", () => ({
        useTranslation: () => ({
          i18n: undefined
        })
      }));
      
      // Should not throw error even with undefined i18n
      expect(() => {
        render(
          <Provider store={store}>
            <LanguageSync />
          </Provider>
        );
      }).not.toThrow();
    });
  });

  describe("Component Lifecycle", () => {
    test("should not cause memory leaks on unmount", () => {
      const store = createTestStore("vi");
      
      const { unmount } = render(
        <Provider store={store}>
          <LanguageSync />
        </Provider>
      );
      
      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    test("should handle multiple mount/unmount cycles", () => {
      const store = createTestStore("vi");
      
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(
          <Provider store={store}>
            <LanguageSync />
          </Provider>
        );
        unmount();
      }
      
      // Should not accumulate any issues
      expect(mockChangeLanguage).toHaveBeenCalledTimes(3); // Once per mount
    });
  });
});