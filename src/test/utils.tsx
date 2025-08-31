import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockProfile = {
  id: 'test-user-id',
  first_name: 'John',
  last_name: 'Doe',
  role: 'student',
  student_id: 'ST001',
  year: 3,
  avatar_url: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockEvent = {
  id: 'test-event-id',
  name: 'Test Event',
  description: 'A test event for testing purposes',
  event_date: '2024-12-31T18:00:00.000Z',
  location: 'Test Venue',
  max_participants: 100,
  event_type: 'workshop',
  requirements: 'None',
  contact_info: 'test@example.com',
  image_url: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  event_registrations: [],
}

export const mockMembership = {
  id: 'test-membership-id',
  user_id: 'test-user-id',
  tier: 'bronze',
  status: 'active',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  amount: 2500,
  eid: 'E001',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockPayment = {
  id: 'test-payment-id',
  user_id: 'test-user-id',
  membership_id: 'test-membership-id',
  amount: 2500,
  status: 'completed',
  payment_date: '2024-01-01',
  bank_slip_url: null,
  notes: 'Test payment',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data generators
export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
})

export const createMockProfile = (overrides: Partial<typeof mockProfile> = {}) => ({
  ...mockProfile,
  ...overrides,
})

export const createMockEvent = (overrides: Partial<typeof mockEvent> = {}) => ({
  ...mockEvent,
  ...overrides,
})

export const createMockMembership = (overrides: Partial<typeof mockMembership> = {}) => ({
  ...mockMembership,
  ...overrides,
})

export const createMockPayment = (overrides: Partial<typeof mockPayment> = {}) => ({
  ...mockPayment,
  ...overrides,
})

// Common test assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

// Mock implementations
export const mockSupabaseSuccess = (data: any) => ({
  data,
  error: null,
})

export const mockSupabaseError = (message: string, code?: string) => ({
  data: null,
  error: { message, code },
})

// Helper to wait for async operations
export const waitForAsyncOperation = () => new Promise(resolve => setTimeout(resolve, 0))
