import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ModernStudentDashboard from '@/pages/dashboard/ModernStudentDashboard'
import ModernStaffDashboard from '@/pages/dashboard/ModernStaffDashboard'
import ModernAdminDashboard from '@/pages/dashboard/ModernAdminDashboard'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase
vi.mock('@/integrations/supabase/client')

// Mock toast
vi.mock('@/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockSupabase = vi.mocked(supabase)

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Dashboard Loading Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth state
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  describe('ModernStudentDashboard', () => {
    it('should show loading state initially', async () => {
      // Mock user with valid ID
      const mockUser = { id: 'student-123', email: 'student@test.com' }
      
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      // Mock slow data fetch to keep loading state
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000))),
      })

      render(
        <TestWrapper>
          <ModernStudentDashboard />
        </TestWrapper>
      )

      // Should show loading skeleton
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    })

    it('should load data and hide loading state when user ID is present', async () => {
      const mockUser = { id: 'student-123', email: 'student@test.com' }
      
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      // Mock successful data fetch
      const mockProfile = {
        id: mockUser.id,
        first_name: 'John',
        last_name: 'Student',
        role: 'student',
      }

      const mockMembership = {
        id: 'mem-123',
        status: 'active',
        tier: 'bronze',
        amount: 2500,
      }

      mockSupabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }
        }
        
        if (table === 'memberships') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockMembership,
              error: null,
            }),
          }
        }
        
        // Default return for other tables
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }
      })

      render(
        <TestWrapper>
          <ModernStudentDashboard />
        </TestWrapper>
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      }, { timeout: 3000 })

      // Should show dashboard content
      await waitFor(() => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
      })
    })

    it('should not fetch data when user ID is missing', async () => {
      // Mock no user
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const mockFrom = vi.fn()
      mockSupabase.from = mockFrom

      render(
        <TestWrapper>
          <ModernStudentDashboard />
        </TestWrapper>
      )

      // Wait a bit to ensure no data fetch occurs
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should not try to fetch data
      expect(mockFrom).not.toHaveBeenCalled()

      // Should not show loading indefinitely
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('ModernStaffDashboard', () => {
    it('should handle user ID properly in useEffect', async () => {
      const mockUser = { id: 'staff-123', email: 'staff@test.com' }
      
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      // Mock data fetch functions
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockUser.id, role: 'staff' },
          error: null,
        }),
      })

      const consoleSpy = vi.spyOn(console, 'log')

      render(
        <TestWrapper>
          <ModernStaffDashboard />
        </TestWrapper>
      )

      // Should trigger useEffect and log user information
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('ModernStaffDashboard: useEffect triggered'),
          expect.objectContaining({
            userId: mockUser.id,
            hasUser: true,
          })
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('ModernAdminDashboard', () => {
    it('should handle async data fetching correctly', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@test.com' }
      
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      // Mock successful admin data fetch
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      render(
        <TestWrapper>
          <ModernAdminDashboard />
        </TestWrapper>
      )

      // Should eventually load dashboard content
      await waitFor(() => {
        expect(screen.getByText(/Admin Control Center/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('useEffect Dependency Arrays', () => {
    it('should only re-run effect when user.id changes, not entire user object', async () => {
      const mockUser = { id: 'test-123', email: 'test@test.com' }
      let effectCallCount = 0
      
      // Create a component that tracks effect calls
      const TestComponent = () => {
        const [user, setUser] = React.useState(mockUser)
        
        React.useEffect(() => {
          effectCallCount++
          console.log('Effect called:', effectCallCount)
        }, [user?.id]) // This is the pattern we fixed
        
        return (
          <div>
            <button onClick={() => setUser({ ...user, email: 'new@test.com' })}>
              Change Email
            </button>
            <span data-testid="effect-count">{effectCallCount}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      // Initial effect call
      expect(screen.getByTestId('effect-count')).toHaveTextContent('1')
      
      // Change user object but keep ID the same
      fireEvent.click(screen.getByText('Change Email'))
      
      // Effect should not be called again since ID didn't change
      await waitFor(() => {
        expect(screen.getByTestId('effect-count')).toHaveTextContent('1')
      })
    })
  })
})
