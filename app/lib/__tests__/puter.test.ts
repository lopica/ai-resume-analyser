import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { getPuter } from "../puter";

/*
 * Test strategy for puter utility:
 * 
 * This module provides a simple utility function getPuter() that safely accesses
 * the global window.puter object. Key scenarios to test:
 * 
 * 1. Server-side environment: window is undefined
 * 2. Client-side without Puter.js: window exists but window.puter is undefined  
 * 3. Client-side with Puter.js: window.puter exists and should be returned
 * 
 * Since we're testing browser/window behavior, we need to mock the global window object
 * for different scenarios.
 */
describe('getPuter', () => {
  let originalWindow: any;
  
  beforeEach(() => {
    // Save the original window object
    originalWindow = global.window;
  });

  afterEach(() => {
    // Restore the original window object
    global.window = originalWindow;
  });

  // Test server-side environment where window is undefined
  test('should return null when window is undefined (server-side)', () => {
    // Simulate server-side environment by redefining window property
    const originalWindow = global.window;
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    
    const result = getPuter();
    expect(result).toBe(null);
    
    // Restore window for other tests
    global.window = originalWindow;
  });

  // Test client-side environment where window exists but puter is not loaded
  test('should return null when window exists but puter is undefined', () => {
    // Simulate browser environment without Puter.js
    // Create a minimal window-like object with proper typing
    const mockWindow = {
      location: { href: 'http://localhost' },
      document: {},
    };
    // Using 'as' here is necessary to mock the complex Window interface for testing
    global.window = mockWindow as Window & typeof globalThis;
    
    const result = getPuter();
    expect(result).toBe(null);
  });

  // Test client-side environment where puter is loaded and available
  test('should return puter object when available', () => {
    // Mock puter object with basic structure
    const mockPuter = {
      auth: {
        getUser: () => Promise.resolve({}),
        isSignedIn: () => Promise.resolve(false),
        signIn: () => Promise.resolve(),
        signOut: () => Promise.resolve(),
      },
      fs: {
        write: () => Promise.resolve(),
        read: () => Promise.resolve(new Blob()),
        upload: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        readdir: () => Promise.resolve([]),
      },
      ai: {
        chat: () => Promise.resolve({}),
        img2txt: () => Promise.resolve(''),
      },
      kv: {
        get: () => Promise.resolve(null),
        set: () => Promise.resolve(true),
        delete: () => Promise.resolve(true),
        list: () => Promise.resolve([]),
        flush: () => Promise.resolve(true),
      },
    };

    // Simulate browser environment with Puter.js loaded
    // Using 'as unknown as' here is necessary to mock the complex Window interface for testing
    global.window = {
      puter: mockPuter,
    } as unknown as Window & typeof globalThis;
    
    const result = getPuter();
    expect(result).toBe(mockPuter);
    expect(result).toHaveProperty('auth');
    expect(result).toHaveProperty('fs');
    expect(result).toHaveProperty('ai');
    expect(result).toHaveProperty('kv');
  });

  // Test edge case where window exists but puter is explicitly null
  test('should return null when puter is explicitly null', () => {
    // Using 'as' here is necessary to mock the complex Window interface for testing
    global.window = {
      puter: null,
    } as unknown as Window & typeof globalThis;
    
    const result = getPuter();
    expect(result).toBe(null);
  });

  // Test edge case where window exists but puter is falsy (empty object, etc.)
  test('should return null when puter is falsy', () => {
    // Using 'as' here is necessary to mock the complex Window interface for testing
    global.window = {
      puter: false,
    } as unknown as Window & typeof globalThis;
    
    const result = getPuter();
    expect(result).toBe(null);
  });
});