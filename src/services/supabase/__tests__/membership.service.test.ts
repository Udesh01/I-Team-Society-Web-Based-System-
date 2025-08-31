import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MembershipService } from '../membership.service'
import { supabase } from '@/integrations/supabase/client'
import { mockSupabaseSuccess, mockSupabaseError } from '@/test/utils'

vi.mock('@/integrations/supabase/client')

describe('MembershipService', () = {
  beforeEach(() = {
    vi.clearAllMocks()
  })

  describe('getCurrentMembership', () = {
    it('should return current membership for user with active membership', async () = {
      const mockMembership = {
        id: 'membership-123',
        tier: 'bronze',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockMembership)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const membership = await MembershipService.getCurrentMembership('user-123')
      expect(membership).toEqual(mockMembership)
    })

    it('should return null for user with no membership', async () = {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('No membership found')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const membership = await MembershipService.getCurrentMembership('user-123')
      expect(membership).toBeNull()
    })

    it('should throw error for database query failure', async () = {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Database error')),        
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(MembershipService.getCurrentMembership('user-123')).rejects.toThrow('Database error')
    })
  })

  describe('hasActiveMembership', () = {
    it('should return true for user with active membership', async () = {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(true))

      const hasActive = await MembershipService.hasActiveMembership('user-123')
      expect(hasActive).toBe(true)
    })

    it('should return false for user without active membership', async () = {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseSuccess(false))

      const hasActive = await MembershipService.hasActiveMembership('user-123')
      expect(hasActive).toBe(false)
    })

    it('should throw error for RPC call failure', async () = {
      vi.mocked(supabase.rpc).mockResolvedValue(mockSupabaseError('RPC error'))

      await expect(MembershipService.hasActiveMembership('user-123')).rejects.toThrow('RPC error')
    })
  })

  describe('getAllMemberships', () = {
    it('should return all memberships', async () = {
      const mockData = [{
        id: 'membership-1',
        status: 'active',
      }, {
        id: 'membership-2',
        status: 'completed',
      }]
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      vi.mocked(mockQuery.order).mockResolvedValue(mockSupabaseSuccess(mockData))

      const memberships = await MembershipService.getAllMemberships()
      expect(memberships).toEqual(mockData)
    })

    it('should throw error for database query failure', async () = {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      vi.mocked(mockQuery.order).mockResolvedValue(mockSupabaseError('Database error'))

      await expect(MembershipService.getAllMemberships()).rejects.toThrow('Database error')
    })
  })

  describe('updateMembershipStatus', () = {
    it('should update membership status successfully', async () = {
      const mockMembership = {
        id: 'membership-123',
        status: 'pending_payment',
      }
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockMembership)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const updated = await MembershipService.updateMembershipStatus('membership-123', 'active')
      expect(updated).toEqual(mockMembership)
    })

    it('should throw error for failed update', async () = {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Update failed')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(MembershipService.updateMembershipStatus('membership-123', 'active')).rejects.toThrow('Update failed')
    })
  })

  describe('createMembership', () = {
    it('should create a new membership', async () = {
      const mockMembership = {
        id: 'membership-123',
        user_id: 'user-123',
        tier: 'gold',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        amount: 10000,
        eid: 'E123',
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockMembership)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const created = await MembershipService.createMembership({
        user_id: 'user-123',
        tier: 'gold',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        amount: 10000,
        eid: 'E123',
      })
      expect(created).toEqual(mockMembership)
    })

    it('should throw error if membership creation fails', async () = {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Creation error')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(MembershipService.createMembership({
        user_id: 'user-123',
        tier: 'gold',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        amount: 10000,
        eid: 'E123',
      })).rejects.toThrow('Creation error')
    })
  })

  describe('createPayment', () = {
    it('should create a new payment', async () = {
      const mockPayment = {
        id: 'payment-123',
        user_id: 'user-123',
        membership_id: 'membership-123',
        amount: 10000,
        status: 'completed',
        payment_date: '2024-01-01',
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockPayment)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const created = await MembershipService.createPayment({
        user_id: 'user-123',
        membership_id: 'membership-123',
        amount: 10000,
        status: 'completed',
      })
      expect(created).toEqual(mockPayment)
    })

    it('should throw error if payment creation fails', async () = {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Creation error')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(MembershipService.createPayment({
        user_id: 'user-123',
        membership_id: 'membership-123',
        amount: 10000,
        status: 'completed',
      })).rejects.toThrow('Creation error')
    })
  })

  describe('renewMembership', () = {
    it('should renew membership', async () = {
      const mockCurrentMembership = {
        eid: 'E123',
        end_date: '2024-12-31',
      }
      const mockRenewedMembership = {
        id: 'membership-124',
        user_id: 'user-123',
        tier: 'gold',
        status: 'pending_payment',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        amount: 10000,
        eid: 'E123',
        payment_method: 'card',
        is_renewal: true,
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockCurrentMembership)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockRenewedMembership)),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery as any).mockReturnValueOnce(mockInsertQuery as any)

      const renewed = await MembershipService.renewMembership('user-123', 'gold', 'card')
      expect(renewed).toEqual(mockRenewedMembership)
    })

    it('should throw error if current membership not found', async () = {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('No current membership found')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(MembershipService.renewMembership('user-123', 'gold', 'card')).rejects.toThrow('No current membership found')
    })

    it('should throw error if renewal fails', async () = {
      const mockCurrentMembership = {
        eid: 'E123',
        end_date: '2024-12-31',
      }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockCurrentMembership)),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery as any)

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Renewal error')),
      }
      vi.mocked(supabase.from).mockReturnValueOnce(mockQuery as any).mockReturnValueOnce(mockInsertQuery as any)

      await expect(MembershipService.renewMembership('user-123', 'gold', 'card')).rejects.toThrow('Renewal error')
    })
  })
})

