import { describe, test, expect, vi } from "vitest";
import { formatSize, generateUUID, cn } from "../utils";

describe('utils', () => {
  describe('formatSize', () => {
    // Test the function that converts bytes to human-readable format
    test('should return "0 Bytes" for 0 bytes', () => {
      expect(formatSize(0)).toBe('0 Bytes');
    });

    // Test small numbers in bytes
    test('should format bytes correctly', () => {
      expect(formatSize(500)).toBe('500 Bytes');
      expect(formatSize(1023)).toBe('1023 Bytes');
    });

    // Test KB conversion
    test('should format KB correctly', () => {
      expect(formatSize(1024)).toBe('1 KB');
      expect(formatSize(2048)).toBe('2 KB');
      expect(formatSize(1536)).toBe('1.5 KB');
    });

    // Test MB conversion
    test('should format MB correctly', () => {
      expect(formatSize(1048576)).toBe('1 MB'); // 1024 * 1024
      expect(formatSize(2097152)).toBe('2 MB'); // 2 * 1024 * 1024
    });

    // Test GB conversion
    test('should format GB correctly', () => {
      expect(formatSize(1073741824)).toBe('1 GB'); // 1024^3
    });

    // Test TB conversion (edge case)
    test('should format TB correctly', () => {
      expect(formatSize(1099511627776)).toBe('1 TB'); // 1024^4
    });
  });

  describe('generateUUID', () => {
    // Test that the function generates a valid UUID format
    test('should generate a valid UUID', () => {
      const uuid = generateUUID();
      
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    // Test that each call generates a unique UUID
    test('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('cn (className utility)', () => {
    // Test basic functionality combining classnames with clsx and tailwind-merge
    test('should combine classnames', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    // Test conditional classnames (clsx functionality)
    test('should handle conditional classnames', () => {
      expect(cn('base-class', { 'conditional-class': true })).toContain('conditional-class');
      expect(cn('base-class', { 'conditional-class': false })).not.toContain('conditional-class');
    });

    // Test array inputs
    test('should handle array inputs', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    // Test tailwind merge functionality (conflicting classes)
    test('should merge conflicting Tailwind classes', () => {
      // Later class should override earlier ones for same property
      const result = cn('text-red-500 text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    // Test with undefined/null values
    test('should handle undefined and null values', () => {
      expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2');
    });
  });
});