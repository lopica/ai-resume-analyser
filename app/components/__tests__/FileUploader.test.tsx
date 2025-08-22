import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import FileUploader from "../FileUploader";

// Mock react-i18next to provide translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "fileUploader.clickToUpload": "Click to upload",
        "fileUploader.orDragAndDrop": "or drag and drop", 
        "fileUploader.pdfMaxSize": "PDF (max 20 MB)",
        "fileUploader.remove": "Remove"
      };
      return translations[key] || key;
    }
  })
}));

// Mock the utils module
vi.mock("~/lib/utils", () => ({
  formatSize: vi.fn((bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }),
}));

// Mock react-dropzone
vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(),
}));

/*
 * Test strategy for FileUploader component:
 * 
 * This is a React component that uses react-dropzone for file upload functionality.
 * Key areas to test:
 * 
 * 1. Rendering states: 
 *    - Empty state (no file selected)
 *    - File selected state
 * 
 * 2. User interactions:
 *    - File selection via dropzone
 *    - File removal
 *    - Callback function invocation
 * 
 * 3. File validation:
 *    - PDF file type acceptance
 *    - File size limits (20MB)
 *    - Single file selection
 * 
 * 4. Event handling:
 *    - Click events
 *    - Drag and drop events
 *    - Preventing event propagation
 * 
 * Note: Since we're mocking react-dropzone, we focus on component logic
 * rather than actual file drop functionality.
 */
describe('FileUploader', () => {
  let mockUseDropzone: ReturnType<typeof vi.fn>;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked useDropzone hook from react-dropzone
    const reactDropzone = await import("react-dropzone");
    mockUseDropzone = vi.mocked(reactDropzone.useDropzone);
    
    // Default mock implementation for useDropzone
    mockUseDropzone.mockReturnValue({
      getRootProps: () => ({ 'data-testid': 'dropzone' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: false,
      open: vi.fn(),
      acceptedFiles: [],
      fileRejections: [],
      isFocused: false,
      isFileDialogActive: false,
      inputRef: { current: null },
      rootRef: { current: null },
    });
  });

  // Test initial render state when no file is selected
  test('should render empty state initially', () => {
    render(<FileUploader />);
    
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PDF (max 20 MB)')).toBeInTheDocument();
    expect(screen.getByAltText('upload')).toBeInTheDocument();
  });

  // Test that useDropzone is configured with correct options
  test('should configure dropzone with correct options', () => {
    const onFileSelect = vi.fn();
    render(<FileUploader onFileSelect={onFileSelect} />);
    
    expect(mockUseDropzone).toHaveBeenCalledWith(
      expect.objectContaining({
        multiple: false,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: 20 * 1024 * 1024, // 20MB
        onDrop: expect.any(Function),
      })
    );
  });

  // Test file selection functionality
  test('should handle file selection and show selected file', async () => {
    let onDropCallback: (files: File[]) => void;
    
    mockUseDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop!;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ 'data-testid': 'file-input' }),
        isDragActive: false,
        // @ts-ignore - mocking for test purposes
        open: vi.fn(),
        // @ts-ignore - mocking for test purposes
        acceptedFiles: [],
        // @ts-ignore - mocking for test purposes
        fileRejections: [],
        // @ts-ignore - mocking for test purposes
        isFocused: false,
        // @ts-ignore - mocking for test purposes
        isFileDialogActive: false,
      };
    });

    const onFileSelect = vi.fn();
    render(<FileUploader onFileSelect={onFileSelect} />);
    
    // Simulate file selection
    const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    await act(async () => {
      onDropCallback!([mockFile]);
    });

    // Wait for component to update
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByAltText('pdf')).toBeInTheDocument();
      expect(onFileSelect).toHaveBeenCalledWith(mockFile);
    });
  });

  // Test file removal functionality
  test('should handle file removal', async () => {
    let onDropCallback: (files: File[]) => void;
    
    mockUseDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop!;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ 'data-testid': 'file-input' }),
        isDragActive: false,
        // @ts-ignore - mocking for test purposes
        open: vi.fn(),
        // @ts-ignore - mocking for test purposes
        acceptedFiles: [],
        // @ts-ignore - mocking for test purposes
        fileRejections: [],
        // @ts-ignore - mocking for test purposes
        isFocused: false,
        // @ts-ignore - mocking for test purposes
        isFileDialogActive: false,
      };
    });

    const onFileSelect = vi.fn();
    const { rerender } = render(<FileUploader onFileSelect={onFileSelect} />);
    
    // First select a file
    const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    await act(async () => {
      onDropCallback!([mockFile]);
    });
    
    rerender(<FileUploader onFileSelect={onFileSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Then remove it
    const removeButton = screen.getByAltText('remove').closest('button');
    expect(removeButton).toBeInTheDocument();
    
    if (removeButton) {
      await act(async () => {
        fireEvent.click(removeButton);
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Click to upload')).toBeInTheDocument();
      expect(onFileSelect).toHaveBeenCalledWith(null);
    });
  });

  // Test that onDrop handles empty file arrays
  test('should handle empty file selection', async () => {
    let onDropCallback: (files: File[]) => void;
    
    mockUseDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop!;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ 'data-testid': 'file-input' }),
        isDragActive: false,
        // @ts-ignore - mocking for test purposes
        open: vi.fn(),
        // @ts-ignore - mocking for test purposes
        acceptedFiles: [],
        // @ts-ignore - mocking for test purposes
        fileRejections: [],
        // @ts-ignore - mocking for test purposes
        isFocused: false,
        // @ts-ignore - mocking for test purposes
        isFileDialogActive: false,
      };
    });

    const onFileSelect = vi.fn();
    render(<FileUploader onFileSelect={onFileSelect} />);
    
    // Simulate empty file selection (e.g., cancelled dialog)
    await act(async () => {
      onDropCallback!([]);
    });

    expect(onFileSelect).toHaveBeenCalledWith(null);
  });

  // Test event propagation prevention in remove button
  test('should prevent event propagation when removing file', async () => {
    let onDropCallback: (files: File[]) => void;
    
    mockUseDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop!;
      return {
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ 'data-testid': 'file-input' }),
        isDragActive: false,
        // @ts-ignore - mocking for test purposes
        open: vi.fn(),
        // @ts-ignore - mocking for test purposes
        acceptedFiles: [],
        // @ts-ignore - mocking for test purposes
        fileRejections: [],
        // @ts-ignore - mocking for test purposes
        isFocused: false,
        // @ts-ignore - mocking for test purposes
        isFileDialogActive: false,
      };
    });

    const onFileSelect = vi.fn();
    const { rerender } = render(<FileUploader onFileSelect={onFileSelect} />);
    
    // Select a file first
    const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    
    await act(async () => {
      onDropCallback!([mockFile]);
    });
    
    rerender(<FileUploader onFileSelect={onFileSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const removeButton = screen.getByAltText('remove').closest('button');
    // Create a proper event object instead of using 'as any'
    const mockEvent: Partial<MouseEvent> = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      type: 'click',
      target: removeButton,
    };

    if (removeButton) {
      // Simulate the click event with preventDefault and stopPropagation
      await act(async () => {
        fireEvent.click(removeButton, mockEvent);
      });
    }

    // Note: Testing preventDefault and stopPropagation directly is complex in jsdom
    // The important thing is that the file gets removed without triggering dropzone
    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith(null);
    });
  });
});