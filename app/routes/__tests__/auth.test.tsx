import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Auth, { meta } from "../auth";
import puterSlice from "~/lib/puterSlice";
import { puterApiSlice } from "~/lib/puterApiSlice";

// Mock react-router hooks
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: "?next=/home" }),
  };
});

// Mock the RTK Query hooks
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
let mockSignInLoading = false;
let mockSignOutLoading = false;

vi.mock("~/lib/puterApiSlice", async () => {
  const actual = await vi.importActual("~/lib/puterApiSlice");
  return {
    ...actual,
    useSignInMutation: () => [mockSignIn, { isLoading: mockSignInLoading }],
    useSignOutMutation: () => [mockSignOut, { isLoading: mockSignOutLoading }],
  };
});

/*
 * Test strategy for Auth component:
 * 
 * This component handles authentication state and user interactions.
 * Key areas to test:
 * 
 * 1. Rendering states based on authentication status:
 *    - Not authenticated: shows sign in button
 *    - Authenticated: shows sign out button
 *    - Loading states: shows loading button
 * 
 * 2. User interactions:
 *    - Sign in button click
 *    - Sign out button click
 *    - Navigation after successful authentication
 * 
 * 3. URL parameter handling:
 *    - Reading 'next' parameter from URL
 *    - Navigating to next URL after auth
 * 
 * 4. Redux integration:
 *    - Reading auth state from store
 *    - Dispatching sign in/out mutations
 * 
 * Note: We mock the API mutations and focus on component behavior
 * rather than actual authentication logic.
 */
describe('Auth', () => {
  let store: ReturnType<typeof configureStore>;
  
  const createMockStore = (authState: { user: { uuid: string; username: string } | null; isAuthenticated: boolean } = { user: null, isAuthenticated: false }) => {
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

  const renderWithProviders = (component: React.ReactElement, customStore = store) => {
    return render(
      <Provider store={customStore}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createMockStore();
    // Reset loading states
    mockSignInLoading = false;
    mockSignOutLoading = false;
  });

  // Test rendering when user is not authenticated
  test('should render sign in button when not authenticated', () => {
    renderWithProviders(<Auth />);
    
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Log In To Continue Your Job Journey')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
    
    const signInButton = screen.getByRole('button');
    expect(signInButton).toHaveClass('auth-button');
  });

  // Test rendering when user is authenticated
  test('should render sign out button when authenticated', () => {
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });
    
    renderWithProviders(<Auth />, authenticatedStore);
    
    expect(screen.getByText('Log Out')).toBeInTheDocument();
    
    const signOutButton = screen.getByRole('button');
    expect(signOutButton).toHaveClass('auth-button');
  });

  // Test loading state during sign in
  test('should render loading state when signing in', () => {
    // Set loading state for sign in
    mockSignInLoading = true;
    mockSignOutLoading = false;

    renderWithProviders(<Auth />);
    
    expect(screen.getByText('Signing you in ...')).toBeInTheDocument();
    
    const loadingButton = screen.getByRole('button');
    expect(loadingButton).toHaveClass('animate-pulse');
  });

  // Test loading state during sign out
  test('should render loading state when signing out', () => {
    // Set loading state for sign out
    mockSignInLoading = false;
    mockSignOutLoading = true;

    renderWithProviders(<Auth />);
    
    expect(screen.getByText('Signing you in ...')).toBeInTheDocument();
    
    const loadingButton = screen.getByRole('button');
    expect(loadingButton).toHaveClass('animate-pulse');
  });

  // Test sign in button click
  test('should call sign in mutation when sign in button is clicked', () => {
    renderWithProviders(<Auth />);
    
    const signInButton = screen.getByText('Log In').closest('button');
    expect(signInButton).toBeInTheDocument();
    
    if (signInButton) {
      fireEvent.click(signInButton);
    }
    
    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  // Test sign out button click  
  test('should call sign out mutation when sign out button is clicked', () => {
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });
    
    renderWithProviders(<Auth />, authenticatedStore);
    
    const signOutButton = screen.getByText('Log Out').closest('button');
    expect(signOutButton).toBeInTheDocument();
    
    if (signOutButton) {
      fireEvent.click(signOutButton);
    }
    
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  // Test navigation after authentication
  test('should navigate to next URL when authenticated', () => {
    // Create store with authenticated state
    const authenticatedStore = createMockStore({
      user: { uuid: '123', username: 'testuser' },
      isAuthenticated: true,
    });

    renderWithProviders(<Auth />, authenticatedStore);
    
    // The useEffect should trigger navigation
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  // Test meta function export
  test('should export correct meta data', () => {
    expect(meta).toBeDefined();
    
    const metaData = meta();
    expect(metaData).toEqual([
      { title: 'Resumind | Auth' },
      { name: 'description', content: 'Log in your account' }
    ]);
  });
});