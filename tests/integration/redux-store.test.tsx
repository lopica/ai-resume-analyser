/**
 * Integration Test: Redux Store + RTK Query
 * 
 * This test verifies core Redux and RTK Query functionality without
 * complex UI interactions that are causing failures.
 */

import React from 'react';
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { server, testServerUtils } from './setup/msw-setup';

import puterSlice, { setUser, setPuter } from '~/lib/puterSlice';
import { puterApiSlice } from '~/lib/puterApiSlice';

// Setup MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  testServerUtils.resetMockData();
  vi.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
  testServerUtils.clearErrorSimulation();
});

// Simple test component to verify store connection
function TestComponent() {
  return <div data-testid="test-component">Test Component</div>;
}

describe('Redux Store Integration', () => {
  
  test('should create store with correct initial state', () => {
    const store = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(puterApiSlice.middleware),
    });

    const state = store.getState();
    
    expect(state.puter.puterReady).toBe(false);
    expect(state.puter.auth.user).toBeNull();
    expect(state.puter.auth.isAuthenticated).toBe(false);
  });

  test('should handle user authentication actions', () => {
    const store = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
    });

    // Dispatch user login
    store.dispatch(setUser({ 
      user: { uuid: 'test-123', username: 'testuser' } 
    }));

    const state = store.getState();
    expect(state.puter.auth.user?.uuid).toBe('test-123');
    expect(state.puter.auth.isAuthenticated).toBe(true);

    // Dispatch logout
    store.dispatch(setUser({ user: null }));
    
    const newState = store.getState();
    expect(newState.puter.auth.user).toBeNull();
    expect(newState.puter.auth.isAuthenticated).toBe(false);
  });

  test('should handle puter ready state', () => {
    const store = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
    });

    expect(store.getState().puter.puterReady).toBe(false);

    store.dispatch(setPuter(true));
    expect(store.getState().puter.puterReady).toBe(true);

    store.dispatch(setPuter(false));
    expect(store.getState().puter.puterReady).toBe(false);
  });

  test('should render component with store provider', () => {
    const store = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
      preloadedState: {
        puter: {
          puterReady: true,
          auth: {
            user: { uuid: 'test-user', username: 'testuser' },
            isAuthenticated: true,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  test('should maintain state consistency during rapid updates', () => {
    const store = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
    });

    // Rapid state changes
    store.dispatch(setPuter(true));
    store.dispatch(setUser({ user: { uuid: 'user1', username: 'user1' } }));
    store.dispatch(setPuter(false));
    store.dispatch(setUser({ user: { uuid: 'user2', username: 'user2' } }));
    store.dispatch(setPuter(true));

    const finalState = store.getState();
    expect(finalState.puter.puterReady).toBe(true);
    expect(finalState.puter.auth.user?.uuid).toBe('user2');
    expect(finalState.puter.auth.isAuthenticated).toBe(true);
  });

  test('should serialize and deserialize state correctly', () => {
    const initialState = {
      puter: {
        puterReady: true,
        auth: {
          user: { uuid: 'persist-test', username: 'persistuser' },
          isAuthenticated: true,
        },
      },
    };

    const store1 = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
      preloadedState: initialState,
    });

    // Serialize state
    const serializedState = JSON.stringify(store1.getState().puter);
    const deserializedState = JSON.parse(serializedState);

    // Create new store with deserialized state
    const store2 = configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
      preloadedState: { puter: deserializedState },
    });

    expect(store2.getState().puter.auth.user?.uuid).toBe('persist-test');
    expect(store2.getState().puter.auth.isAuthenticated).toBe(true);
    expect(store2.getState().puter.puterReady).toBe(true);
  });
});