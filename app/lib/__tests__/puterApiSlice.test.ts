/// <reference types="../../../types/puter.d.ts" />
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { puterApiSlice } from "../puterApiSlice";
import type { AppDispatch } from "../store";

// Mock the puter module
vi.mock("../puter", () => ({
  getPuter: vi.fn(),
}));

// Mock the puterSlice actions
vi.mock("../puterSlice", () => ({
  checkAuthStatus: vi.fn(() => ({ type: "puter/checkAuthStatus" })),
  setPuter: vi.fn((payload) => ({ type: "puter/setPuter", payload })),
  setUser: vi.fn((payload) => ({ type: "puter/setUser", payload })),
}));

/*
 * Test strategy for puterApiSlice (RTK Query):
 * 
 * This is a complex RTK Query API slice with multiple endpoints covering:
 * 1. Auth endpoints (signIn, signOut, refreshUser, init)
 * 2. File system endpoints (fsWrite, fsRead, fsReadir, fsUpload, fsDelete)
 * 3. AI endpoints (aiChat, aiFeedback, aiImg2txt)  
 * 4. Key-Value store endpoints (kvGet, kvSet, kvDelete, kvList, kvFlush)
 * 
 * Testing strategy:
 * - Focus on core patterns rather than testing every endpoint exhaustively
 * - Test success cases, error cases, and puter unavailable scenarios
 * - Use representative endpoints from each category
 * - Mock getPuter() function to simulate different conditions
 * 
 * Note: Full integration testing would require extensive mocking of Puter.js APIs.
 * Here we focus on the slice structure and key endpoint behaviors.
 */
type TestStoreState = {
  [key: string]: unknown;
};

describe('puterApiSlice', () => {
  let store: ReturnType<typeof configureStore<TestStoreState>> & { dispatch: AppDispatch };
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        [puterApiSlice.reducerPath]: puterApiSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(puterApiSlice.middleware),
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test basic API slice configuration
  test('should have correct reducer path and tag types', () => {
    expect(puterApiSlice.reducerPath).toBe('puterApi');
    
    // Check that the slice is properly configured
    const state = store.getState();
    // Access the reducer state directly by its path - no need for 'as' with proper typing
    const puterApiState = state[puterApiSlice.reducerPath];
    expect(puterApiState).toBeDefined();
    expect(puterApiState).toHaveProperty('queries');
    expect(puterApiState).toHaveProperty('mutations');
  });

  /*
   * Test strategy for auth endpoints:
   * Test representative auth endpoint (signIn) with success/failure scenarios
   */
  describe('auth endpoints', () => {
    let mockGetPuter: ReturnType<typeof vi.fn>;
    
    beforeEach(async () => {
      const puterModule = await import("../puter");
      // Use vi.mocked to avoid 'as' operator - better type-safe way to access mocked function
      mockGetPuter = vi.mocked(puterModule.getPuter);
    });

    // Test signIn success scenario  
    test('signIn should succeed when puter is available', async () => {
      const mockPuter = {
        auth: {
          signIn: vi.fn().mockResolvedValue(undefined),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      const result = await store.dispatch(
        puterApiSlice.endpoints.signIn.initiate()
      ).unwrap();

      expect(result).toBeUndefined();
      expect(mockPuter.auth.signIn).toHaveBeenCalled();
    });

    // Test signIn when puter is not available
    test('signIn should fail when puter is not available', async () => {
      mockGetPuter.mockReturnValue(null);

      try {
        await store.dispatch(
          puterApiSlice.endpoints.signIn.initiate()
        ).unwrap();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBe("Puter.js not available");
      }
    });

    // Test signIn error handling
    test('signIn should handle auth errors', async () => {
      const mockPuter = {
        auth: {
          signIn: vi.fn().mockRejectedValue(new Error('Sign in failed')),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      try {
        await store.dispatch(
          puterApiSlice.endpoints.signIn.initiate()
        ).unwrap();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBe('Sign in failed');
      }
    });
  });

  /*
   * Test strategy for filesystem endpoints:
   * Test representative filesystem endpoint (fsWrite) with different scenarios
   */
  describe('filesystem endpoints', () => {
    let mockGetPuter: ReturnType<typeof vi.fn>;
    
    beforeEach(async () => {
      const puterModule = await import("../puter");
      // Use vi.mocked to avoid 'as' operator - better type-safe way to access mocked function
      mockGetPuter = vi.mocked(puterModule.getPuter);
    });

    // Test fsWrite success scenario
    test('fsWrite should succeed when puter is available', async () => {
      // Use simple object to avoid serialization issues with File objects
      const mockFileResponse = { name: 'test.txt', path: '/test.txt' };
      const mockPuter = {
        fs: {
          write: vi.fn().mockResolvedValue(mockFileResponse),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      const result = await store.dispatch(
        puterApiSlice.endpoints.fsWrite.initiate({
          path: '/test.txt',
          data: 'test content'
        })
      ).unwrap();

      expect(result).toBe(mockFileResponse);
      expect(mockPuter.fs.write).toHaveBeenCalledWith('/test.txt', 'test content');
    });

    // Test fsWrite when puter is not available
    test('fsWrite should fail when puter is not available', async () => {
      mockGetPuter.mockReturnValue(null);

      try {
        await store.dispatch(
          puterApiSlice.endpoints.fsWrite.initiate({
            path: '/test.txt',
            data: 'test content'
          })
        ).unwrap();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBe("Puter.js not available");
      }
    });
  });

  /*
   * Test strategy for AI endpoints:
   * Test representative AI endpoint (aiChat) with different input types
   */
  describe('AI endpoints', () => {
    let mockGetPuter: ReturnType<typeof vi.fn>;
    
    beforeEach(async () => {
      const puterModule = await import("../puter");
      // Use vi.mocked to avoid 'as' operator - better type-safe way to access mocked function
      mockGetPuter = vi.mocked(puterModule.getPuter);
    });

    // Test aiChat with string prompt
    test('aiChat should handle string prompts', async () => {
      const mockResponse = { message: 'AI response', id: '123' };
      const mockPuter = {
        ai: {
          chat: vi.fn().mockResolvedValue(mockResponse),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      const result = await store.dispatch(
        puterApiSlice.endpoints.aiChat.initiate({
          prompt: 'Hello AI',
        })
      ).unwrap();

      expect(result).toBe(mockResponse);
      expect(mockPuter.ai.chat).toHaveBeenCalledWith('Hello AI', undefined, undefined, undefined);
    });

    // Test aiChat with message array
    test('aiChat should handle message arrays', async () => {
      const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
      const mockResponse = { message: 'AI response' };
      const mockPuter = {
        ai: {
          chat: vi.fn().mockResolvedValue(mockResponse),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      const result = await store.dispatch(
        puterApiSlice.endpoints.aiChat.initiate({
          prompt: mockMessages,
          testMode: true,
        })
      ).unwrap();

      expect(result).toBe(mockResponse);
      expect(mockPuter.ai.chat).toHaveBeenCalledWith(mockMessages, undefined, true, undefined);
    });
  });

  /*
   * Test strategy for KV endpoints:
   * Test representative KV endpoint (kvGet) with different value scenarios
   */
  describe('key-value store endpoints', () => {
    let mockGetPuter: ReturnType<typeof vi.fn>;
    
    beforeEach(async () => {
      const puterModule = await import("../puter");
      // Use vi.mocked to avoid 'as' operator - better type-safe way to access mocked function
      mockGetPuter = vi.mocked(puterModule.getPuter);
    });

    // Test kvGet with existing key
    test('kvGet should return value for existing key', async () => {
      const mockPuter = {
        kv: {
          get: vi.fn().mockResolvedValue('stored value'),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      const result = await store.dispatch(
        puterApiSlice.endpoints.kvGet.initiate('test-key')
      ).unwrap();

      expect(result).toBe('stored value');
      expect(mockPuter.kv.get).toHaveBeenCalledWith('test-key');
    });

    // Test kvGet with non-existent key
    test('kvGet should return null for non-existent key', async () => {
      const mockPuter = {
        kv: {
          get: vi.fn().mockResolvedValue(null),
        },
      };
      mockGetPuter.mockReturnValue(mockPuter);

      const result = await store.dispatch(
        puterApiSlice.endpoints.kvGet.initiate('non-existent-key')
      ).unwrap();

      expect(result).toBe(null);
    });
  });

  // Test that all expected hooks are exported
  test('should export all endpoint hooks', () => {
    const hooks = puterApiSlice;
    
    // Verify some key hooks exist (not exhaustive, just representative)
    expect(typeof hooks.useSignInMutation).toBe('function');
    expect(typeof hooks.useFsWriteMutation).toBe('function');
    expect(typeof hooks.useAiChatMutation).toBe('function');
    expect(typeof hooks.useKvGetQuery).toBe('function');
  });
});