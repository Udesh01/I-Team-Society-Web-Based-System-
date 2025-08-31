import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockEvent, mockSupabaseSuccess, mockSupabaseError } from '@/test/utils'
import EventList from '../EventList'
import { useQuery, useMutation } from '@tanstack/react-query'

vi.mock('@tanstack/react-query')

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('EventList Component', () => {
  const user = userEvent.setup()
  const mockUser = { id: 'user-123', email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser })
  })

  it('should render loading state while fetching events', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('should render error state when event fetching fails', () => {
    const errorMessage = 'Failed to fetch events'
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: errorMessage },
    } as any)

    render(<EventList />)

    expect(screen.getByText(/failed to fetch events/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should render empty state when no events exist', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByText(/no events found/i)).toBeInTheDocument()
    expect(screen.getByText(/check back later for upcoming events/i)).toBeInTheDocument()
  })

  it('should render list of events with proper information', () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'React Workshop',
        description: 'Learn React fundamentals',
        event_date: '2024-12-31T18:00:00.000Z',
        location: 'Tech Hub',
        max_participants: 50,
        event_registrations: [],
      }),
      createMockEvent({
        id: 'event-2',
        name: 'Python Seminar',
        description: 'Advanced Python concepts',
        event_date: '2024-12-25T14:00:00.000Z',
        location: 'Conference Room A',
        max_participants: 30,
        event_registrations: [{ user_id: 'other-user', attended: false }],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByText('React Workshop')).toBeInTheDocument()
    expect(screen.getByText('Learn React fundamentals')).toBeInTheDocument()
    expect(screen.getByText('Tech Hub')).toBeInTheDocument()
    expect(screen.getByText('50 spots available')).toBeInTheDocument()

    expect(screen.getByText('Python Seminar')).toBeInTheDocument()
    expect(screen.getByText('Advanced Python concepts')).toBeInTheDocument()
    expect(screen.getByText('Conference Room A')).toBeInTheDocument()
    expect(screen.getByText('29 spots available')).toBeInTheDocument()
  })

  it('should show registration status for user-registered events', () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_registrations: [{ user_id: 'user-123', attended: false }],
      }),
      createMockEvent({
        id: 'event-2',
        name: 'Seminar',
        event_registrations: [{ user_id: 'other-user', attended: false }],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    const registeredEvent = screen.getByText('Workshop').closest('[data-testid="event-card"]')
    const unregisteredEvent = screen.getByText('Seminar').closest('[data-testid="event-card"]')

    expect(registeredEvent).toHaveTextContent('Registered')
    expect(unregisteredEvent).toHaveTextContent('Register')
  })

  it('should show full status for events at capacity', () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Full Workshop',
        max_participants: 2,
        event_registrations: [
          { user_id: 'user-1', attended: false },
          { user_id: 'user-2', attended: false },
        ],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByText('Full')).toBeInTheDocument()
    expect(screen.getByText('0 spots available')).toBeInTheDocument()
  })

  it('should handle event registration successfully', async () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_registrations: [],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    const mockMutate = vi.fn()
    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    const registerButton = screen.getByRole('button', { name: /register/i })
    await user.click(registerButton)

    expect(mockMutate).toHaveBeenCalledWith({
      eventId: 'event-1',
      userId: 'user-123',
    })
  })

  it('should handle event unregistration successfully', async () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_registrations: [{ user_id: 'user-123', attended: false }],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    const mockMutate = vi.fn()
    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    const unregisterButton = screen.getByRole('button', { name: /registered/i })
    await user.click(unregisterButton)

    expect(mockMutate).toHaveBeenCalledWith({
      eventId: 'event-1',
      userId: 'user-123',
    })
  })

  it('should show loading state on register button during mutation', () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_registrations: [],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isLoading: true,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    const registerButton = screen.getByRole('button')
    expect(registerButton).toBeDisabled()
    expect(screen.getByText(/registering/i)).toBeInTheDocument()
  })

  it('should filter events by search query', async () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'React Workshop',
        description: 'Learn React fundamentals',
      }),
      createMockEvent({
        id: 'event-2',
        name: 'Python Seminar',
        description: 'Advanced Python concepts',
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    // Initially should show both events
    expect(screen.getByText('React Workshop')).toBeInTheDocument()
    expect(screen.getByText('Python Seminar')).toBeInTheDocument()

    // Filter by React
    const searchInput = screen.getByPlaceholderText(/search events/i)
    await user.type(searchInput, 'React')

    await waitFor(() => {
      expect(screen.getByText('React Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Python Seminar')).not.toBeInTheDocument()
    })
  })

  it('should filter events by event type', async () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_type: 'workshop',
      }),
      createMockEvent({
        id: 'event-2',
        name: 'Seminar',
        event_type: 'seminar',
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    // Filter by workshop type
    const filterSelect = screen.getByLabelText(/filter by type/i)
    await user.selectOptions(filterSelect, 'workshop')

    await waitFor(() => {
      expect(screen.getByText('Workshop')).toBeInTheDocument()
      expect(screen.queryByText('Seminar')).not.toBeInTheDocument()
    })
  })

  it('should sort events by date', async () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Future Event',
        event_date: '2024-12-31T18:00:00.000Z',
      }),
      createMockEvent({
        id: 'event-2',
        name: 'Near Event',
        event_date: '2024-12-25T14:00:00.000Z',
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    // Events should be sorted by date (nearest first by default)
    const eventCards = screen.getAllByTestId('event-card')
    expect(eventCards[0]).toHaveTextContent('Near Event')
    expect(eventCards[1]).toHaveTextContent('Future Event')
  })

  it('should display event dates in readable format', () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_date: '2024-12-31T18:00:00.000Z',
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByText(/december 31, 2024/i)).toBeInTheDocument()
    expect(screen.getByText(/6:00 PM/i)).toBeInTheDocument()
  })

  it('should handle registration errors gracefully', async () => {
    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_registrations: [],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      isError: true,
      error: { message: 'Registration failed' },
    } as any)

    render(<EventList />)

    expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
  })

  it('should refresh events list when refresh button is clicked', async () => {
    const mockRefetch = vi.fn()
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any)

    render(<EventList />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('should show different states for past events', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)

    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Past Workshop',
        event_date: pastDate.toISOString(),
        event_registrations: [{ user_id: 'user-123', attended: true }],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByText(/attended/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument()
  })

  it('should handle unauthenticated user gracefully', () => {
    mockUseAuth.mockReturnValue({ user: null })

    const mockEvents = [
      createMockEvent({
        id: 'event-1',
        name: 'Workshop',
        event_registrations: [],
      }),
    ]

    vi.mocked(useQuery).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByText(/sign in to register for events/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument()
  })
})
