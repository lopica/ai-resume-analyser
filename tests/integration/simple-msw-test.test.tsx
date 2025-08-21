/**
 * Simple MSW Integration Test
 * 
 * Basic test to verify MSW setup is working correctly with the updated API.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { server, testServerUtils } from './setup/msw-setup';

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

describe('MSW Setup Integration', () => {
  
  test('should handle KV store operations correctly', async () => {
    // Test the mock KV store directly
    const response = await fetch('/api/puter/kv/list?prefix=resume:');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('should simulate authentication correctly', async () => {
    const response = await fetch('/api/puter/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'test' })
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('user');
  });

  test('should handle file system read operations', async () => {
    // Pre-populate mock filesystem
    testServerUtils.addMockData('fs', '/uploads/test.pdf', {
      content: 'test-content',
      metadata: { name: 'test.pdf', size: 1024 }
    });

    const response = await fetch('/api/puter/fs/read?path=/uploads/test.pdf');
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('url');
    expect(data).toHaveProperty('data');
  });

  test('should handle AI analysis requests', async () => {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        path: '/uploads/test.pdf', 
        message: 'Analyze this frontend developer resume' 
      })
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toHaveProperty('content');
  });

  test('should verify mock state utilities work', () => {
    // Add some test data
    testServerUtils.addMockData('kv', 'test-key', 'test-value');
    
    const state = testServerUtils.getMockState();
    expect(state.kvStore['test-key']).toBe('test-value');
    
    // Reset should clear the data
    testServerUtils.resetMockData();
    const resetState = testServerUtils.getMockState();
    expect(resetState.kvStore['test-key']).toBeUndefined();
  });
});