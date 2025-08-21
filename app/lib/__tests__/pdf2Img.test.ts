import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { convertPdfToImage } from "../pdf2Img";

// Mock pdfjs-dist
const mockLib = {
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(),
};

const mockPdf = {
  getPage: vi.fn(),
};

const mockPage = {
  getViewport: vi.fn(),
  render: vi.fn(),
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn(),
};

const mockContext = {
  imageSmoothingEnabled: false,
  imageSmoothingQuality: "",
};

// Mock canvas element creation
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => mockCanvas),
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-blob-url'),
});

vi.mock("pdfjs-dist/build/pdf.mjs", () => ({
  default: mockLib,
  ...mockLib,
}));

/*
 * Note: loadPdfJs function is not tested separately because:
 * 1. It's an internal/private function (not exported)
 * 2. It's already tested indirectly through convertPdfToImage tests
 * 3. Its behavior (module loading and caching) is implementation detail
 * 4. Testing it directly would require complex module mocking that doesn't add value
 */

/*
 * Test strategy for convertPdfToImage function:
 * 
 * To determine the test cases, analyze the function's execution flow and identify:
 * 1. Happy path: successful conversion with all dependencies working
 * 2. Error conditions: each point where the function can fail or return an error
 * 3. Edge cases: boundary conditions and unusual inputs
 * 
 * Key failure points in convertPdfToImage:
 * - PDF loading/parsing failure (pdfjs library issues)
 * - Canvas context creation failure (browser compatibility)
 * - Blob conversion failure (canvas.toBlob returns null)
 * 
 * Each test case should mock the dependencies to simulate these conditions.
 */
describe('convertPdfToImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockLib.getDocument.mockReturnValue({ promise: Promise.resolve(mockPdf) });
    mockPdf.getPage.mockResolvedValue(mockPage);
    mockPage.getViewport.mockReturnValue({ width: 800, height: 600 });
    mockPage.render.mockReturnValue({ promise: Promise.resolve() });
    mockCanvas.getContext.mockReturnValue(mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test the happy path: all dependencies work correctly and PDF is successfully converted to image
  test('should successfully convert PDF to image', async () => {
    const mockBlob = new Blob(['mock'], { type: 'image/png' });
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(mockBlob);
    });

    // Create a proper mock File with arrayBuffer method
    const mockFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    const result = await convertPdfToImage(mockFile);

    expect(result.imageUrl).toBe('mock-blob-url');
    expect(result.file).toBeInstanceOf(File);
    expect(result.file?.name).toBe('test.png');
    expect(result.error).toBeUndefined();
  });

  // Test canvas context failure: when browser doesn't support 2D context or it's disabled
  test('should handle canvas context not supported', async () => {
    mockCanvas.getContext.mockReturnValue(null);

    const mockFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    
    const result = await convertPdfToImage(mockFile);

    expect(result.imageUrl).toBe('');
    expect(result.file).toBe(null);
    expect(result.error).toBe('Canvas 2D context not supported');
  });

  // Test blob creation failure: when canvas.toBlob fails to generate image data
  test('should handle failed blob creation', async () => {
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(null);
    });

    const mockFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    
    const result = await convertPdfToImage(mockFile);

    expect(result.imageUrl).toBe('');
    expect(result.file).toBe(null);
    expect(result.error).toBe('Failed to create image blob');
  });

  // Test PDF processing error: when the PDF file is corrupted or pdfjs fails to parse it
  test('should handle PDF processing error', async () => {
    const mockFile = new File(['invalid pdf'], 'test.pdf', { type: 'application/pdf' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
    
    mockLib.getDocument.mockReturnValue({ 
      promise: Promise.reject(new Error('Invalid PDF')) 
    });

    const result = await convertPdfToImage(mockFile);

    expect(result.imageUrl).toBe('');
    expect(result.file).toBe(null);
    expect(result.error).toContain('Failed to convert PDF: Error: Invalid PDF');
  });
});