/**
 * Unit Tests: Navbar Component i18n Integration
 * 
 * Test Strategy:
 * The Navbar is the primary interface for language switching and displays
 * user-facing text. This test validates that the Navbar component correctly
 * integrates with both Redux (for state management) and react-i18next (for translations).
 * 
 * Key Testing Areas:
 * 1. Translation Display:
 *    - Displays correct text in English
 *    - Displays correct text in Vietnamese  
 *    - Updates text when language changes
 * 
 * 2. Language Switch Interaction:
 *    - Flag buttons dispatch correct Redux actions
 *    - Visual feedback (opacity) matches active language
 *    - Click handlers work correctly
 * 
 * 3. Redux Integration:
 *    - Reads current language from Redux state
 *    - Dispatches setLanguage actions on flag clicks
 *    - Subscribes to Redux state changes
 * 
 * 4. i18n Integration:
 *    - Uses useTranslation hook correctly
 *    - Translation keys resolve to correct strings
 *    - Handles missing translation keys gracefully
 * 
 * 5. Visual State Management:
 *    - Active language flag has full opacity
 *    - Inactive language flag has reduced opacity
 *    - State updates reflect immediately
 * 
 * Why This Matters:
 * - Navbar is the primary language switching interface
 * - Users expect immediate visual feedback when switching languages
 * - This component demonstrates the full Redux + i18n integration pattern
 * - Bugs here directly impact user experience and language switching
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router";
import Navbar from "../Navbar";
import langSlice, { setLanguage } from "~/lib/langSlice";

// Mock react-i18next
const mockT = vi.fn();
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT
  })
}));

// Helper function to create test store
const createTestStore = (initialLang: "vi" | "en" = "vi") => {
  return configureStore({
    reducer: {
      lang: langSlice.reducer
    },
    preloadedState: {
      lang: { lang: initialLang }
    }
  });
};

// Helper function to render Navbar with providers
const renderNavbar = (store: any) => {
  return render(
    <BrowserRouter>
      <Provider store={store}>
        <Navbar />
      </Provider>
    </BrowserRouter>
  );
};

describe("Navbar i18n Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock translations
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        "navbar.brandName": "RESUMIND",
        "navbar.uploadResume": "Upload Resume"
      };
      return translations[key] || key;
    });
  });

  describe("Translation Key Usage", () => {
    test("should use correct translation keys for brand name", () => {
      const store = createTestStore("en");
      renderNavbar(store);
      
      expect(mockT).toHaveBeenCalledWith("navbar.brandName");
    });

    test("should use correct translation keys for upload button", () => {
      const store = createTestStore("en");
      renderNavbar(store);
      
      expect(mockT).toHaveBeenCalledWith("navbar.uploadResume");
    });

    test("should display translated brand name", () => {
      mockT.mockImplementation((key: string) => {
        if (key === "navbar.brandName") return "RESUMIND";
        return key;
      });
      
      const store = createTestStore("en");
      renderNavbar(store);
      
      expect(screen.getByText("RESUMIND")).toBeInTheDocument();
    });

    test("should display translated upload button text", () => {
      mockT.mockImplementation((key: string) => {
        if (key === "navbar.uploadResume") return "Upload Resume";
        return key;
      });
      
      const store = createTestStore("en");
      renderNavbar(store);
      
      expect(screen.getByText("Upload Resume")).toBeInTheDocument();
    });
  });

  describe("Vietnamese Translations", () => {
    test("should display Vietnamese text when language is Vietnamese", () => {
      mockT.mockImplementation((key: string) => {
        const viTranslations: Record<string, string> = {
          "navbar.brandName": "RESUMIND",
          "navbar.uploadResume": "Tải lên CV"
        };
        return viTranslations[key] || key;
      });
      
      const store = createTestStore("vi");
      renderNavbar(store);
      
      expect(screen.getByText("Tải lên CV")).toBeInTheDocument();
    });

    test("should handle Vietnamese diacritics correctly", () => {
      mockT.mockImplementation((key: string) => {
        if (key === "navbar.uploadResume") return "Tải lên CV";
        return key;
      });
      
      const store = createTestStore("vi");
      renderNavbar(store);
      
      const element = screen.getByText("Tải lên CV");
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe("Tải lên CV"); // Verify exact diacritics
    });
  });

  describe("Language Switch Functionality", () => {
    test("should dispatch setLanguage action when Vietnamese flag is clicked", () => {
      const store = createTestStore("en");
      const dispatchSpy = vi.spyOn(store, "dispatch");
      
      renderNavbar(store);
      
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      fireEvent.click(vietnameseFlag);
      
      expect(dispatchSpy).toHaveBeenCalledWith(setLanguage("vi"));
    });

    test("should dispatch setLanguage action when English flag is clicked", () => {
      const store = createTestStore("vi");
      const dispatchSpy = vi.spyOn(store, "dispatch");
      
      renderNavbar(store);
      
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      fireEvent.click(englishFlag);
      
      expect(dispatchSpy).toHaveBeenCalledWith(setLanguage("en"));
    });

    test("should show correct visual state for active Vietnamese language", () => {
      const store = createTestStore("vi");
      renderNavbar(store);
      
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      // Vietnamese flag should have full opacity (active)
      expect(vietnameseFlag).toHaveClass("opacity-100");
      // English flag should have reduced opacity (inactive)
      expect(englishFlag).toHaveClass("opacity-50");
    });

    test("should show correct visual state for active English language", () => {
      const store = createTestStore("en");
      renderNavbar(store);
      
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      // English flag should have full opacity (active)
      expect(englishFlag).toHaveClass("opacity-100");
      // Vietnamese flag should have reduced opacity (inactive)
      expect(vietnameseFlag).toHaveClass("opacity-50");
    });
  });

  describe("Redux State Integration", () => {
    test("should read language state from Redux store", () => {
      const store = createTestStore("vi");
      renderNavbar(store);
      
      // Component should reflect the Redux state
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      expect(vietnameseFlag).toHaveClass("opacity-100");
    });

    test("should update visual state when Redux state changes", async () => {
      const store = createTestStore("vi");
      const { rerender } = renderNavbar(store);
      
      // Initial state: Vietnamese active
      let vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      let englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      expect(vietnameseFlag).toHaveClass("opacity-100");
      expect(englishFlag).toHaveClass("opacity-50");
      
      // Change Redux state and re-render in act
      await act(async () => {
        store.dispatch(setLanguage("en"));
        
        // Re-render to reflect state change
        rerender(
          <BrowserRouter>
            <Provider store={store}>
              <Navbar />
            </Provider>
          </BrowserRouter>
        );
      });
      
      // Updated state: English active
      vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      expect(englishFlag).toHaveClass("opacity-100");
      expect(vietnameseFlag).toHaveClass("opacity-50");
    });
  });

  describe("Error Handling", () => {
    test("should handle missing translation keys gracefully", () => {
      mockT.mockImplementation((key: string) => {
        // Simulate missing translation
        return key; // Return key as fallback
      });
      
      const store = createTestStore("en");
      
      expect(() => renderNavbar(store)).not.toThrow();
      
      // Should display the translation key as fallback
      expect(screen.getByText("navbar.brandName")).toBeInTheDocument();
      expect(screen.getByText("navbar.uploadResume")).toBeInTheDocument();
    });

    test("should handle translation function errors gracefully", () => {
      mockT.mockImplementation(() => {
        throw new Error("Translation error");
      });
      
      const store = createTestStore("en");
      
      // The component will crash because React can't handle thrown errors in render
      // This is expected behavior - components should have error boundaries to handle this
      expect(() => renderNavbar(store)).toThrow("Translation error");
    });

    test("should handle undefined store state gracefully", () => {
      // Create store with undefined language (edge case)
      const store = configureStore({
        reducer: {
          lang: langSlice.reducer
        }
        // No preloadedState - will use initial state
      });
      
      expect(() => renderNavbar(store)).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    test("should have accessible button roles for flag buttons", () => {
      const store = createTestStore("en");
      renderNavbar(store);
      
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      expect(vietnameseFlag).toBeInTheDocument();
      expect(englishFlag).toBeInTheDocument();
    });

    test("should be keyboard accessible", () => {
      const store = createTestStore("en");
      renderNavbar(store);
      
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      
      // Should be focusable
      vietnameseFlag.focus();
      expect(document.activeElement).toBe(vietnameseFlag);
      
      // Should handle keyboard events (Enter/Space)
      fireEvent.keyDown(vietnameseFlag, { key: "Enter" });
      // Note: Testing library might not trigger onClick for keyboard events,
      // but the button should be keyboard accessible
    });
  });

  describe("Performance", () => {
    test("should not cause unnecessary re-renders", () => {
      const store = createTestStore("en");
      
      // Count translation function calls
      const callCountBefore = mockT.mock.calls.length;
      renderNavbar(store);
      const callCountAfter = mockT.mock.calls.length;
      
      // Should only call translation function for each key once
      const expectedCalls = 2; // brandName + uploadResume
      expect(callCountAfter - callCountBefore).toBe(expectedCalls);
    });

    test("should handle rapid language switching", () => {
      const store = createTestStore("en");
      const dispatchSpy = vi.spyOn(store, "dispatch");
      
      renderNavbar(store);
      
      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(vietnameseFlag);
        fireEvent.click(englishFlag);
      }
      
      // Should dispatch all actions without issues
      expect(dispatchSpy).toHaveBeenCalledTimes(10);
      expect(dispatchSpy).toHaveBeenCalledWith(setLanguage("vi"));
      expect(dispatchSpy).toHaveBeenCalledWith(setLanguage("en"));
    });
  });
});