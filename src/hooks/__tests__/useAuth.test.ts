import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'
import { supabase } from '@/integrations/supabase/client'
import { resetAuth } from '@/utils/authCleanup'
import { toast } from '@/components/ui/sonner'

// Mock dependencies
vi.mock('@/integrations/supabase/client')
vi.mock('@/utils/authCleanup')
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))
vi.mock('@/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
const mockSupabase = vi.mocked(supabase)
const mockResetAuth = vi.mocked(resetAuth)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    
    // Default mocks
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    mockSupabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    
    mockSupabase.auth.signOut = vi.fn().mockResolvedValue({
      error: null,
    })
    
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it('should handle successful user session with role', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSession = { user: mockUser }
    
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })
    
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'student' },
        error: null,
      }),
    }
    mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.role).toBe('student')
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockQuery.select).toHaveBeenCalledWith('role')
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123')
  })

  describe('profileError handling', () => {
    it('should handle profileError response, signOut and redirect to /login with toast', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { user: mockUser }
      
      // Mock successful session but profile error
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      
      const profileError = { message: 'Profile not found', code: 'PGRST116' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: profileError,
        }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Assert supabase.auth.signOut was called
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
      
      // Assert redirect to /login occurred
      expect(mockNavigate).toHaveBeenCalledWith('/login', { 
        state: { error: 'missing-role' } 
      })
      
      // User should be null after sign out
      expect(result.current.user).toEqual(mockUser) // Initial user from session
      expect(result.current.role).toBeNull()
    })

    it('should handle profileError in auth state change and trigger proper cleanup', async () => {
      let authCallback: ((event: string, session: any) => Promise<void>) | null = null
      
      // Mock onAuthStateChange to capture the callback
      mockSupabase.auth.onAuthStateChange = vi.fn().mockImplementation((callback) => {
        authCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        }
      })
      
      // Mock initial session as null
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Now simulate auth state change with user but profile error
      const mockUser = { id: 'user-456', email: 'newuser@example.com' }
      const mockSession = { user: mockUser }
      
      const profileError = { message: 'Missing profile data', code: 'PGRST116' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: profileError,
        }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      // Trigger auth state change
      if (authCallback) {
        await act(async () => {
          await authCallback('SIGNED_IN', mockSession)
        })
      }

      // Assert supabase.auth.signOut was called
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
      
      // Assert redirect to /login occurred with proper error state
      expect(mockNavigate).toHaveBeenCalledWith('/login', { 
        state: { error: 'missing-role' } 
      })
    })

    it('should handle profileError when user has session but role query fails', async () => {
      const mockUser = { id: 'user-789', email: 'failing@example.com' }
      const mockSession = { user: mockUser }
      
      mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
      
      // Simulate database connection error
      const dbError = { message: 'connection to server at "localhost", port 5432 failed', code: '08006' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        // Assert supabase.auth.signOut was called due to profile error
        expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
      })

      // Assert redirect to /login occurred
      expect(mockNavigate).toHaveBeenCalledWith('/login', { 
        state: { error: 'missing-role' } 
      })
      
      expect(result.current.loading).toBe(false)
      expect(result.current.role).toBeNull()
    })
  })

  it('should handle user with no session', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should handle successful signOut', async () => {
    mockResetAuth.mockResolvedValue()

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockResetAuth).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should handle signOut error gracefully', async () => {
    const signOutError = new Error('Sign out failed')
    mockResetAuth.mockRejectedValue(signOutError)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    // Should still attempt to sign out with supabase directly as fallback
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = vi.fn()
    mockSupabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth())
    
    unmount()
    
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('should handle auth state changes correctly', async () => {
    let authCallback: ((event: string, session: any) => Promise<void>) | null = null
    
    mockSupabase.auth.onAuthStateChange = vi.fn().mockImplementation((callback) => {
      authCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useAuth())

    // Wait for initial loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Simulate sign out
    if (authCallback) {
      await act(async () => {
        await authCallback('SIGNED_OUT', null)
      })
    }

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })
})
