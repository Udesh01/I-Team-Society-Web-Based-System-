import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventService } from '../event.service'
import { supabase } from '@/integrations/supabase/client'
import { mockSupabaseSuccess, mockSupabaseError, createMockEvent } from '@/test/utils'

vi.mock('@/integrations/supabase/client')
vi.mock('../../email/email.service')

describe('EventService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllEvents', () => {
    it('should return all events with registrations', async () => {
      const mockEvents = [
        createMockEvent({ id: 'event-1', name: 'Workshop' }),
        createMockEvent({ id: 'event-2', name: 'Seminar' }),
      ]
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      vi.mocked(mockQuery.order).mockResolvedValue(mockSupabaseSuccess(mockEvents))

      const events = await EventService.getAllEvents()
      
      expect(events).toEqual(mockEvents)
      expect(supabase.from).toHaveBeenCalledWith('events')
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('event_registrations'))
      expect(mockQuery.order).toHaveBeenCalledWith('event_date', { ascending: true })
    })

    it('should throw error for database query failure', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
      vi.mocked(mockQuery.order).mockResolvedValue(mockSupabaseError('Database error'))

      await expect(EventService.getAllEvents()).rejects.toThrow('Database error')
    })
  })

  describe('getEventById', () => {
    it('should return event by ID with registrations', async () => {
      const mockEvent = createMockEvent({ id: 'event-123', name: 'Test Event' })
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockEvent)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const event = await EventService.getEventById('event-123')
      
      expect(event).toEqual(mockEvent)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'event-123')
    })

    it('should throw error for non-existent event', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Event not found')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(EventService.getEventById('non-existent')).rejects.toThrow('Event not found')
    })
  })

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const mockEvent = createMockEvent({ name: 'New Event' })
      const eventData = {
        name: 'New Event',
        description: 'A new test event',
        event_date: '2024-12-31T18:00:00.000Z',
        location: 'Test Venue',
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockEvent)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const created = await EventService.createEvent(eventData)
      
      expect(created).toEqual(mockEvent)
      expect(mockQuery.insert).toHaveBeenCalledWith(eventData)
    })

    it('should throw error for failed event creation', async () => {
      const eventData = { name: 'New Event' }
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Creation failed')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(EventService.createEvent(eventData)).rejects.toThrow('Creation failed')
    })
  })

  describe('registerForEvent', () => {
    it('should register user for event when not already registered', async () => {
      const mockRegistration = {
        id: 'registration-123',
        event_id: 'event-123',
        user_id: 'user-123',
        registered_at: '2024-01-01T00:00:00.000Z',
      }

      // Mock check for existing registration - not found
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('No existing registration', 'PGRST116')),
      }
      
      // Mock insert new registration
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockRegistration)),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any)

      const result = await EventService.registerForEvent('event-123', 'user-123')
      
      expect(result).toEqual(mockRegistration)
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        event_id: 'event-123',
        user_id: 'user-123',
        registered_at: expect.any(String),
      })
    })

    it('should unregister user from event when already registered', async () => {
      const existingRegistration = { id: 'registration-123' }

      // Mock check for existing registration - found
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(existingRegistration)),
      }
      
      // Mock delete registration
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
      }
      mockDeleteQuery.select.mockResolvedValue(mockSupabaseSuccess([]))

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any)

      const result = await EventService.registerForEvent('event-123', 'user-123')
      
      expect(result).toBeNull()
      expect(mockDeleteQuery.delete).toHaveBeenCalled()
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', 'registration-123')
    })

    it('should handle permission denied error', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Permission denied', '42501')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any)

      await expect(EventService.registerForEvent('event-123', 'user-123'))
        .rejects.toThrow('Permission denied. Please check your login status and try again.')
    })

    it('should handle row level security error', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('row-level security policy')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any)

      await expect(EventService.registerForEvent('event-123', 'user-123'))
        .rejects.toThrow('row-level security policy')
    })

    it('should handle duplicate registration error', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('No existing registration', 'PGRST116')),
      }
      
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Duplicate registration', '23505')),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any)

      await expect(EventService.registerForEvent('event-123', 'user-123'))
        .rejects.toThrow('You are already registered for this event.')
    })
  })

  describe('unregisterFromEvent', () => {
    it('should unregister user from event', async () => {
      const existingRegistration = { id: 'registration-123' }

      const mockFindQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(existingRegistration)),
      }
      
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockFindQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any)

      const result = await EventService.unregisterFromEvent('event-123', 'user-123')
      
      expect(result.success).toBe(true)
      expect(result.message).toBe('Successfully unregistered from event')
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', 'registration-123')
    })

    it('should return failure when user is not registered', async () => {
      const mockFindQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Not found', 'PGRST116')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockFindQuery as any)

      const result = await EventService.unregisterFromEvent('event-123', 'user-123')
      
      expect(result.success).toBe(false)
      expect(result.message).toBe('You are not registered for this event')
    })
  })

  describe('checkRegistrationStatus', () => {
    it('should return registration status for registered user', async () => {
      const mockRegistration = {
        id: 'registration-123',
        registered_at: '2024-01-01T00:00:00.000Z',
        attended: false,
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockRegistration)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const status = await EventService.checkRegistrationStatus('event-123', 'user-123')
      
      expect(status.isRegistered).toBe(true)
      expect(status.registration).toEqual(mockRegistration)
    })

    it('should return not registered status for unregistered user', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Not found', 'PGRST116')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const status = await EventService.checkRegistrationStatus('event-123', 'user-123')
      
      expect(status.isRegistered).toBe(false)
      expect(status.registration).toBeNull()
    })
  })

  describe('updateAttendance', () => {
    it('should mark attendance as true', async () => {
      const mockUpdatedRegistration = {
        id: 'registration-123',
        attended: true,
        attended_at: '2024-01-01T00:00:00.000Z',
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockUpdatedRegistration)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const updated = await EventService.updateAttendance('registration-123', true)
      
      expect(updated).toEqual(mockUpdatedRegistration)
      expect(mockQuery.update).toHaveBeenCalledWith({
        attended: true,
        attended_at: expect.any(String),
      })
    })

    it('should mark attendance as false', async () => {
      const mockUpdatedRegistration = {
        id: 'registration-123',
        attended: false,
        attended_at: null,
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockUpdatedRegistration)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const updated = await EventService.updateAttendance('registration-123', false)
      
      expect(updated).toEqual(mockUpdatedRegistration)
      expect(mockQuery.update).toHaveBeenCalledWith({
        attended: false,
        attended_at: null,
      })
    })
  })

  describe('updateEvent', () => {
    it('should update event without notifications', async () => {
      const mockUpdatedEvent = createMockEvent({ id: 'event-123', name: 'Updated Event' })
      const eventData = {
        name: 'Updated Event',
        description: 'Updated description',
        event_date: '2024-12-31T18:00:00.000Z',
        location: 'Updated Venue',
      }

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockUpdatedEvent)),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const updated = await EventService.updateEvent('event-123', eventData, false)
      
      expect(updated).toEqual(mockUpdatedEvent)
      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining(eventData))
    })

    it('should update event with notifications when changes are detected', async () => {
      const originalEvent = {
        id: 'event-123',
        name: 'Original Event',
        event_date: '2024-12-31T18:00:00.000Z',
        location: 'Original Venue',
        description: 'Original description',
        event_registrations: [
          { user_id: 'user-1' },
          { user_id: 'user-2' },
        ],
      }

      const updatedEventData = {
        name: 'Updated Event',
        description: 'Updated description',
        event_date: '2024-12-31T19:00:00.000Z',
        location: 'Updated Venue',
      }

      // Mock fetching original event with registrations
      const mockFetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(originalEvent)),
      }

      // Mock updating event
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess({ ...originalEvent, ...updatedEventData })),
      }

      // Mock creating notifications
      const mockNotificationQuery = {
        insert: vi.fn().mockResolvedValue(mockSupabaseSuccess([])),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockFetchQuery as any)
        .mockReturnValueOnce(mockUpdateQuery as any)
        .mockReturnValueOnce(mockNotificationQuery as any)

      const updated = await EventService.updateEvent('event-123', updatedEventData, true)
      
      expect(updated).toBeDefined()
      expect(mockNotificationQuery.insert).toHaveBeenCalled()
    })

    it('should handle update failure', async () => {
      const eventData = { name: 'Updated Event' }
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Update failed')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      await expect(EventService.updateEvent('event-123', eventData, false))
        .rejects.toThrow('Failed to update event: Update failed')
    })
  })

  describe('deleteEvent', () => {
    it('should delete event without notifications', async () => {
      const mockEvent = createMockEvent({ id: 'event-123', name: 'Test Event' })

      // Mock fetching event
      const mockEventQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockEvent)),
      }

      // Mock fetching registrations
      const mockRegistrationsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSupabaseSuccess([])),
      }

      // Mock deleting event
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockEventQuery as any)
        .mockReturnValueOnce(mockRegistrationsQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any)

      const result = await EventService.deleteEvent('event-123', false)
      
      expect(result.success).toBe(true)
      expect(result.notificationsSent).toBe(0)
      expect(result.registrationsDeleted).toBe(0)
    })

    it('should delete event with notifications when there are registrations', async () => {
      const mockEvent = createMockEvent({ id: 'event-123', name: 'Test Event' })
      const mockRegistrations = [
        { id: 'reg-1', user_id: 'user-1' },
        { id: 'reg-2', user_id: 'user-2' },
      ]

      // Mock fetching event
      const mockEventQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockEvent)),
      }

      // Mock fetching registrations
      const mockRegistrationsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSupabaseSuccess(mockRegistrations)),
      }

      // Mock creating notifications
      const mockNotificationQuery = {
        insert: vi.fn().mockResolvedValue(mockSupabaseSuccess([])),
      }

      // Mock deleting registrations
      const mockDeleteRegsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      }

      // Mock deleting event
      const mockDeleteEventQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockSupabaseSuccess(null)),
      }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockEventQuery as any)
        .mockReturnValueOnce(mockRegistrationsQuery as any)
        .mockReturnValueOnce(mockNotificationQuery as any)
        .mockReturnValueOnce(mockDeleteRegsQuery as any)
        .mockReturnValueOnce(mockDeleteEventQuery as any)

      const result = await EventService.deleteEvent('event-123', true)
      
      expect(result.success).toBe(true)
      expect(result.notificationsSent).toBe(2)
      expect(result.registrationsDeleted).toBe(2)
      expect(mockNotificationQuery.insert).toHaveBeenCalled()
    })

    it('should handle event not found', async () => {
      const mockEventQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSupabaseError('Event not found')),
      }
      vi.mocked(supabase.from).mockReturnValue(mockEventQuery as any)

      await expect(EventService.deleteEvent('non-existent', false))
        .rejects.toThrow('Failed to fetch event: Event not found')
    })
  })
})
