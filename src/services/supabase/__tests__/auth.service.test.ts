import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../auth.service'
import { supabase } from '@/integrations/supabase/client'
import { mockSupabaseSuccess, mockSupabaseError } from '@/test/utils'

vi.mock('@/integrations/supabase/client')

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const user = await AuthService.getCurrentUser()
      expect(user).toEqual(mockUser)
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
    })

    it('should return null when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const user = await AuthService.getCurrentUser()
      expect(user).toBeNull()
    })
  })

  describe('getUserRole', () => {
    it('should return user role for valid user', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'admin' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const role = await AuthService.getUserRole('user-123')
      
      expect(role).toBe('admin')
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.select).toHaveBeenCalledWith('role')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123')
      expect(mockQuery.single).toHaveBeenCalledTimes(1)
    })

    it('should throw error when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Database error')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(AuthService.getUserRole('user-123')).rejects.toThrow('Database error')
    })

    it('should return null for user with no role', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const role = await AuthService.getUserRole('user-123')
      expect(role).toBeNull()
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(true))

      const isAdmin = await AuthService.isAdmin('admin-user')
      
      expect(isAdmin).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('is_admin', { user_id: 'admin-user' })
    })

    it('should return false for non-admin user', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(false))

      const isAdmin = await AuthService.isAdmin('student-user')
      expect(isAdmin).toBe(false)
    })

    it('should throw error when RPC call fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseError('RPC error'))

      await expect(AuthService.isAdmin('user-123')).rejects.toThrow('RPC error')
    })
  })

  describe('isStaff', () => {
    it('should return true for staff user', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(true))

      const isStaff = await AuthService.isStaff('staff-user')
      
      expect(isStaff).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('is_staff', { user_id: 'staff-user' })
    })

    it('should return false for non-staff user', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(false))

      const isStaff = await AuthService.isStaff('student-user')
      expect(isStaff).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('should return true for admin with admin permissions', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'admin' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const hasPermission = await AuthService.hasPermission('admin-user', 'create_users')
      expect(hasPermission).toBe(true)
    })

    it('should return false for student with admin permissions', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'student' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const hasPermission = await AuthService.hasPermission('student-user', 'create_users')
      expect(hasPermission).toBe(false)
    })

    it('should return true for student with student permissions', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'student' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const hasPermission = await AuthService.hasPermission('student-user', 'join_events')
      expect(hasPermission).toBe(true)
    })

    it('should return true for staff with staff permissions', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'staff' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const hasPermission = await AuthService.hasPermission('staff-user', 'mark_attendance')
      expect(hasPermission).toBe(true)
    })

    it('should return false for user with no role', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: null })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const hasPermission = await AuthService.hasPermission('no-role-user', 'join_events')
      expect(hasPermission).toBe(false)
    })

    it('should return false for invalid permission', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'admin' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const hasPermission = await AuthService.hasPermission('admin-user', 'invalid_permission')
      expect(hasPermission).toBe(false)
    })
  })

  describe('checkPermission', () => {
    it('should return true for valid permission', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'admin' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const checkPermission = AuthService.checkPermission('create_users')
      const result = await checkPermission('admin-user')
      
      expect(result).toBe(true)
    })

    it('should throw error for invalid permission', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role: 'student' })),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const checkPermission = AuthService.checkPermission('create_users')
      
      await expect(checkPermission('student-user')).rejects.toThrow('Unauthorized: Insufficient permissions')
    })
  })

  describe('Role-based permission matrix tests', () => {
    const testCases = [
      { role: 'admin', permission: 'create_users', expected: true },
      { role: 'admin', permission: 'manage_events', expected: true },
      { role: 'admin', permission: 'join_events', expected: true },
      { role: 'staff', permission: 'create_users', expected: false },
      { role: 'staff', permission: 'manage_events_limited', expected: true },
      { role: 'staff', permission: 'join_events', expected: true },
      { role: 'student', permission: 'create_users', expected: false },
      { role: 'student', permission: 'manage_events', expected: false },
      { role: 'student', permission: 'join_events', expected: true },
      { role: 'student', permission: 'view_eid', expected: true },
      { role: 'student', permission: 'mark_attendance', expected: true },
    ]

    testCases.forEach(({ role, permission, expected }) => {
      it(`should ${expected ? 'allow' : 'deny'} ${role} to ${permission}`, async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ role })),
        }
        vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

        const hasPermission = await AuthService.hasPermission('test-user', permission)
        expect(hasPermission).toBe(expected)
      })
    })
  })
})
