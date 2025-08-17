import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import { puterApiSlice } from '~/lib/puterApiSlice';
import puterSlice, { checkAuthStatus, setPuter, setUser } from '~/lib/puterSlice';

// --- mock getPuter before importing slice uses it ---
vi.mock('~/lib/puter', () => ({
  getPuter: vi.fn()
}));
import { getPuter } from '~/lib/puter';

// Shared mock object
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

// Test store setup
function createTestStore() {
  return configureStore({
    reducer: {
      puter: puterSlice.reducer, // explicitly "puter" key
      [puterApiSlice.reducerPath]: puterApiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(puterApiSlice.middleware),
  });
}

const mockedGetPuter = getPuter as MockedFunction<typeof getPuter>

describe('puterSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();

    // default behavior: always return mockPuter
    mockedGetPuter.mockReturnValue(mockPuter);
  });

  describe('reducers', () => {
    it('should handle setUser with user data', () => {
      const mockUser = { id: '123', username: 'testuser', email: 'test@example.com' };

      store.dispatch(setUser({ user: mockUser }));

      const state = store.getState();
      expect(state.puter.auth.user).toEqual(mockUser);
      expect(state.puter.auth.isAuthenticated).toBe(true);
    });

    it('should handle setUser with null user', () => {
      const mockUser = { id: '123', username: 'testuser' };
      store.dispatch(setUser({ user: mockUser }));
      store.dispatch(setUser({ user: null }));

      const state = store.getState();
      expect(state.puter.auth.user).toBe(null);
      expect(state.puter.auth.isAuthenticated).toBe(false);
    });

    it('should handle setPuter true', () => {
      store.dispatch(setPuter(true));

      const state = store.getState();
      expect(state.puter.puterReady).toBe(true);
    });

    it('should handle setPuter false', () => {
      store.dispatch(setPuter(true));
      store.dispatch(setPuter(false));

      const state = store.getState();
      expect(state.puter.puterReady).toBe(false);
    });
  });

  describe('checkAuthStatus async thunk', () => {
    it('should check auth status and set user when signed in', async () => {
      const mockUser = { id: '123', username: 'testuser' };
      mockPuter.auth.isSignedIn.mockResolvedValue(true);
      mockPuter.auth.getUser.mockResolvedValue(mockUser);

      const result = await store.dispatch(checkAuthStatus());

      expect(checkAuthStatus.fulfilled.match(result)).toBe(true);
      const state = store.getState();
      expect(state.puter.auth.user).toEqual(mockUser);
      expect(state.puter.auth.isAuthenticated).toBe(true);
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).toHaveBeenCalled();
    });

    it('should set user to null when not signed in', async () => {
      mockPuter.auth.isSignedIn.mockResolvedValue(false);

      const result = await store.dispatch(checkAuthStatus());

      expect(checkAuthStatus.fulfilled.match(result)).toBe(true);
      const state = store.getState();
      expect(state.puter.auth.user).toBe(null);
      expect(state.puter.auth.isAuthenticated).toBe(false);
      expect(mockPuter.auth.isSignedIn).toHaveBeenCalled();
      expect(mockPuter.auth.getUser).not.toHaveBeenCalled();
    });

    it('should handle puter not available', async () => {
      mockedGetPuter.mockReturnValue(null);

      const result = await store.dispatch(checkAuthStatus());

      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Puter.js not available');
    });

    it('should handle auth check errors', async () => {
      const error = new Error('Auth check failed');
      mockPuter.auth.isSignedIn.mockRejectedValue(error);

      const result = await store.dispatch(checkAuthStatus());

      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Auth check failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockPuter.auth.isSignedIn.mockRejectedValue('String error');

      const result = await store.dispatch(checkAuthStatus());

      expect(checkAuthStatus.rejected.match(result)).toBe(true);
      expect(result.payload).toBe('Failed to check auth status');
    });
  });
});
