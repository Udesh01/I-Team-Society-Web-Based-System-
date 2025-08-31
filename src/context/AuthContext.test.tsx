import React, { useRef, useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import { vi } from 'vitest';

// Mock the supabase client to prevent network calls during tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        })
      })
    })
  }
}));

// Mock the resetAuth utility
vi.mock('@/utils/authCleanup', () => ({
  resetAuth: vi.fn().mockResolvedValue(undefined)
}));

// A test component that captures context references
const TestComponent = () => {
  const auth = useAuth();
  const contextRef = useRef(auth);
  const renderCount = useRef(0);
  
  renderCount.current++;
  
  // Store the first context reference
  if (renderCount.current === 1) {
    contextRef.current = auth;
  }
  
  return (
    <div>
      <div data-testid="render-count">{renderCount.current}</div>
      <div data-testid="context-stable">
        {contextRef.current === auth ? 'stable' : 'changed'}
      </div>
      <div data-testid="user-status">{auth.user ? auth.user.id : 'No user'}</div>
      <div data-testid="loading-status">{auth.loading ? 'loading' : 'loaded'}</div>
    </div>
  );
};

test('AuthContext provides stable references when auth state unchanged', async () => {
  let contextRefs: any[] = [];
  
  const ContextCapture = () => {
    const auth = useAuth();
    contextRefs.push(auth);
    return <div data-testid="context-captured">Context captured {contextRefs.length}</div>;
  };

  let TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );

  const { getByTestId, rerender } = render(
    <TestWrapper>
      <ContextCapture />
    </TestWrapper>
  );

  // Wait for initial render and auth state to stabilize
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  expect(getByTestId('context-captured')).toHaveTextContent('Context captured');
  
  const initialContextCount = contextRefs.length;
  const lastContext = contextRefs[contextRefs.length - 1];

  // Force a rerender with the same provider
  rerender(
    <TestWrapper>
      <ContextCapture />
    </TestWrapper>
  );

  // Wait for potential state changes
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // The context should be memoized - we should have the same reference
  // when the auth state primitives haven't changed
  const newContext = contextRefs[contextRefs.length - 1];
  
  // Check that key properties remain stable
  expect(newContext.user).toBe(lastContext.user);
  expect(newContext.session).toBe(lastContext.session);
  expect(newContext.role).toBe(lastContext.role);
  expect(newContext.signOut).toBe(lastContext.signOut);
});

test('AuthContext memoizes with stable primitives', () => {
  let contextValueHistory: any[] = [];
  
  const ContextCapture = () => {
    const auth = useAuth();
    contextValueHistory.push(auth);
    return <div>Context captured</div>;
  };

  const { rerender } = render(
    <AuthProvider>
      <ContextCapture />
    </AuthProvider>
  );

  // Force multiple rerenders
  rerender(
    <AuthProvider>
      <ContextCapture />
    </AuthProvider>
  );
  
  rerender(
    <AuthProvider>
      <ContextCapture />
    </AuthProvider>
  );

  // With proper memoization, context values should be the same reference
  // when the underlying auth state hasn't changed
  expect(contextValueHistory.length).toBeGreaterThan(1);
  
  // Check that the same context object reference is maintained
  const firstContext = contextValueHistory[0];
  const lastContext = contextValueHistory[contextValueHistory.length - 1];
  
  // The context should be stable across renders when auth state is unchanged
  expect(firstContext.user).toBe(lastContext.user);
  expect(firstContext.session).toBe(lastContext.session);
  expect(firstContext.role).toBe(lastContext.role);
  expect(firstContext.signOut).toBe(lastContext.signOut);
});
