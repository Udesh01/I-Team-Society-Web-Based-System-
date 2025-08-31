import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabaseSuccess, mockSupabaseError } from '@/test/utils'
import Login from '../Login'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/components/ui/sonner'

vi.mock('@/integrations/supabase/client')
vi.mock('@/components/ui/sonner')

const mockNavigate = vi.fn()
const mockLocation = {
  state: null,
  search: '',
  pathname: '/login',
  hash: '',
  key: 'test-key',
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  }
})

describe('Login Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('should render login form with all required elements', () => {
    render(<Login />)

    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
  })

  it('should display validation errors for empty fields', async () => {
    render(<Login />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should display validation error for invalid email format', async () => {
    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('should display validation error for short password', async () => {
    render(<Login />)

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(passwordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('should successfully log in with valid credentials', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
      mockSupabaseSuccess({
        user: mockUser,
        session: { access_token: 'token' },
      })
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should display error message for invalid credentials', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
      mockSupabaseError('Invalid login credentials')
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })

  it('should display error message for unconfirmed email', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
      mockSupabaseError('Email not confirmed')
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'unconfirmed@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email not confirmed/i)).toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
      new Error('Network error')
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('should disable submit button while loading', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('should toggle password visibility', async () => {
    render(<Login />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('should navigate to registration page', async () => {
    render(<Login />)

    const signUpLink = screen.getByText(/sign up/i)
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('should navigate to forgot password page', async () => {
    render(<Login />)

    const forgotPasswordLink = screen.getByText(/forgot your password/i)
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('should handle different error types appropriately', async () => {
    const testCases = [
      {
        error: 'Invalid login credentials',
        expectedMessage: /invalid credentials/i,
      },
      {
        error: 'Email not confirmed',
        expectedMessage: /please check your email/i,
      },
      {
        error: 'Too many requests',
        expectedMessage: /too many attempts/i,
      },
      {
        error: 'User not found',
        expectedMessage: /user not found/i,
      },
    ]

    for (const testCase of testCases) {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
        mockSupabaseError(testCase.error)
      )

      const { unmount } = render(<Login />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(testCase.expectedMessage)).toBeInTheDocument()
      })

      unmount()
    }
  })

  it('should clear error messages on successful login attempt', async () => {
    // First attempt with error
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(
      mockSupabaseError('Invalid credentials')
    )

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Second attempt with success
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce(
      mockSupabaseSuccess({
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token' },
      })
    )

    await user.clear(passwordInput)
    await user.type(passwordInput, 'correctpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle keyboard navigation correctly', async () => {
    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Tab navigation
    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(submitButton).toHaveFocus()

    // Enter key submission
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
      mockSupabaseSuccess({
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token' },
      })
    )

    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled()
    })
  })

  it('should handle profileError response, signOut, redirect and display toast message', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    // Mock successful authentication
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
      mockSupabaseSuccess({
        user: mockUser,
        session: { access_token: 'token' },
      })
    )

    // Mock profile query to return error
    const profileError = { message: 'Profile not found', code: 'PGRST116' }
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: profileError,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

    render(<Login />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      // Assert supabase.auth.signInWithPassword was called
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      
      // Assert profile query was made
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.select).toHaveBeenCalledWith('role')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123')
      
      // Assert supabase.auth.signOut was called due to profile error
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
      
      // Assert redirect to /login occurred with error state
      expect(mockNavigate).toHaveBeenCalledWith('/login', { 
        state: { error: 'missing-role' } 
      })
    })
  })

  it('should display toast error message when redirected with missing-role error', () => {
    const mockToast = vi.fn()
    vi.mock('@/components/ui/sonner', () => ({
      toast: {
        error: mockToast,
        success: vi.fn(),
      },
    }))

    // Mock useLocation to return error state
    const mockLocation = {
      state: { error: 'missing-role' },
      search: '',
      pathname: '/login',
      hash: '',
      key: 'test-key',
    }
    
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation,
        Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
          <a href={to}>{children}</a>
        ),
      }
    })

    render(<Login />)

    // The toast should be called with the appropriate error message
    expect(mockToast).toHaveBeenCalledWith(
      'Login failed: no role information found. Please try again or contact support.'
    )
  })
})
