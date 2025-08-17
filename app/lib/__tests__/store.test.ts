import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";
import { puterApiSlice } from "~/lib/puterApiSlice";
import puterSlice from "~/lib/puterSlice";

// Mock the puter module
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

vi.mock('./puter', () => ({
  getPuter: vi.fn(() => mockPuter)
}));

// Mock URL.createObjectURL for file operations
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-blob-url')
  },
  writable: true
});

// Mock File and Blob constructors
global.File = class MockFile {
  name: string;
  type: string;
  constructor(chunks: any[], filename: string, options?: { type?: string }) {
    this.name = filename;
    this.type = options?.type || '';
  }
} as any;

global.Blob = class MockBlob {
  type: string;
  constructor(chunks: any[], options?: { type?: string }) {
    this.type = options?.type || '';
  }
} as any;

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

describe('Store Configuration', () => {
  it('should create store with correct reducers', () => {
    const store = createTestStore();
    const state = store.getState();
    
    expect(state).toHaveProperty('puter');
    expect(state).toHaveProperty('puterApi');
    expect(state.puter).toEqual({
      puterReady: false,
      auth: {
        user: null,
        isAuthenticated: false
      }
    });
  });

  it('should have correct initial state types', () => {
    const store = createTestStore();
    const state = store.getState();
    
    expect(typeof state.puter.puterReady).toBe('boolean');
    expect(state.puter.auth.user).toBe(null);
    expect(typeof state.puter.auth.isAuthenticated).toBe('boolean');
  });
});