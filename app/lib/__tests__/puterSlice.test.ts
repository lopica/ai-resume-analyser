import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import puterSlice, { setUser, setPuter, checkAuthStatus } from "../puterSlice";
import type { RootState, AppDispatch } from "../store";

// Mock the puter module
vi.mock("../puter", () => ({
  getPuter: vi.fn(),
}));

/*
 * Test strategy for puterSlice:
 * 
 * This slice manages Puter.js integration state with two main areas:
 * 1. Synchronous reducers (setUser, setPuter): Test state updates directly
 * 2. Async thunk (checkAuthStatus): Test different scenarios with mocked dependencies
 * 
 * Key test scenarios:
 * - Initial state verification
 * - Synchronous action state updates  
 * - Async thunk success/failure cases
 * - Authentication state management logic
 * 
 * The async thunk depends on getPuter() function, so we mock it to simulate
 * different conditions (puter available/unavailable, signed in/out, errors).
 */
type TestStoreState = {
  puter: ReturnType<typeof puterSlice.reducer>;
};

describe('puterSlice', () => {
  let store: ReturnType<typeof configureStore<TestStoreState>> & { dispatch: AppDispatch };
  
  beforeEach(() => {
    // Create a fresh store for each test to avoid state pollution
    store = configureStore({
      reducer: {
        puter: puterSlice.reducer,
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test initial state values
  test('should have correct initial state', () => {
    const state = store.getState();
    const puterState = state.puter;
    expect(puterState).toEqual({
      puterReady: false,
      auth: {
        user: null,
        isAuthenticated: false,
      },
    });
  });

  /*
   * Test strategy for synchronous reducers:
   * Test each reducer with different payload values to ensure state updates correctly
   */
  describe('synchronous actions', () => {
    // Test setPuter action with true/false values
    test('setPuter should update puterReady state', () => {
      store.dispatch(setPuter(true));
      expect(store.getState().puter.puterReady).toBe(true);
      
      store.dispatch(setPuter(false));
      expect(store.getState().puter.puterReady).toBe(false);
    });

    // Test setUser action with user object (sign in scenario)
    test('setUser should update auth state with user', () => {
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      
      store.dispatch(setUser({ user: mockUser }));
      const puterState = store.getState().puter;
      
      expect(puterState.auth.user).toEqual(mockUser);
      expect(puterState.auth.isAuthenticated).toBe(true);
    });

    // Test setUser action with null (sign out scenario)  
    test('setUser should update auth state with null user', () => {
      // First set a user
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      store.dispatch(setUser({ user: mockUser }));
      
      // Then clear the user
      store.dispatch(setUser({ user: null }));
      const puterState = store.getState().puter;
      
      expect(puterState.auth.user).toBe(null);
      expect(puterState.auth.isAuthenticated).toBe(false);
    });
  });

  /*
   * Test strategy for checkAuthStatus async thunk:
   * Mock getPuter() to return different scenarios and test the thunk behavior:
   * 1. Puter not available (null)
   * 2. User signed in successfully  
   * 3. User not signed in
   * 4. Error during auth check
   */
  describe('checkAuthStatus async thunk', () => {
    let mockGetPuter: ReturnType<typeof vi.fn>;
    
    beforeEach(async () => {
      const puterModule = await import("../puter");
      // Use vi.mocked to avoid 'as' operator - better type-safe way to access mocked function
      mockGetPuter = vi.mocked(puterModule.getPuter);
    });

    // Test when Puter.js is not available
    test('should reject when puter is not available', async () => {
      mockGetPuter.mockReturnValue(null);
      
      const resultAction = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(resultAction)).toBe(true);
      if (checkAuthStatus.rejected.match(resultAction)) {
        expect(resultAction.payload).toBe("Puter.js not available");
      }
    });

    // Test successful auth check with signed-in user
    test('should set user when user is signed in', async () => {
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      const mockPuter = {
        auth: {
          isSignedIn: vi.fn().mockResolvedValue(true),
          getUser: vi.fn().mockResolvedValue(mockUser),
        },
      };
      
      mockGetPuter.mockReturnValue(mockPuter);
      
      const resultAction = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.fulfilled.match(resultAction)).toBe(true);
      const puterState = store.getState().puter;
      expect(puterState.auth.user).toEqual(mockUser);
      expect(puterState.auth.isAuthenticated).toBe(true);
    });

    // Test successful auth check with no signed-in user
    test('should clear user when user is not signed in', async () => {
      const mockPuter = {
        auth: {
          isSignedIn: vi.fn().mockResolvedValue(false),
          getUser: vi.fn(),
        },
      };
      
      mockGetPuter.mockReturnValue(mockPuter);
      
      const resultAction = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.fulfilled.match(resultAction)).toBe(true);
      const puterState = store.getState().puter;
      expect(puterState.auth.user).toBe(null);
      expect(puterState.auth.isAuthenticated).toBe(false);
    });

    // Test error handling during auth check
    test('should reject when auth check throws error', async () => {
      const mockPuter = {
        auth: {
          isSignedIn: vi.fn().mockRejectedValue(new Error('Auth check failed')),
          getUser: vi.fn(),
        },
      };
      
      mockGetPuter.mockReturnValue(mockPuter);
      
      const resultAction = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(resultAction)).toBe(true);
      if (checkAuthStatus.rejected.match(resultAction)) {
        expect(resultAction.payload).toBe('Auth check failed');
      }
    });

    // Test error handling with non-Error object
    test('should handle non-Error rejection', async () => {
      const mockPuter = {
        auth: {
          isSignedIn: vi.fn().mockRejectedValue('String error'),
          getUser: vi.fn(),
        },
      };
      
      mockGetPuter.mockReturnValue(mockPuter);
      
      const resultAction = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(resultAction)).toBe(true);
      if (checkAuthStatus.rejected.match(resultAction)) {
        expect(resultAction.payload).toBe('Failed to check auth status');
      }
    });
  });
});