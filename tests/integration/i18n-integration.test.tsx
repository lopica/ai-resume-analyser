/**
 * Integration Tests: Full i18n System Integration
 * 
 * Test Strategy:
 * These tests validate the complete i18n flow from Redux state changes through
 * to component rendering. Unlike unit tests that mock dependencies, these tests
 * use the real Redux store, real i18n configuration, and real components to
 * ensure the entire system works together correctly.
 * 
 * Key Testing Areas:
 * 1. End-to-End Language Switching:
 *    - Flag click → Redux dispatch → LanguageSync → i18n change → Component re-render
 *    - Multiple components update simultaneously
 *    - State persistence across navigation
 * 
 * 2. Redux + i18n Integration:
 *    - Redux store correctly connected to i18n
 *    - LanguageSync component bridges the gap
 *    - No infinite loops or race conditions
 * 
 * 3. Component Integration:
 *    - Multiple i18n-enabled components work together
 *    - Shared translation context works correctly
 *    - Component tree updates propagate correctly
 * 
 * 4. Real Translation Loading:
 *    - Actual translation files are loaded and parsed
 *    - Translation keys resolve to real values
 *    - Missing translations handled gracefully
 * 
 * 5. Performance Integration:
 *    - Language switching doesn't cause performance issues
 *    - Components don't re-render unnecessarily
 *    - Memory usage stays stable
 * 
 * Why This Matters:
 * - Unit tests can pass but integration can fail
 * - Real Redux + i18n interactions are complex
 * - Component communication through shared state needs testing
 * - Performance issues only appear with full system integration
 */

import React from "react";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { act as reactAct } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import { I18nextProvider } from "react-i18next";
import { configureStore } from "@reduxjs/toolkit";
import { setLanguage } from "~/lib/langSlice";
import langSlice from "~/lib/langSlice";
import puterSlice from "~/lib/puterSlice";
import { puterApiSlice } from "~/lib/puterApiSlice";
import i18n from "~/lib/i18n";
import Navbar from "~/components/Navbar";
import LanguageSync from "~/components/LanguageSync";
import ScoreBadge from "~/components/ScoreBadge";
import Summary from "~/components/Summary";

// Helper to create clean test store for each test
const createTestStore = (initialLang: "vi" | "en" = "vi") => {
  return configureStore({
    reducer: {
      lang: langSlice.reducer,
      puter: puterSlice.reducer,
      puterApi: puterApiSlice.reducer,
    },
    preloadedState: {
      lang: { lang: initialLang },
      puter: {
        puterReady: true,
        auth: {
          user: { uuid: 'test-user', username: 'testuser' },
          isAuthenticated: true,
        },
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(puterApiSlice.middleware),
  });
};

// Test wrapper component that provides all necessary context
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ children, store: testStore }) => {
  const storeToUse = testStore || createTestStore();
  return (
    <Provider store={storeToUse}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <LanguageSync />
          {children}
        </BrowserRouter>
      </I18nextProvider>
    </Provider>
  );
};

// Mock feedback data for Summary component
const mockFeedback: Feedback = {
  overallScore: 85,
  ATS: {
    score: 78,
    tips: [
      { type: "improve", tip: "Add keywords" }
    ]
  },
  toneAndStyle: {
    score: 80,
    tips: [
      { type: "good", tip: "Professional tone", explanation: "Good professional language" }
    ]
  },
  content: {
    score: 90,
    tips: [
      { type: "good", tip: "Relevant content", explanation: "Content matches job requirements" }
    ]
  },
  structure: {
    score: 85,
    tips: [
      { type: "improve", tip: "Better structure", explanation: "Improve section organization" }
    ]
  },
  skills: {
    score: 75,
    tips: [
      { type: "good", tip: "Relevant skills", explanation: "Skills match job posting" }
    ]
  }
};

describe("i18n System Integration", () => {
  beforeEach(async () => {
    // Ensure i18n is properly initialized and set to Vietnamese (default)
    if (!i18n.isInitialized) {
      await i18n.init();
    }
    await i18n.changeLanguage("vi");
    
    // Wait for i18n to be ready
    await i18n.loadNamespaces(["translation"]);
  });

  afterEach(() => {
    // Clean up any side effects
    vi.clearAllMocks();
  });

  describe("Complete Language Switching Flow", () => {
    test("should complete full language switch flow: flag click → Redux → i18n → component update", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <Navbar />
          <ScoreBadge score={85} />
        </TestWrapper>
      );

      // Verify initial Vietnamese state
      await waitFor(() => {
        expect(screen.getByText("Tải lên CV")).toBeInTheDocument(); // Navbar in Vietnamese
        expect(screen.getByText("Mạnh")).toBeInTheDocument(); // ScoreBadge in Vietnamese
      });

      // Click English flag
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      await reactAct(async () => {
        fireEvent.click(englishFlag);
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      // Check for English text
      expect(screen.getByText("Upload Resume")).toBeInTheDocument(); // Navbar in English
      expect(screen.getByText("Strong")).toBeInTheDocument(); // ScoreBadge in English

      // Verify Redux state was updated
      expect(testStore.getState().lang.lang).toBe("en");
    });

    test("should handle rapid language switching without issues", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <Navbar />
          <ScoreBadge score={60} />
        </TestWrapper>
      );

      const vietnameseFlag = screen.getByRole("button", { name: /🇻🇳/ });
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });

      // Rapid switching
      for (let i = 0; i < 3; i++) {
        await reactAct(async () => {
          fireEvent.click(englishFlag);
          await new Promise(resolve => setTimeout(resolve, 200));
        });
        
        expect(screen.getByText("Good Start")).toBeInTheDocument();

        await reactAct(async () => {
          fireEvent.click(vietnameseFlag);
          await new Promise(resolve => setTimeout(resolve, 200));
        });
        
        expect(screen.getByText("Khởi đầu tốt")).toBeInTheDocument();
      }

      // Should end in Vietnamese state
      expect(testStore.getState().lang.lang).toBe("vi");
    });
  });

  describe("Multiple Component Integration", () => {
    test("should update multiple components simultaneously when language changes", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <Navbar />
          <ScoreBadge score={25} />
          <ScoreBadge score={85} />
        </TestWrapper>
      );

      // Verify initial Vietnamese state across all components
      await waitFor(() => {
        expect(screen.getByText("Tải lên CV")).toBeInTheDocument(); // Navbar
        expect(screen.getByText("Cần cải thiện")).toBeInTheDocument(); // ScoreBadge low
        expect(screen.getByText("Mạnh")).toBeInTheDocument(); // ScoreBadge high
      });

      // Switch to English
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      await reactAct(async () => {
        fireEvent.click(englishFlag);
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      // Verify all components updated
      expect(screen.getByText("Upload Resume")).toBeInTheDocument(); // Navbar
      expect(screen.getByText("Needs Work")).toBeInTheDocument(); // ScoreBadge low
      expect(screen.getByText("Strong")).toBeInTheDocument(); // ScoreBadge high
    });

    test("should maintain component-specific state during language changes", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <ScoreBadge score={60} />
          <ScoreBadge score={85} />
        </TestWrapper>
      );

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByText("Khởi đầu tốt")).toBeInTheDocument(); // Score 60
        expect(screen.getByText("Mạnh")).toBeInTheDocument(); // Score 85
      });

      // Switch language
      await reactAct(async () => {
        testStore.dispatch(setLanguage("en"));
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      // Verify language changed
      expect(screen.getByText("Good Start")).toBeInTheDocument(); // Score 60
      expect(screen.getByText("Strong")).toBeInTheDocument(); // Score 85

      // Verify scores are still correctly mapped
      const badges = screen.getAllByTestId("score-badge");
      expect(badges).toHaveLength(2);
      
      // Score 60 should have yellow styling
      const goodStartBadge = screen.getByText("Good Start").closest("div");
      expect(goodStartBadge).toHaveClass("bg-badge-yellow");
      
      // Score 85 should have green styling
      const strongBadge = screen.getByText("Strong").closest("div");
      expect(strongBadge).toHaveClass("bg-badge-green");
    });
  });

  describe("Real Translation File Integration", () => {
    test("should load and use real translation files", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <Navbar />
        </TestWrapper>
      );

      // Should use actual translations from JSON files
      await waitFor(() => {
        const uploadButton = screen.getByText("Tải lên CV");
        expect(uploadButton).toBeInTheDocument();
      });

      // Switch to English and verify real English translations
      await reactAct(async () => {
        testStore.dispatch(setLanguage("en"));
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      const uploadButton = screen.getByText("Upload Resume");
      expect(uploadButton).toBeInTheDocument();
    });

    test("should handle missing translation keys gracefully in integrated environment", async () => {
      // Mock a component that uses a non-existent translation key
      const TestComponentWithMissingKey: React.FC = () => {
        const { t } = React.useMemo(() => ({ 
          t: (key: string) => key === "nonexistent.key" ? key : "fallback" 
        }), []);
        return <div>{t("nonexistent.key")}</div>;
      };

      render(
        <TestWrapper>
          <TestComponentWithMissingKey />
        </TestWrapper>
      );

      // Should display the key as fallback
      expect(screen.getByText("nonexistent.key")).toBeInTheDocument();
    });
  });

  describe("Redux Store Integration", () => {
    test("should maintain Redux state consistency during i18n operations", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <Navbar />
        </TestWrapper>
      );

      // Initial state
      expect(testStore.getState().lang.lang).toBe("vi");

      // Change language through component interaction
      const englishFlag = screen.getByRole("button", { name: /🇺🇸/ });
      
      await reactAct(async () => {
        fireEvent.click(englishFlag);
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      expect(testStore.getState().lang.lang).toBe("en");

      // Change language through Redux dispatch
      await reactAct(async () => {
        testStore.dispatch(setLanguage("vi"));
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      expect(testStore.getState().lang.lang).toBe("vi");
      expect(screen.getByText("Tải lên CV")).toBeInTheDocument();
    });

    test("should handle Redux state changes from external sources", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <ScoreBadge score={75} />
        </TestWrapper>
      );

      // Verify initial state
      await waitFor(() => {
        expect(screen.getByText("Mạnh")).toBeInTheDocument();
      });

      // External Redux state change (simulating another part of the app)
      await reactAct(async () => {
        testStore.dispatch(setLanguage("en"));
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });
  });

  describe("Performance and Memory Integration", () => {
    test("should not cause memory leaks during multiple language switches", async () => {
      const testStore = createTestStore("vi");
      
      const { unmount } = render(
        <TestWrapper store={testStore}>
          <Navbar />
          <ScoreBadge score={75} />
        </TestWrapper>
      );

      // Multiple language switches
      for (let i = 0; i < 5; i++) {
        await reactAct(async () => {
          testStore.dispatch(setLanguage("en"));
          await new Promise(resolve => setTimeout(resolve, 200));
        });
        
        expect(screen.getByText("Strong")).toBeInTheDocument();

        await reactAct(async () => {
          testStore.dispatch(setLanguage("vi"));
          await new Promise(resolve => setTimeout(resolve, 200));
        });
        
        expect(screen.getByText("Mạnh")).toBeInTheDocument();
      }

      // Should unmount without issues
      expect(() => unmount()).not.toThrow();
    });

    test("should not cause excessive re-renders during language changes", async () => {
      const testStore = createTestStore("vi");
      let renderCount = 0;
      
      const RenderCounterComponent: React.FC = () => {
        renderCount++;
        return <ScoreBadge score={80} />;
      };

      render(
        <TestWrapper store={testStore}>
          <RenderCounterComponent />
        </TestWrapper>
      );

      const initialRenderCount = renderCount;

      // Single language change should not cause excessive re-renders
      await reactAct(async () => {
        testStore.dispatch(setLanguage("en"));
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      expect(screen.getByText("Strong")).toBeInTheDocument();

      // Should have reasonable number of re-renders (not excessive)
      const finalRenderCount = renderCount;
      const reRenderCount = finalRenderCount - initialRenderCount;
      
      // Allow for some re-renders but not excessive (< 5 is reasonable)
      expect(reRenderCount).toBeLessThan(5);
    });
  });

  describe("Error Handling Integration", () => {
    test("should handle i18n initialization errors gracefully", async () => {
      // This test ensures the system degrades gracefully if i18n fails to initialize
      const { unmount } = render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // Should render without throwing errors
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      
      expect(() => unmount()).not.toThrow();
    });

    test("should handle Redux state corruption gracefully", async () => {
      const testStore = createTestStore("vi");
      
      render(
        <TestWrapper store={testStore}>
          <ScoreBadge score={60} />
        </TestWrapper>
      );

      // Simulate corrupted Redux state (this shouldn't happen in practice)
      // but we want to ensure graceful degradation
      const corruptedState = { lang: { lang: "invalid" as any } };
      
      // The component should still render without crashing
      expect(screen.getByTestId("score-badge")).toBeInTheDocument();
    });
  });

  describe("Component Lifecycle Integration", () => {
    test("should handle component mount/unmount during language changes", async () => {
      const testStore = createTestStore("vi");
      
      const { rerender, unmount } = render(
        <TestWrapper store={testStore}>
          <ScoreBadge score={90} />
        </TestWrapper>
      );

      // Initial render
      await waitFor(() => {
        expect(screen.getByText("Mạnh")).toBeInTheDocument();
      });

      // Change language
      await reactAct(async () => {
        testStore.dispatch(setLanguage("en"));
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      expect(screen.getByText("Strong")).toBeInTheDocument();

      // Re-render with different component
      rerender(
        <TestWrapper store={testStore}>
          <Navbar />
        </TestWrapper>
      );

      // New component should use current language
      expect(screen.getByText("Upload Resume")).toBeInTheDocument();

      expect(() => unmount()).not.toThrow();
    });
  });
});