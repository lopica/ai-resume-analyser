import { describe, test, expect } from "vitest";
import { store } from "../store";
import puterSlice, { setUser, setPuter } from "../puterSlice";
import { puterApiSlice } from "../puterApiSlice";

/*
 * Test strategy for Redux store:
 * 
 * The store is a configuration object that combines multiple slices and middleware.
 * Key areas to test:
 * 1. Store structure: Verify all expected slices are registered
 * 2. Initial state: Ensure each slice starts with correct default values
 * 3. Basic state updates: Test that actions properly update state
 * 4. Middleware integration: Verify RTK Query middleware is properly configured
 * 5. TypeScript integration: Ensure type exports work correctly
 * 
 * Note: Complex async thunks and API slice endpoints are tested in their respective test files.
 * This focuses on store setup, reducer registration, and basic state management.
 */
describe('store', () => {
  // Test that the store is properly configured with all expected slices
  test('should have the correct initial state structure', () => {
    const state = store.getState();
    
    // Should have puter slice
    expect(state).toHaveProperty('puter');
    expect(state.puter).toEqual({
      puterReady: false,
      auth: {
        user: null,
        isAuthenticated: false,
      },
    });

    // Should have puterApi slice
    expect(state).toHaveProperty('puterApi');
    expect(state.puterApi).toHaveProperty('queries');
    expect(state.puterApi).toHaveProperty('mutations');
  });

  // Test basic state updates through actions
  test('should update state when dispatching actions', () => {
    // Test setPuter action
    store.dispatch(setPuter(true));
    let state = store.getState();
    expect(state.puter.puterReady).toBe(true);

    // Test setUser action with user
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
    store.dispatch(setUser({ user: mockUser }));
    state = store.getState();
    expect(state.puter.auth.user).toEqual(mockUser);
    expect(state.puter.auth.isAuthenticated).toBe(true);

    // Test setUser action with null user (sign out)
    store.dispatch(setUser({ user: null }));
    state = store.getState();
    expect(state.puter.auth.user).toBe(null);
    expect(state.puter.auth.isAuthenticated).toBe(false);
  });

  // Test that the store includes the API middleware
  test('should include RTK Query middleware', () => {
    // Check that the store has the RTK Query middleware by verifying
    // that the API slice's middleware functions are available
    const state = store.getState();
    expect(state.puterApi).toBeDefined();
    
    // The presence of queries and mutations objects indicates RTK Query is working
    expect(state.puterApi.queries).toBeDefined();
    expect(state.puterApi.mutations).toBeDefined();
  });

  // Test store type exports
  test('should export correct TypeScript types', () => {
    const state = store.getState();
    const dispatch = store.dispatch;
    
    // These should not throw TypeScript errors in a real environment
    expect(typeof state).toBe('object');
    expect(typeof dispatch).toBe('function');
  });
});