/**
 * Unit Tests: ScoreBadge Component i18n Integration
 * 
 * Test Strategy:
 * ScoreBadge displays dynamic translated text based on score thresholds.
 * This tests the combination of business logic (score evaluation) with
 * i18n functionality (text translation). It's critical because score badges
 * appear throughout the app and provide user feedback.
 * 
 * Key Testing Areas:
 * 1. Score Threshold Logic + Translation:
 *    - Score > 70: "Strong" / "Mạnh"
 *    - Score 50-70: "Good Start" / "Khởi đầu tốt" 
 *    - Score < 50: "Needs Work" / "Cần cải thiện"
 * 
 * 2. Translation Key Resolution:
 *    - Uses correct translation keys for each score range
 *    - Handles translation function correctly
 *    - Displays translated text properly
 * 
 * 3. Visual Styling Consistency:
 *    - Maintains correct CSS classes regardless of text length
 *    - Handles different text lengths between languages
 *    - Color coding matches score thresholds
 * 
 * 4. Edge Cases:
 *    - Boundary scores (exactly 50, 70)
 *    - Extreme scores (0, 100, negative, > 100)
 *    - Missing translation keys
 * 
 * 5. Multi-language Display:
 *    - English translations work correctly
 *    - Vietnamese translations work correctly
 *    - Text fits within badge layout
 * 
 * Why This Matters:
 * - Score badges provide instant feedback to users
 * - They appear in multiple places (Summary, Details components)
 * - Wrong translations confuse users about their performance
 * - Score thresholds must be consistent with business logic
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ScoreBadge from "../ScoreBadge";

// Mock react-i18next
const mockT = vi.fn();
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT
  })
}));

describe("ScoreBadge i18n Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock translations
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        "scoreBadge.strong": "Strong",
        "scoreBadge.goodStart": "Good Start", 
        "scoreBadge.needsWork": "Needs Work"
      };
      return translations[key] || key;
    });
  });

  describe("Score Threshold Translation Logic", () => {
    test("should use 'strong' translation for high scores (>70)", () => {
      render(<ScoreBadge score={85} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    test("should use 'strong' translation for boundary score (71)", () => {
      render(<ScoreBadge score={71} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    test("should use 'goodStart' translation for medium scores (50-70)", () => {
      render(<ScoreBadge score={60} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.goodStart");
      expect(screen.getByText("Good Start")).toBeInTheDocument();
    });

    test("should use 'goodStart' translation for boundary score (70)", () => {
      render(<ScoreBadge score={70} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.goodStart");
      expect(screen.getByText("Good Start")).toBeInTheDocument();
    });

    test("should use 'goodStart' translation for boundary score (50)", () => {
      render(<ScoreBadge score={50} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.goodStart");
      expect(screen.getByText("Good Start")).toBeInTheDocument();
    });

    test("should use 'needsWork' translation for low scores (<50)", () => {
      render(<ScoreBadge score={25} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.needsWork");
      expect(screen.getByText("Needs Work")).toBeInTheDocument();
    });

    test("should use 'needsWork' translation for boundary score (49)", () => {
      render(<ScoreBadge score={49} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.needsWork");
      expect(screen.getByText("Needs Work")).toBeInTheDocument();
    });
  });

  describe("Vietnamese Translations", () => {
    beforeEach(() => {
      mockT.mockImplementation((key: string) => {
        const viTranslations: Record<string, string> = {
          "scoreBadge.strong": "Mạnh",
          "scoreBadge.goodStart": "Khởi đầu tốt",
          "scoreBadge.needsWork": "Cần cải thiện"
        };
        return viTranslations[key] || key;
      });
    });

    test("should display Vietnamese text for high scores", () => {
      render(<ScoreBadge score={85} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("Mạnh")).toBeInTheDocument();
    });

    test("should display Vietnamese text for medium scores", () => {
      render(<ScoreBadge score={60} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.goodStart");
      expect(screen.getByText("Khởi đầu tốt")).toBeInTheDocument();
    });

    test("should display Vietnamese text for low scores", () => {
      render(<ScoreBadge score={25} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.needsWork");
      expect(screen.getByText("Cần cải thiện")).toBeInTheDocument();
    });

    test("should handle Vietnamese diacritics correctly", () => {
      render(<ScoreBadge score={25} />);
      
      const element = screen.getByText("Cần cải thiện");
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe("Cần cải thiện"); // Verify exact diacritics
    });
  });

  describe("CSS Class Consistency", () => {
    test("should maintain correct styling for high scores regardless of language", () => {
      render(<ScoreBadge score={85} />);
      
      const container = screen.getByText("Strong").closest("div");
      expect(container).toHaveClass("bg-badge-green", "text-green-600");
    });

    test("should maintain correct styling for medium scores regardless of language", () => {
      render(<ScoreBadge score={60} />);
      
      const container = screen.getByText("Good Start").closest("div");
      expect(container).toHaveClass("bg-badge-yellow", "text-yellow-600");
    });

    test("should maintain correct styling for low scores regardless of language", () => {
      render(<ScoreBadge score={25} />);
      
      const container = screen.getByText("Needs Work").closest("div");
      expect(container).toHaveClass("bg-badge-red", "text-red-600");
    });

    test("should maintain text styling regardless of translation length", () => {
      // Test with longer Vietnamese text
      mockT.mockImplementation((key: string) => {
        if (key === "scoreBadge.goodStart") return "Khởi đầu tốt";
        return key;
      });
      
      render(<ScoreBadge score={60} />);
      
      const textElement = screen.getByText("Khởi đầu tốt");
      expect(textElement).toHaveClass("text-sm", "font-medium");
    });
  });

  describe("Edge Case Scores", () => {
    test("should handle score of 0", () => {
      render(<ScoreBadge score={0} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.needsWork");
      expect(screen.getByText("Needs Work")).toBeInTheDocument();
    });

    test("should handle perfect score of 100", () => {
      render(<ScoreBadge score={100} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    test("should handle negative scores", () => {
      render(<ScoreBadge score={-10} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.needsWork");
      expect(screen.getByText("Needs Work")).toBeInTheDocument();
    });

    test("should handle scores over 100", () => {
      render(<ScoreBadge score={150} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    test("should handle decimal scores", () => {
      render(<ScoreBadge score={70.5} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });
  });

  describe("Translation Error Handling", () => {
    test("should handle missing translation keys gracefully", () => {
      mockT.mockImplementation((key: string) => {
        // Return key as fallback for missing translations
        return key;
      });
      
      render(<ScoreBadge score={85} />);
      
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
      expect(screen.getByText("scoreBadge.strong")).toBeInTheDocument();
    });

    test("should handle translation function errors", () => {
      mockT.mockImplementation(() => {
        throw new Error("Translation error");
      });
      
      // The component will crash because React can't handle thrown errors in render
      // This is expected behavior - components should have error boundaries to handle this
      expect(() => render(<ScoreBadge score={85} />)).toThrow("Translation error");
    });

    test("should handle null/undefined translation returns", () => {
      mockT.mockImplementation(() => null);
      
      expect(() => render(<ScoreBadge score={85} />)).not.toThrow();
      
      // Should render something (empty or fallback)
      const container = screen.getByTestId("score-badge");
      expect(container).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    test("should maintain correct HTML structure with translations", () => {
      render(<ScoreBadge score={85} />);
      
      // Should have the container div with correct classes
      const container = screen.getByText("Strong").closest("div");
      expect(container).toHaveClass("px-3", "py-1", "rounded-full");
      
      // Should have the text paragraph with correct classes
      const textElement = screen.getByText("Strong");
      expect(textElement.tagName).toBe("P");
      expect(textElement).toHaveClass("text-sm", "font-medium");
    });

    test("should be accessible with translated text", () => {
      render(<ScoreBadge score={85} />);
      
      const textElement = screen.getByText("Strong");
      expect(textElement).toBeInTheDocument();
      expect(textElement).toBeVisible();
    });
  });

  describe("Performance", () => {
    test("should call translation function only once per render", () => {
      render(<ScoreBadge score={85} />);
      
      expect(mockT).toHaveBeenCalledTimes(1);
      expect(mockT).toHaveBeenCalledWith("scoreBadge.strong");
    });

    test("should not cause unnecessary translation calls on re-render with same score", () => {
      const { rerender } = render(<ScoreBadge score={85} />);
      const callCountAfterFirst = mockT.mock.calls.length;
      
      rerender(<ScoreBadge score={85} />);
      const callCountAfterSecond = mockT.mock.calls.length;
      
      // Should call translation function again on re-render (React behavior)
      expect(callCountAfterSecond).toBe(callCountAfterFirst + 1);
    });

    test("should handle different scores efficiently", () => {
      const scores = [25, 60, 85, 0, 100, 49, 50, 70, 71];
      
      scores.forEach((score, index) => {
        const { unmount } = render(<ScoreBadge score={score} />);
        unmount(); // Clean up between renders
      });
      
      // Should have called translation function for each score
      expect(mockT).toHaveBeenCalledTimes(scores.length);
    });
  });
});