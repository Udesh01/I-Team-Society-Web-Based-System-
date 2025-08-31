# Auth State Cleanup Utility

This document describes the enhanced authentication cleanup utility that ensures all cached authentication data is properly cleared when users sign out or their session expires.

## Overview

The `AuthCleanup` utility provides comprehensive cleanup of authentication-related data across different storage mechanisms:

- **Supabase Auth Session**: Clears the actual authentication session
- **React Query Cache**: Removes all cached query data
- **Browser Storage**: Clears localStorage and sessionStorage auth data
- **Memory Management**: Forces garbage collection when available

## Files

### Core Utility
- `src/utils/authCleanup.ts` - Main cleanup utility class

### Integration Points
- `src/context/AuthContext.tsx` - Uses `resetAuth()` in signOut function
- `src/hooks/useAuth.ts` - Uses `resetAuth()` in signOut function
- `src/App.tsx` - Registers QueryClient with AuthCleanup

### Debug Component
- `src/components/debug/AuthCleanupDebug.tsx` - Testing and debugging interface

## Usage

### Basic Usage

```typescript
import { resetAuth, clearUserCache } from '@/utils/authCleanup';

// Full authentication cleanup (signs out + clears all cache)
await resetAuth();

// Partial cleanup (clears only user-related cache)
await clearUserCache();
```

### Integration in Auth Context

```typescript
import { resetAuth } from '@/utils/authCleanup';

const signOut = async () => {
  try {
    // Use comprehensive auth cleanup
    await resetAuth();
  } catch (error) {
    console.error('Error during sign out:', error);
    // Fallback to basic signout
    await supabase.auth.signOut();
  }
};
```

### Setting up QueryClient Integration

```typescript
import { AuthCleanup } from '@/utils/authCleanup';

const queryClient = new QueryClient();

// Register QueryClient for cache cleanup
AuthCleanup.setQueryClient(queryClient);
```

## API Reference

### AuthCleanup Class

#### Static Methods

##### `setQueryClient(queryClient: QueryClient)`
Registers a QueryClient instance for cache management.

##### `resetAuth(): Promise<void>`
Performs comprehensive authentication cleanup:
1. Signs out from Supabase
2. Clears React Query cache
3. Clears browser storage
4. Triggers garbage collection

##### `clearUserCache(): Promise<void>`
Clears only user-related query cache without signing out:
- Removes queries with keys: `['user']`, `['profile']`, `['events']`, etc.

##### `emergencyReset(): void`
Emergency cleanup that force-redirects to login page.
Use only when normal cleanup fails.

### Convenience Functions

```typescript
// Direct imports for common operations
import { resetAuth, clearUserCache } from '@/utils/authCleanup';

// Equivalent to AuthCleanup.resetAuth()
await resetAuth();

// Equivalent to AuthCleanup.clearUserCache()
await clearUserCache();
```

## Browser Storage Cleanup

The utility automatically clears potential auth-related keys from both localStorage and sessionStorage:

- `supabase.auth.token`
- `sb-auth-token`
- `auth-storage-key`
- `user-session`
- `auth-state`

## Query Cache Management

### Full Cache Clear
When `resetAuth()` is called, all queries in the React Query cache are cleared using `queryClient.clear()`.

### Selective Cache Clear
When `clearUserCache()` is called, only specific query keys are removed:

```typescript
const keysToRemove = [
  'user',
  'profile', 
  'events',
  'memberships',
  'notifications',
  'achievements'
];
```

## Error Handling

The utility includes comprehensive error handling:

```typescript
try {
  await resetAuth();
} catch (error) {
  console.error('Auth cleanup failed:', error);
  // Fallback to basic Supabase signOut
  await supabase.auth.signOut();
}
```

## Debug Component

The `AuthCleanupDebug` component provides a testing interface for the cleanup functionality:

### Features
- **User Info Display**: Shows current user ID, email, and role
- **Cache Statistics**: Displays number of cached queries and their keys
- **Test Buttons**: 
  - Cache Cleanup Test
  - Full Cleanup Test  
  - Normal Sign Out
  - Emergency Reset

### Usage in Development

Add the debug component to any page during development:

```typescript
import AuthCleanupDebug from '@/components/debug/AuthCleanupDebug';

// Add to your component JSX
{process.env.NODE_ENV === 'development' && <AuthCleanupDebug />}
```

## Best Practices

### When to Use Each Method

1. **`resetAuth()`** - Use for:
   - User-initiated logout
   - Session expiry
   - Authentication errors
   - Role changes requiring full cleanup

2. **`clearUserCache()`** - Use for:
   - Profile updates
   - Role changes within same session
   - Refreshing user data without logout

3. **`emergencyReset()`** - Use for:
   - Critical auth state corruption
   - When normal cleanup fails
   - Emergency debugging situations

### Integration Guidelines

1. **Always register QueryClient** in your main App component
2. **Use try-catch blocks** around cleanup calls
3. **Provide fallback** to basic Supabase signOut on errors
4. **Test cleanup behavior** in development using the debug component

## Troubleshooting

### Common Issues

**Problem**: Cache not clearing after logout
**Solution**: Ensure QueryClient is registered with `AuthCleanup.setQueryClient()`

**Problem**: User data persists after signout
**Solution**: Check if all auth-related localStorage keys are included in cleanup

**Problem**: App crashes during cleanup
**Solution**: Wrap cleanup calls in try-catch blocks with fallbacks

### Debugging Steps

1. Enable the AuthCleanupDebug component
2. Check console logs for cleanup status messages
3. Verify cache statistics before and after cleanup
4. Test emergency reset if normal cleanup fails

## Migration Guide

### From Basic signOut to Enhanced Cleanup

**Before:**
```typescript
const signOut = async () => {
  await supabase.auth.signOut();
};
```

**After:**
```typescript
import { resetAuth } from '@/utils/authCleanup';

const signOut = async () => {
  try {
    await resetAuth();
  } catch (error) {
    console.error('Cleanup failed:', error);
    await supabase.auth.signOut(); // fallback
  }
};
```

This comprehensive cleanup ensures that all authentication-related data is properly cleared, preventing issues with stale cache data and improving the overall user experience.
