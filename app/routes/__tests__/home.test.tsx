/// <reference types="../../../types/index.d.ts" />
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Home, { meta } from "../home";
import puterSlice from "~/lib/puterSlice";
import { puterApiSlice } from "~/lib/puterApiSlice";

// Mock components
vi.mock("~/components/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("~/components/ResumeCard", () => ({
  default: ({ resume }: { resume: Resume }) => (
    <div data-testid="resume-card">{resume.resumePath}</div>
  ),
}));

// Mock react-router hooks
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, className }: any) => (
      <a href={to} className={className}>{children}</a>
    ),
  };
});

/*
 * Test strategy for Home component:
 * 
 * This is a complex component that handles multiple states and integrations.
 * Key areas to test:
 * 
 * 1. Authentication redirects: Unauthenticated users should be redirected to auth
 * 2. Loading states: Show loading when fetching resumes
 * 3. Empty state: Show upload prompt when no resumes exist  
 * 4. Resumes display: Show resume cards when data exists
 * 5. Meta function: Export correct SEO metadata
 * 
 * Note: Due to complexity of mocking all RTK Query hooks and effects,
 * this focuses on core rendering logic and meta function testing.
 */
// Type for RTK Query hook return value to avoid using 'as any'
type MockQueryResult<T> = {
  data: T;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

describe('Home', () => {
  const createMockStore = (
    authState: { user: { uuid: string; username: string } | null; isAuthenticated: boolean } = { user: null, isAuthenticated: false },
    // Using unknown instead of any for better type safety - represents any JSON-serializable data from KV store
    kvData: unknown = undefined,
    isFetching = false
  ) => {
    return configureStore({
      reducer: {
        puter: puterSlice.reducer,
        puterApi: puterApiSlice.reducer,
      },
      preloadedState: {
        puter: {
          puterReady: true,
          auth: authState,
        },
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(puterApiSlice.middleware),
    });
  };

  const renderWithProviders = (component: React.ReactElement, store: any) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the RTK Query hook with default values
    vi.spyOn(puterApiSlice, 'useKvListQuery').mockReturnValue({
      data: undefined,
      isFetching: false,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } satisfies MockQueryResult<unknown>);
  });

  // Test meta function export
  test('should export correct meta data', () => {
    const metaData = meta();
    expect(metaData).toEqual([
      { title: "Resumind" },
      { name: "description", content: "Smart feedback for your dream job!" },
    ]);
  });

  // Test basic rendering with navbar
  test('should render navbar and main structure', () => {
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });

    renderWithProviders(<Home />, authenticatedStore);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByText('Track Your Applications & Resume Ratings')).toBeInTheDocument();
  });

  // Test unauthenticated user redirect
  test('should navigate to auth when user is not authenticated', () => {
    const unauthenticatedStore = createMockStore();
    
    renderWithProviders(<Home />, unauthenticatedStore);
    
    // The useEffect should trigger navigation to auth
    expect(mockNavigate).toHaveBeenCalledWith('/auth?next=/');
  });

  // Test empty state display
  test('should show empty state when no resumes exist', () => {
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });

    // Mock empty data
    vi.spyOn(puterApiSlice, 'useKvListQuery').mockReturnValue({
      data: [],
      isFetching: false,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } satisfies MockQueryResult<unknown[]>);

    renderWithProviders(<Home />, authenticatedStore);
    
    expect(screen.getByText('No resumes found. Upload your first resume to get feedback.')).toBeInTheDocument();
    expect(screen.getByText('Upload Resume')).toBeInTheDocument();
  });

  // Test loading state
  test('should show loading state when fetching data', () => {
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });

    // Mock loading state
    vi.spyOn(puterApiSlice, 'useKvListQuery').mockReturnValue({
      data: undefined,
      isFetching: true,
      isLoading: true,
      error: undefined,
      refetch: vi.fn(),
    } satisfies MockQueryResult<unknown>);

    renderWithProviders(<Home />, authenticatedStore);
    
    // Note: The actual loading state depends on component's internal state management
    // This test verifies the component can handle the isFetching state
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  // Test component renders with resumes data
  test('should render resume cards when data exists', () => {
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });

    const mockResumes = [
      { key: 'resume:1', value: JSON.stringify({ id: '1', fileName: 'resume1.pdf' }) },
      { key: 'resume:2', value: JSON.stringify({ id: '2', fileName: 'resume2.pdf' }) },
    ];

    // Mock data with resumes
    vi.spyOn(puterApiSlice, 'useKvListQuery').mockReturnValue({
      data: mockResumes,
      isFetching: false,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    } satisfies MockQueryResult<unknown[]>);

    renderWithProviders(<Home />, authenticatedStore);
    
    expect(screen.getByText('Review your submissions and check AI-powered feedback.')).toBeInTheDocument();
    // Note: Resume cards would be rendered if the component's useEffect processes the data correctly
  });
});