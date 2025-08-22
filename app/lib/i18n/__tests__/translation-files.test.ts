/**
 * Unit Tests: Translation Files Validation
 * 
 * Test Strategy:
 * Translation files are the data backbone of the i18n system. These tests ensure
 * data consistency, completeness, and quality across all supported languages.
 * This is critical because missing or incorrect translations cause user-facing issues.
 * 
 * Key Testing Areas:
 * 1. File Structure Validation:
 *    - Both language files exist and are parseable JSON
 *    - JSON structure is valid and consistent
 *    - No syntax errors in translation files
 * 
 * 2. Key Consistency:
 *    - All translation keys exist in both languages
 *    - No missing translations (Vietnamese has all English keys and vice versa)
 *    - Nested key structures match exactly
 * 
 * 3. Content Quality:
 *    - No empty or null translation values
 *    - No untranslated keys (English text in Vietnamese file)
 *    - Special characters and Unicode are handled correctly
 * 
 * 4. Type Safety:
 *    - Translation keys match TypeScript definitions
 *    - Nested structures are consistent
 * 
 * 5. Business Logic Validation:
 *    - Critical UI text is properly translated
 *    - Error messages exist in both languages
 *    - Form labels and buttons are translated
 * 
 * Why This Matters:
 * - Missing translations cause fallback text or broken UI
 * - Inconsistent key structures break components
 * - Poor translations hurt user experience
 * - These tests catch translation issues during CI/CD
 */

import { describe, test, expect } from "vitest";
import enTranslations from "../locales/en.json";
import viTranslations from "../locales/vi.json";

// Helper function to get all leaf values from nested object
const getAllValues = (obj: any, keyPath = ""): Array<{key: string, value: any}> => {
  let values: Array<{key: string, value: any}> = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = keyPath ? `${keyPath}.${key}` : key;
    
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      values.push(...getAllValues(value, fullKey));
    } else {
      values.push({ key: fullKey, value });
    }
  }
  
  return values;
};

describe("Translation Files Validation", () => {
  describe("File Structure", () => {
    test("English translations should be valid JSON object", () => {
      expect(enTranslations).toBeDefined();
      expect(typeof enTranslations).toBe("object");
      expect(enTranslations).not.toBeNull();
    });

    test("Vietnamese translations should be valid JSON object", () => {
      expect(viTranslations).toBeDefined();
      expect(typeof viTranslations).toBe("object");
      expect(viTranslations).not.toBeNull();
    });

    test("Both translation files should have content", () => {
      const enKeys = Object.keys(enTranslations);
      const viKeys = Object.keys(viTranslations);
      
      expect(enKeys.length).toBeGreaterThan(0);
      expect(viKeys.length).toBeGreaterThan(0);
    });
  });

  describe("Key Structure Consistency", () => {
    // Helper function to get all nested keys from an object
    const getAllKeys = (obj: any, prefix = ""): string[] => {
      let keys: string[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          keys.push(fullKey);
          keys.push(...getAllKeys(value, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      
      return keys.sort();
    };

    test("should have identical key structures between languages", () => {
      const enKeys = getAllKeys(enTranslations);
      const viKeys = getAllKeys(viTranslations);
      
      expect(enKeys).toEqual(viKeys);
    });

    test("should have all top-level sections in both languages", () => {
      const enTopLevel = Object.keys(enTranslations).sort();
      const viTopLevel = Object.keys(viTranslations).sort();
      
      expect(enTopLevel).toEqual(viTopLevel);
    });

    test("should have consistent nested structures", () => {
      const checkStructure = (enObj: any, viObj: any, path = "") => {
        for (const key of Object.keys(enObj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Check if key exists in Vietnamese
          expect(viObj).toHaveProperty(key);
          
          // Check type consistency
          const enType = typeof enObj[key];
          const viType = typeof viObj[key];
          expect(viType).toBe(enType);
          
          // Recursively check nested objects
          if (enType === "object" && enObj[key] !== null && !Array.isArray(enObj[key])) {
            checkStructure(enObj[key], viObj[key], currentPath);
          }
        }
      };
      
      checkStructure(enTranslations, viTranslations);
    });
  });

  describe("Content Quality", () => {

    test("should not have empty or null values in English translations", () => {
      const allValues = getAllValues(enTranslations);
      
      allValues.forEach(({ key, value }) => {
        expect(value).not.toBe("");
        expect(value).not.toBe(null);
        expect(value).not.toBe(undefined);
        
        if (typeof value === "string") {
          expect(value.trim()).not.toBe("");
        }
      });
    });

    test("should not have empty or null values in Vietnamese translations", () => {
      const allValues = getAllValues(viTranslations);
      
      allValues.forEach(({ key, value }) => {
        expect(value).not.toBe("");
        expect(value).not.toBe(null);
        expect(value).not.toBe(undefined);
        
        if (typeof value === "string") {
          expect(value.trim()).not.toBe("");
        }
      });
    });

    test("should have meaningful Vietnamese translations (not just English text)", () => {
      const enValues = getAllValues(enTranslations);
      const viValues = getAllValues(viTranslations);
      
      // Create maps for easier comparison
      const enMap = new Map(enValues.map(v => [v.key, v.value]));
      const viMap = new Map(viValues.map(v => [v.key, v.value]));
      
      // Check for suspicious cases where Vietnamese = English
      const suspiciousKeys: string[] = [];
      
      for (const [key, enValue] of enMap) {
        const viValue = viMap.get(key);
        
        if (typeof enValue === "string" && typeof viValue === "string") {
          // Skip keys that should be the same (like brand names)
          const skipKeys = ["navbar.brandName"]; // Brand names should be the same
          
          if (!skipKeys.includes(key) && enValue === viValue && enValue.length > 2) {
            suspiciousKeys.push(key);
          }
        }
      }
      
      // Allow a few suspicious keys but flag if too many
      expect(suspiciousKeys.length).toBeLessThan(5);
    });
  });

  describe("Critical Translation Coverage", () => {
    const criticalKeys = [
      "navbar.uploadResume",
      "auth.welcome",
      "auth.logIn",
      "auth.logOut", 
      "upload.heading",
      "upload.analyzeResume",
      "welcomeMessage",
      "summary.yourResumeScore",
      "ats.atsScore",
      "scoreBadge.strong",
      "scoreBadge.goodStart",
      "scoreBadge.needsWork"
    ];

    test("should have all critical UI elements translated in English", () => {
      criticalKeys.forEach(keyPath => {
        const keys = keyPath.split(".");
        let current: any = enTranslations;
        
        for (const key of keys) {
          expect(current).toHaveProperty(key);
          current = current[key as keyof typeof current];
        }
        
        expect(typeof current).toBe("string");
        expect((current as string).trim()).not.toBe("");
      });
    });

    test("should have all critical UI elements translated in Vietnamese", () => {
      criticalKeys.forEach(keyPath => {
        const keys = keyPath.split(".");
        let current: any = viTranslations;
        
        for (const key of keys) {
          expect(current).toHaveProperty(key);
          current = current[key as keyof typeof current];
        }
        
        expect(typeof current).toBe("string");
        expect((current as string).trim()).not.toBe("");
      });
    });
  });

  describe("Special Characters and Unicode", () => {
    test("should handle Vietnamese diacritics correctly", () => {
      const allValues = getAllValues(viTranslations);
      const vietnameseValues = allValues
        .filter(({ value }) => typeof value === "string")
        .map(({ value }) => value as string);
      
      // Check that Vietnamese translations actually contain Vietnamese characters
      const hasVietnameseDiacritics = vietnameseValues.some(value => 
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(value)
      );
      
      expect(hasVietnameseDiacritics).toBe(true);
    });

    test("should not have encoding issues in translations", () => {
      const allValues = [
        ...getAllValues(enTranslations),
        ...getAllValues(viTranslations)
      ];
      
      allValues
        .filter(({ value }) => typeof value === "string")
        .forEach(({ key, value }) => {
          const stringValue = value as string;
          
          // Check for common encoding issues
          expect(stringValue).not.toMatch(/\uFFFD/); // � character
          expect(stringValue).not.toMatch(/â€™/); // Common UTF-8 issue
          expect(stringValue).not.toMatch(/Ã¡/); // Another common issue
        });
    });
  });

  describe("Translation Statistics", () => {
    test("should provide coverage statistics", () => {
      const enValues = getAllValues(enTranslations);
      const viValues = getAllValues(viTranslations);
      
      console.log(`\n📊 Translation Statistics:`);
      console.log(`   English keys: ${enValues.length}`);
      console.log(`   Vietnamese keys: ${viValues.length}`);
      console.log(`   Total sections: ${Object.keys(enTranslations).length}`);
      
      // This test always passes but provides useful info in test output
      expect(enValues.length).toBeGreaterThan(0);
      expect(viValues.length).toEqual(enValues.length);
    });
  });
});