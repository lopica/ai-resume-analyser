import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { puterApiSlice } from '~/lib/puterApiSlice';
import puterSlice, { checkAuthStatus, setPuter, setUser } from '~/lib/puterSlice';

// Define the PuterUser type (should match your actual type)
interface PuterUser {
  id: string;
  username: string;
  email?: string;
}

// Mock the puter module BEFORE importing anything else
vi.mock('~/lib/puter', () => {
  const mockPuter = {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      isSignedIn: vi.fn()
    },
    fs: {
      write: vi.fn(),
      read: vi.fn(),
      readdir: vi.fn(),
      upload: vi.fn(),
      delete: vi.fn()
    },
    ai: {
      chat: vi.fn(),
      img2txt: vi.fn()
    },
    kv: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      flush: vi.fn()
    }
  };

  const mockGetPuter = vi.fn(() => mockPuter);

  return {
    getPuter: mockGetPuter,
    // Export the mock objects so we can access them in tests
    __mockPuter: mockPuter,
    __mockGetPuter: mockGetPuter
  };
});

// Import the mocked functions
import { getPuter } from '~/lib/puter';

// Get access to the mock objects
const mockGetPuter = (getPuter as any).__mockGetPuter || getPuter;
const mockPuter = (getPuter as any).__mockPuter || {
  auth: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    isSignedIn: vi.fn()
  },
  fs: {
    write: vi.fn(),
    read: vi.fn(),
    readdir: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn()
  },
  ai: {
    chat: vi.fn(),
    img2txt: vi.fn()
  },
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    flush: vi.fn()
  }
};

// Test store setup
function createTestStore() {
  return configureStore({
    reducer: {
      [puterSlice.name]: puterSlice.reducer,
      [puterApiSlice.reducerPath]: puterApiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware().concat(puterApiSlice.middleware),
  });
}

describe('puterSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
    // Reset the mock to return mockPuter by default
    if (mockGetPuter && mockGetPuter.mockReturnValue) {
      mockGetPuter.mockReturnValue(mockPuter);
    }
  });

  describe('reducers', () => {
    it('should handle setUser with user data', () => {
      const mockUser: PuterUser = { id: '123', username: 'testuser', email: 'test@example.com' };
      
      store.dispatch(setUser({ user: mockUser }));
      
      const state = store.getState();
      expect(state.puter.auth.user).toEqual(mockUser);
      expect(state.puter.auth.isAuthenticated).toBe(true);
    });

    it('should handle setUser with null user', () => {
      // First set a user
      const mockUser: PuterUser = { id: '123', username: 'testuser' };
      store.dispatch(setUser({ user: mockUser }));
      
      // Then set to null
      store.dispatch(setUser({ user: null }));
      
      const state = store.getState();
      expect(state.puter.auth.user).toBe(null);
      expect(state.puter.auth.isAuthenticated).toBe(false);
    });

    it('should handle setPuter', () => {
      store.dispatch(setPuter(true));
      
      const state = store.getState();
      expect(state.puter.puterReady).toBe(true);
    });

    it('should handle setPuter false', () => {
      // First set to true
      store.dispatch(setPuter(true));
      // Then set to false
      store.dispatch(setPuter(false));
      
      const state = store.getState();
      expect(state.puter.puterReady).toBe(false);
    });
  });

  describe('checkAuthStatus async thunk', () => {
    it('should check auth status and set user when signed in', async () => {
      const mockUser: PuterUser = { id: '123', username: 'testuser' };
      mockPuter.auth.isSignedIn.mockResolvedValue(true);
      mockPuter.auth.getUser.mockResolvedValue(mockUser);

      const result = await store.dispatch(checkAuthStatus());

      // Check that the async thunk was fulfilled
      expect(checkAuthStatus.fulfilled.match(result)).toBe(true);
      // Since your original async thunk doesn't return anything, payload is undefined
      expect(result.payload).toBeUndefined();
      
      const state = store.getState();
      expect(state.puter.auth.user).toEqual(mockUser);
      expect(state.puter.auth.isAuthenticated).toBe(true);
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).toHaveBeenCalled();
    });

    it('should set user to null when not signed in', async () => {
      mockPuter.auth.isSignedIn.mockResolvedValue(false);

      const result = await store.dispatch(checkAuthStatus());

      // Check that the async thunk was fulfilled
      expect(checkAuthStatus.fulfilled.match(result)).toBe(true);
      // Since your original async thunk doesn't return anything, payload is undefined
      expect(result.payload).toBeUndefined();
      
      const state = store.getState();
      expect(state.puter.auth.user).toBe(null);
      expect(state.puter.auth.isAuthenticated).toBe(false);
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).not.toHaveBeenCalled();
    });

    it('should handle puter not available', async () => {
      // Mock getPuter to return null
      if (mockGetPuter && mockGetPuter.mockReturnValue) {
        mockGetPuter.mockReturnValue(null as any);
      }

      const result = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Puter.js not available');
      
      // Verify that puter methods were not called
      expect(mockPuter.auth.isSignedIn).not.toHaveBeenCalled();
      expect(mockPuter.auth.getUser).not.toHaveBeenCalled();
    });

    it('should handle auth check errors', async () => {
      const error = new Error('Auth check failed');
      mockPuter.auth.isSignedIn.mockRejectedValue(error);

      const result = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Auth check failed');
      
      // Verify isSignedIn was called but getUser was not
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      mockPuter.auth.isSignedIn.mockRejectedValue('String error');

      const result = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Failed to check auth status');
      
      // Verify isSignedIn was called but getUser was not
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).not.toHaveBeenCalled();
    });

    it('should handle getUser errors after successful auth check', async () => {
      const error = new Error('Failed to get user');
      mockPuter.auth.isSignedIn.mockResolvedValue(true);
      mockPuter.auth.getUser.mockRejectedValue(error);

      const result = await store.dispatch(checkAuthStatus());
      
      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Failed to get user');
      
      // Verify both methods were called
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).toHaveBeenCalled();
    });

    it('should handle user state properly when switching between signed in/out', async () => {
      const mockUser: PuterUser = { id: '123', username: 'testuser' };

      // First, sign in
      mockPuter.auth.isSignedIn.mockResolvedValue(true);
      mockPuter.auth.getUser.mockResolvedValue(mockUser);
      
      await store.dispatch(checkAuthStatus());
      
      let state = store.getState();
      expect(state.puter.auth.user).toEqual(mockUser);
      expect(state.puter.auth.isAuthenticated).toBe(true);

      // Reset mocks for the next call
      vi.clearAllMocks();
      if (mockGetPuter && mockGetPuter.mockReturnValue) {
        mockGetPuter.mockReturnValue(mockPuter);
      }

      // Then, sign out
      mockPuter.auth.isSignedIn.mockResolvedValue(false);
      
      await store.dispatch(checkAuthStatus());
      
      state = store.getState();
      expect(state.puter.auth.user).toBe(null);
      expect(state.puter.auth.isAuthenticated).toBe(false);
    });
  });

  describe('integration with store', () => {
    it('should maintain state correctly across multiple actions', () => {
      // Test multiple state changes
      store.dispatch(setPuter(true));
      expect(store.getState().puter.puterReady).toBe(true);

      const user: PuterUser = { id: '456', username: 'integration-test' };
      store.dispatch(setUser({ user }));
      expect(store.getState().puter.auth.user).toEqual(user);
      expect(store.getState().puter.auth.isAuthenticated).toBe(true);

      // Ensure puterReady state is preserved
      expect(store.getState().puter.puterReady).toBe(true);

      // Clear user
      store.dispatch(setUser({ user: null }));
      expect(store.getState().puter.auth.user).toBe(null);
      expect(store.getState().puter.auth.isAuthenticated).toBe(false);

      // Ensure puterReady state is still preserved
      expect(store.getState().puter.puterReady).toBe(true);
    });

    it('should have correct initial state', () => {
      const state = store.getState();
      expect(state.puter).toEqual({
        puterReady: false,
        auth: {
          user: null,
          isAuthenticated: false
        }
      });
    });
  });
});