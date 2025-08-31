import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabaseSuccess, mockSupabaseError } from '@/test/utils'
import App from '@/App'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client')

// Mock all the hooks and services
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('User Workflow Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset navigation mock
    mockNavigate.mockClear()
    // Mock window.location for navigation tests
    Object.defineProperty(window, 'location', {
      value: { pathname: '/', search: '', hash: '' },
      writable: true,
    })
  })

  describe('Authentication Flow', () => {
    it('should complete full login workflow for student', async () => {
      const mockUser = {
        id: 'student-123',
        email: 'student@example.com',
        role: 'student',
      }

      // Mock successful login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
        mockSupabaseSuccess({
          user: mockUser,
          session: { access_token: 'token' },
        })
      )

      // Mock user profile fetch
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(
          mockSupabaseSuccess({
            id: 'student-123',
            first_name: 'John',
            last_name: 'Student',
            role: 'student',
            student_id: 'ST001',
            year: 3,
          })
        ),
      }
      vi.mocked(supabase.from).mockReturnValue(mockProfileQuery as any)

      render(<App />)

      // Navigate to login page
      const loginLink = screen.getByRole('link', { name: /sign in/i })
      await user.click(loginLink)

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'student@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Verify login attempt
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'student@example.com',
          password: 'password123',
        })
      })

      // Should redirect to dashboard after successful login
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle registration workflow for new student', async () => {
      // Mock successful registration
      vi.mocked(supabase.auth.signUp).mockResolvedValue(
        mockSupabaseSuccess({
          user: { id: 'new-student-123', email: 'newstudent@example.com' },
          session: null, // No session yet, needs email confirmation
        })
      )

      render(<App />)

      // Navigate to registration page
      const registerLink = screen.getByRole('link', { name: /sign up/i })
      await user.click(registerLink)

      // Fill registration form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(emailInput, 'newstudent@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(firstNameInput, 'New')
      await user.type(lastNameInput, 'Student')
      await user.click(submitButton)

      // Verify registration attempt
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'newstudent@example.com',
          password: 'password123',
          options: {
            data: {
              first_name: 'New',
              last_name: 'Student',
              role: 'student',
            },
          },
        })
      })

      // Should show confirmation message
      expect(screen.getByText(/check your email for confirmation/i)).toBeInTheDocument()
    })
  })

  describe('Event Management Flow', () => {
    it('should complete event registration workflow', async () => {
      const mockUser = { id: 'student-123', email: 'student@example.com' }
      const mockEvent = {
        id: 'event-123',
        name: 'React Workshop',
        description: 'Learn React fundamentals',
        event_date: '2024-12-31T18:00:00.000Z',
        location: 'Tech Hub',
        max_participants: 50,
        event_registrations: [],
      }

      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock events fetch
      const mockEventsQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSupabaseSuccess([mockEvent])),
      }
      vi.mocked(supabase.from).mockReturnValue(mockEventsQuery as any)

      render(<App />)

      // Navigate to events page
      window.location.pathname = '/dashboard/events'

      await waitFor(() => {
        expect(screen.getByText('React Workshop')).toBeInTheDocument()
      })

      // Register for event
      const registerButton = screen.getByRole('button', { name: /register/i })
      
      // Mock registration success
      const mockRegistrationQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(
          mockSupabaseSuccess({
            id: 'registration-123',
            event_id: 'event-123',
            user_id: 'student-123',
          })
        ),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockRegistrationQuery as any)

      await user.click(registerButton)

      await waitFor(() => {
        expect(mockRegistrationQuery.insert).toHaveBeenCalledWith({
          event_id: 'event-123',
          user_id: 'student-123',
          registered_at: expect.any(String),
        })
      })
    })

    it('should handle event creation workflow for admin', async () => {
      const mockAdmin = { id: 'admin-123', email: 'admin@example.com' }

      // Mock authenticated admin
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAdmin },
        error: null,
      })

      // Mock admin role check
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(true))

      render(<App />)

      // Navigate to event management page
      window.location.pathname = '/dashboard/admin/events'

      // Fill event creation form
      const nameInput = screen.getByLabelText(/event name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const dateInput = screen.getByLabelText(/event date/i)
      const locationInput = screen.getByLabelText(/location/i)
      const createButton = screen.getByRole('button', { name: /create event/i })

      await user.type(nameInput, 'New Workshop')
      await user.type(descriptionInput, 'A new workshop for students')
      await user.type(dateInput, '2024-12-31')
      await user.type(locationInput, 'Conference Room')

      // Mock event creation success
      const mockCreateQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(
          mockSupabaseSuccess({
            id: 'new-event-123',
            name: 'New Workshop',
            description: 'A new workshop for students',
          })
        ),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockCreateQuery as any)

      await user.click(createButton)

      await waitFor(() => {
        expect(mockCreateQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Workshop',
            description: 'A new workshop for students',
            location: 'Conference Room',
          })
        )
      })
    })
  })

  describe('Membership Management Flow', () => {
    it('should complete membership application workflow', async () => {
      const mockUser = { id: 'student-123', email: 'student@example.com' }

      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock no existing membership
      const mockMembershipQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('No membership found', 'PGRST116')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockMembershipQuery as any)

      render(<App />)

      // Navigate to membership page
      window.location.pathname = '/dashboard/membership'

      await waitFor(() => {
        expect(screen.getByText(/choose your membership plan/i)).toBeInTheDocument()
      })

      // Select Gold membership
      const goldPlanButton = screen.getByRole('button', { name: /select gold/i })
      await user.click(goldPlanButton)

      // Fill membership form
      const eidInput = screen.getByLabelText(/e-id/i)
      await user.type(eidInput, 'E001')

      // Mock membership creation success
      const mockCreateMembershipQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(
          mockSupabaseSuccess({
            id: 'membership-123',
            user_id: 'student-123',
            tier: 'gold',
            status: 'pending_payment',
            amount: 10000,
            eid: 'E001',
          })
        ),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockCreateMembershipQuery as any)

      const submitButton = screen.getByRole('button', { name: /apply for membership/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateMembershipQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'student-123',
            tier: 'gold',
            status: 'pending_payment',
            amount: 10000,
            eid: 'E001',
          })
        )
      })

      // Should show payment instructions
      expect(screen.getByText(/payment instructions/i)).toBeInTheDocument()
    })

    it('should handle membership renewal workflow', async () => {
      const mockUser = { id: 'student-123', email: 'student@example.com' }
      const mockExpiredMembership = {
        id: 'membership-123',
        user_id: 'student-123',
        tier: 'bronze',
        status: 'expired',
        end_date: '2024-01-01',
        eid: 'E001',
      }

      // Mock authenticated user with expired membership
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockMembershipQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockExpiredMembership)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockMembershipQuery as any)

      render(<App />)

      // Navigate to membership page
      window.location.pathname = '/dashboard/membership'

      await waitFor(() => {
        expect(screen.getByText(/renew your membership/i)).toBeInTheDocument()
      })

      // Select Silver renewal
      const renewSilverButton = screen.getByRole('button', { name: /renew with silver/i })
      await user.click(renewSilverButton)

      // Mock renewal creation
      const mockRenewalQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(
          mockSupabaseSuccess({
            id: 'membership-124',
            user_id: 'student-123',
            tier: 'silver',
            status: 'pending_payment',
            amount: 5000,
            eid: 'E001',
            is_renewal: true,
          })
        ),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockRenewalQuery as any)

      const confirmButton = screen.getByRole('button', { name: /confirm renewal/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockRenewalQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'student-123',
            tier: 'silver',
            status: 'pending_payment',
            amount: 5000,
            is_renewal: true,
          })
        )
      })
    })
  })

  describe('Error Handling Workflows', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock authentication failure
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(
        mockSupabaseError('Invalid login credentials')
      )

      render(<App />)

      // Navigate to login and attempt login
      window.location.pathname = '/login'

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
      })

      // User should still be on login page
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard')
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Network connection failed')
      })

      render(<App />)

      // Navigate to events page
      window.location.pathname = '/dashboard/events'

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should handle permission denied errors', async () => {
      const mockUser = { id: 'student-123', email: 'student@example.com' }

      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock permission denied for admin access
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(false))

      render(<App />)

      // Try to access admin page
      window.location.pathname = '/dashboard/admin'

      await waitFor(() => {
        expect(screen.getByText(/unauthorized access/i)).toBeInTheDocument()
      })

      // Should redirect to unauthorized page
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized')
    })
  })

  describe('Data Consistency Workflows', () => {
    it('should maintain data consistency during concurrent operations', async () => {
      const mockUser = { id: 'student-123', email: 'student@example.com' }
      const mockEvent = {
        id: 'event-123',
        name: 'Popular Workshop',
        max_participants: 1,
        event_registrations: [],
      }

      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock event at capacity after first registration
      const mockEventsQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSupabaseSuccess([mockEvent])),
      }

      // First registration succeeds
      const mockFirstRegistration = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ id: 'reg-1' })),
      }

      // Second registration fails due to capacity
      const mockSecondRegistration = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Event is full')),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockEventsQuery as any)
        .mockReturnValueOnce(mockFirstRegistration as any)
        .mockReturnValueOnce(mockSecondRegistration as any)

      render(<App />)

      window.location.pathname = '/dashboard/events'

      await waitFor(() => {
        expect(screen.getByText('Popular Workshop')).toBeInTheDocument()
      })

      const registerButton = screen.getByRole('button', { name: /register/i })
      await user.click(registerButton)

      // First registration should succeed
      await waitFor(() => {
        expect(mockFirstRegistration.insert).toHaveBeenCalled()
      })

      // Simulate another user trying to register (event now full)
      await user.click(registerButton)

      await waitFor(() => {
        expect(screen.getByText(/event is full/i)).toBeInTheDocument()
      })
    })
  })
})
