import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertPdfToImage, type PdfConversionResult } from '~/lib/pdf2Img';

// Mock the dynamic import of pdfjs-dist
const mockPdfJs = {
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn()
};

// Mock the dynamic import at the top level
vi.mock('pdfjs-dist/build/pdf.mjs', () => mockPdfJs);

// Mock the global objects that the code uses
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn()
};

const mockContext = {
  imageSmoothingEnabled: false,
  imageSmoothingQuality: '',
};

// Mock document.createElement
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return {};
    })
  },
  writable: true
});

// Mock URL constructor and createObjectURL
const mockURLConstructor = vi.fn().mockImplementation(() => ({
  toString: () => 'mock-worker-url'
}));

Object.defineProperty(global, 'URL', {
  value: Object.assign(mockURLConstructor, {
    createObjectURL: vi.fn(() => 'mock-object-url')
  }),
  writable: true
});

// Mock import.meta.url
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      url: 'file:///mock/path/'
    }
  },
  writable: true
});

// Mock File constructor
global.File = class MockFile {
  name: string;
  type: string;
  size: number;
  
  constructor(chunks: any[], filename: string, options?: { type?: string }) {
    this.name = filename;
    this.type = options?.type || '';
    this.size = chunks.reduce((size, chunk) => size + (chunk.length || 0), 0);
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(8));
  }
} as any;

// Mock Blob
global.Blob = class MockBlob {
  type: string;
  size: number;
  
  constructor(chunks: any[], options?: { type?: string }) {
    this.type = options?.type || '';
    this.size = chunks.reduce((size, chunk) => size + (chunk.length || 0), 0);
  }
} as any;

describe('PDF Conversion', () => {
  let mockFile: File;
  let mockPdf: any;
  let mockPage: any;
  let mockViewport: any;
  let mockBlob: Blob;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset canvas properties
    mockCanvas.width = 0;
    mockCanvas.height = 0;
    mockContext.imageSmoothingEnabled = false;
    mockContext.imageSmoothingQuality = '';
    
    // Create mock file
    mockFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    // Create mock blob
    mockBlob = new Blob(['mock image data'], { type: 'image/png' });
    
    // Setup mock viewport
    mockViewport = {
      width: 800,
      height: 600
    };
    
    // Setup mock page with render method that returns a promise
    mockPage = {
      getViewport: vi.fn(() => mockViewport),
      render: vi.fn(() => ({
        promise: Promise.resolve()
      }))
    };
    
    // Setup mock PDF document
    mockPdf = {
      getPage: vi.fn(() => Promise.resolve(mockPage))
    };
    
    // Setup pdfjs getDocument mock
    mockPdfJs.getDocument.mockReturnValue({
      promise: Promise.resolve(mockPdf)
    });
    
    // Setup canvas context mock
    mockCanvas.getContext.mockReturnValue(mockContext);
    
    // Setup canvas toBlob mock - this is crucial for the success path
    mockCanvas.toBlob.mockImplementation((callback, type, quality) => {
      // Simulate successful blob creation
      setTimeout(() => callback(mockBlob), 0);
    });
    
    // Setup URL.createObjectURL mock
    (global.URL.createObjectURL as any).mockReturnValue('mock-object-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertPdfToImage', () => {
    it('should successfully convert PDF to image', async () => {
      const result = await convertPdfToImage(mockFile);

      expect(result.imageUrl).toBe('mock-object-url');
      expect(result.file).toBeInstanceOf(File);
      expect(result.file?.name).toBe('test.png');
      expect(result.file?.type).toBe('image/png');
      expect(result.error).toBeUndefined();
      
      // Verify URL.createObjectURL was called with the blob
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should handle PDF files with different extensions', async () => {
      const upperCaseFile = new File(['content'], 'TEST.PDF', { type: 'application/pdf' });
      
      const result = await convertPdfToImage(upperCaseFile);

      expect(result.file?.name).toBe('TEST.png');
    });

    it('should set canvas dimensions from viewport', async () => {
      await convertPdfToImage(mockFile);

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(600);
    });

    it('should configure canvas context for high quality rendering', async () => {
      await convertPdfToImage(mockFile);

      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });

    it('should call PDF.js with correct parameters', async () => {
      await convertPdfToImage(mockFile);

      expect(mockPdfJs.getDocument).toHaveBeenCalledWith({
        data: expect.any(ArrayBuffer)
      });
      expect(mockPdf.getPage).toHaveBeenCalledWith(1);
      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 4 });
    });

    it('should render page to canvas with correct parameters', async () => {
      await convertPdfToImage(mockFile);

      expect(mockPage.render).toHaveBeenCalledWith({
        canvasContext: mockContext,
        viewport: mockViewport
      });
    });

    it('should create blob with correct parameters', async () => {
      await convertPdfToImage(mockFile);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        1.0
      );
    });

    it('should handle blob creation failure', async () => {
      // Mock toBlob to call callback with null
      mockCanvas.toBlob.mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
      });

      const result = await convertPdfToImage(mockFile);

      expect(result.imageUrl).toBe('');
      expect(result.file).toBe(null);
      expect(result.error).toBe('Failed to create image blob');
    });

    it('should handle PDF loading errors', async () => {
      const error = new Error('PDF loading failed');
      mockPdfJs.getDocument.mockReturnValue({
        promise: Promise.reject(error)
      });

      const result = await convertPdfToImage(mockFile);

      expect(result.imageUrl).toBe('');
      expect(result.file).toBe(null);
      expect(result.error).toBe('Failed to convert PDF: Error: PDF loading failed');
    });

    it('should handle page rendering errors', async () => {
      const error = new Error('Rendering failed');
      mockPage.render.mockReturnValue({
        promise: Promise.reject(error)
      });

      const result = await convertPdfToImage(mockFile);

      expect(result.imageUrl).toBe('');
      expect(result.file).toBe(null);
      expect(result.error).toBe('Failed to convert PDF: Error: Rendering failed');
    });

    it('should handle file reading errors', async () => {
      const mockFileWithError = {
        name: 'test.pdf',
        arrayBuffer: vi.fn(() => Promise.reject(new Error('File read error')))
      } as any;

      const result = await convertPdfToImage(mockFileWithError);

      expect(result.imageUrl).toBe('');
      expect(result.file).toBe(null);
      expect(result.error).toBe('Failed to convert PDF: Error: File read error');
    });

    it('should handle missing canvas context', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      const result = await convertPdfToImage(mockFile);

      // Should still work, just without setting smoothing properties
      expect(result.imageUrl).toBe('mock-object-url');
      expect(result.file).toBeInstanceOf(File);
    });

    it('should preserve original filename without .pdf extension', async () => {
      const complexNameFile = new File(['content'], 'My Document v2.1.pdf', { type: 'application/pdf' });
      
      const result = await convertPdfToImage(complexNameFile);

      expect(result.file?.name).toBe('My Document v2.1.png');
    });

    it('should handle files without .pdf extension', async () => {
      const noPdfExtFile = new File(['content'], 'document', { type: 'application/pdf' });
      
      const result = await convertPdfToImage(noPdfExtFile);

      expect(result.file?.name).toBe('document.png');
    });

    it('should handle case-insensitive PDF extension removal', async () => {
      const testCases = [
        { input: 'test.pdf', expected: 'test.png' },
        { input: 'test.PDF', expected: 'test.png' },
        { input: 'test.Pdf', expected: 'test.png' },
        { input: 'test.pDf', expected: 'test.png' }
      ];

      for (const testCase of testCases) {
        const file = new File(['content'], testCase.input, { type: 'application/pdf' });
        const result = await convertPdfToImage(file);
        expect(result.file?.name).toBe(testCase.expected);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle extremely large viewport dimensions', async () => {
      mockViewport.width = 10000;
      mockViewport.height = 8000;

      await convertPdfToImage(mockFile);

      expect(mockCanvas.width).toBe(10000);
      expect(mockCanvas.height).toBe(8000);
    });

    it('should handle zero viewport dimensions', async () => {
      mockViewport.width = 0;
      mockViewport.height = 0;

      await convertPdfToImage(mockFile);

      expect(mockCanvas.width).toBe(0);
      expect(mockCanvas.height).toBe(0);
    });

    it('should work when context smoothing properties are not supported', async () => {
      const limitedContext = {};
      mockCanvas.getContext.mockReturnValue(limitedContext);

      const result = await convertPdfToImage(mockFile);

      // Should still complete successfully
      expect(result.imageUrl).toBe('mock-object-url');
      expect(result.file).toBeInstanceOf(File);
    });
  });
});

describe('PdfConversionResult interface', () => {
  it('should have correct structure for success case', () => {
    const successResult: PdfConversionResult = {
      imageUrl: 'blob:mock-url',
      file: new File(['content'], 'test.png', { type: 'image/png' })
    };

    expect(successResult.imageUrl).toBeDefined();
    expect(successResult.file).toBeDefined();
    expect(successResult.error).toBeUndefined();
  });

  it('should have correct structure for error case', () => {
    const errorResult: PdfConversionResult = {
      imageUrl: '',
      file: null,
      error: 'Something went wrong'
    };

    expect(errorResult.imageUrl).toBe('');
    expect(errorResult.file).toBe(null);
    expect(errorResult.error).toBeDefined();
  });
});