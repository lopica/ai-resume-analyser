/**
 * Mock Service Worker (MSW) Setup for Integration Tests
 * 
 * This module provides comprehensive API mocking for testing the application's
 * integration with external services without requiring real backend dependencies.
 * 
 * Mock Strategy:
 * 1. Puter filesystem operations (upload, read, delete)
 * 2. Puter KV store operations (get, set, list, flush)
 * 3. AI analysis service responses
 * 4. Authentication service responses
 * 5. File conversion operations
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { 
  mockFileSystemResponses, 
  mockKVStoreData, 
  mockAIResponses, 
  mockAuthResponses,
  mockErrorScenarios 
} from '../../fixtures';

// Mock KV store state
let mockKVStore: Record<string, string> = { ...mockKVStoreData };

// Mock file system state
let mockFileSystem: Record<string, any> = {};

// Track uploaded files for testing
let uploadedFiles: Array<{ path: string; content: any; metadata: any }> = [];

export const handlers = [
  // Puter Authentication API
  http.post('/api/puter/auth/signin', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return HttpResponse.json(mockAuthResponses.signInSuccess);
  }),

  http.post('/api/puter/auth/signout', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return HttpResponse.json({ success: true });
  }),

  // Puter File System API
  http.post('/api/puter/fs/upload', async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Simulate file processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResponse = {
        ...mockFileSystemResponses.uploadSuccess,
        path: `/uploads/${file.name.replace('.pdf', '')}-${Date.now()}.pdf`,
        name: file.name,
        size: file.size
      };

      // Store file in mock filesystem
      mockFileSystem[mockResponse.path] = {
        content: file,
        metadata: mockResponse,
        uploadedAt: new Date().toISOString()
      };

      uploadedFiles.push({
        path: mockResponse.path,
        content: file,
        metadata: mockResponse
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      return HttpResponse.json(mockResponse);
    } catch (error) {
      console.error('MSW File Upload Error:', error);
      return HttpResponse.json({ error: 'File upload failed', details: error }, { status: 500 });
    }
  }),

  http.get('/api/puter/fs/read', async ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    const isPdf = url.searchParams.get('isPdf') === 'true';
    
    if (!path) {
      return HttpResponse.json({ error: 'Path parameter required' }, { status: 400 });
    }

    const file = mockFileSystem[path];
    if (!file) {
      return HttpResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Simulate blob URL for file access
    const blobUrl = `blob:http://localhost:3000/${Math.random().toString(36)}`;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return HttpResponse.json({ url: blobUrl, data: blobUrl });
  }),

  http.delete('/api/puter/fs/delete', async ({ request }) => {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return HttpResponse.json({ error: 'Path parameter required' }, { status: 400 });
    }

    if (mockFileSystem[path]) {
      delete mockFileSystem[path];
      uploadedFiles = uploadedFiles.filter(f => f.path !== path);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return HttpResponse.json({ success: true, deletedPath: path });
    }

    return HttpResponse.json({ error: 'File not found' }, { status: 404 });
  }),

  http.get('/api/puter/fs/readdir', async ({ request }) => {
    const url = new URL(request.url);
    const directory = url.searchParams.get('path') || './';
    
    // Return list of uploaded files
    const files = uploadedFiles.map((file, index) => ({
      id: `file-${index}`,
      name: file.metadata.name,
      path: file.path,
      size: file.metadata.size,
      type: 'file'
    }));

    await new Promise(resolve => setTimeout(resolve, 1000));
    return HttpResponse.json(files);
  }),

  // Puter KV Store API
  http.get('/api/puter/kv/get', async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
      return HttpResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }

    const value = mockKVStore[key];
    
    if (value === undefined) {
      return HttpResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    return HttpResponse.json({ value });
  }),

  http.post('/api/puter/kv/set', async ({ request }) => {
    const body = await request.json() as { key: string; value: any };
    const { key, value } = body;
    
    if (!key || value === undefined) {
      return HttpResponse.json({ error: 'Key and value required' }, { status: 400 });
    }

    // Store in mock KV store
    mockKVStore[key] = typeof value === 'string' ? value : JSON.stringify(value);

    await new Promise(resolve => setTimeout(resolve, 500));
    return HttpResponse.json({ success: true, key });
  }),

  http.get('/api/puter/kv/list', async ({ request }) => {
    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || '';
    
    // Filter keys by prefix and return as key-value pairs
    const filteredEntries = Object.entries(mockKVStore)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => ({ key, value }));

    await new Promise(resolve => setTimeout(resolve, 800));
    return HttpResponse.json(filteredEntries);
  }),

  http.post('/api/puter/kv/flush', async () => {
    // Clear all KV store data
    mockKVStore = {};
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate longer operation
    return HttpResponse.json({ success: true, cleared: Object.keys(mockKVStoreData).length });
  }),

  // AI Analysis Service
  http.post('/api/ai/analyze', async ({ request }) => {
    const body = await request.json() as { path: string; message: string };
    const { path, message } = body;
    
    if (!path || !message) {
      return HttpResponse.json({ error: 'Path and message required' }, { status: 400 });
    }

    // Simulate AI processing delay (5-15 seconds)
    const processingTime = 5000 + Math.random() * 10000;
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Return different responses based on input patterns
    let response: typeof mockAIResponses.averageResume | typeof mockAIResponses.excellentResume | typeof mockAIResponses.poorResume = mockAIResponses.averageResume;
    
    if (message.includes('React') || message.includes('Frontend')) {
      response = mockAIResponses.excellentResume;
    } else if (message.includes('Backend') || message.includes('Node.js')) {
      response = mockAIResponses.averageResume;
    } else if (message.includes('poor') || message.includes('basic')) {
      response = mockAIResponses.poorResume;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return HttpResponse.json({
      message: {
        content: JSON.stringify(response)
      }
    });
  }),

  // PDF to Image Conversion Service
  http.post('/api/convert/pdf-to-image', async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Simulate conversion delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      const imageResponse = {
        ...mockFileSystemResponses.imageConversionSuccess,
        path: file.name.replace('.pdf', '.png'),
        originalFile: file.name
      };

      // Store converted image in mock filesystem
      const imagePath = `/uploads/${imageResponse.path}`;
      mockFileSystem[imagePath] = {
        content: 'mock-image-data',
        metadata: imageResponse,
        convertedAt: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      return HttpResponse.json({
        file: new File(['mock-image-data'], imageResponse.path, { type: 'image/png' }),
        dataUrl: 'data:image/png;base64,mock-image-data'
      });
    } catch (error) {
      console.error('MSW PDF Conversion Error:', error);
      return HttpResponse.json({ error: 'PDF conversion failed', details: error }, { status: 500 });
    }
  })
];

// Server instance for integration tests
export const server = setupServer(...handlers);

// Utilities for test setup and teardown
export const testServerUtils = {
  // Reset all mock data to initial state
  resetMockData: () => {
    mockKVStore = { ...mockKVStoreData };
    mockFileSystem = {};
    uploadedFiles = [];
  },

  // Get current mock state for assertions
  getMockState: () => ({
    kvStore: { ...mockKVStore },
    fileSystem: { ...mockFileSystem },
    uploadedFiles: [...uploadedFiles]
  }),

  // Add custom data to mock stores
  addMockData: (type: 'kv' | 'fs', key: string, value: any) => {
    if (type === 'kv') {
      mockKVStore[key] = typeof value === 'string' ? value : JSON.stringify(value);
    } else if (type === 'fs') {
      mockFileSystem[key] = value;
    }
  },

  // Simulate error scenarios
  simulateError: (errorType: keyof typeof mockErrorScenarios) => {
    const error = mockErrorScenarios[errorType];
    
    // Add temporary error handlers
    server.use(
      http.post('/api/puter/fs/upload', () => {
        return HttpResponse.json(error, { status: 500 });
      })
    );
  },

  // Remove error simulation
  clearErrorSimulation: () => {
    server.resetHandlers(...handlers);
  }
};