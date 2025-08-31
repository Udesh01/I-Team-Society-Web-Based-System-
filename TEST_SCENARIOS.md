# 🧪 I-Team Society Hub - Test Cases Documentation

This document provides comprehensive test coverage for the I-Team Society Hub application, ensuring all scenarios work fine.

## 📋 Test Structure Overview

Our test suite is organized into several categories:

- **Unit Tests**: Individual components and services
- **Integration Tests**: Complete user workflows
- **Service Tests**: Backend service functionality
- **Component Tests**: UI component behavior
- **Error Handling**: Edge cases and error scenarios

## 🔐 Authentication Tests

### Login Component Tests (`src/pages/__tests__/Login.test.tsx`)

#### ✅ Positive Scenarios
- **Valid Login**: User successfully logs in with correct credentials
- **Form Rendering**: All login form elements render properly
- **Password Toggle**: Password visibility can be toggled
- **Navigation Links**: Links to registration and forgot password work
- **Keyboard Navigation**: Tab order and Enter key submission work

#### ❌ Negative Scenarios
- **Empty Fields**: Validation errors for empty email/password
- **Invalid Email**: Error for malformed email addresses
- **Short Password**: Error for passwords under 6 characters
- **Invalid Credentials**: Error message for wrong login details
- **Unconfirmed Email**: Specific error for unverified accounts
- **Network Errors**: Graceful handling of connection issues
- **Loading States**: UI disabled during authentication

#### 🔄 Edge Cases
- **Multiple Error Types**: Different error messages for various failure types
- **Error Clearing**: Errors cleared on successful retry
- **Rate Limiting**: Handling too many failed attempts

### Authentication Service Tests (`src/services/supabase/__tests__/auth.service.test.ts`)

#### ✅ Core Functionality
- **Get Current User**: Returns authenticated user or null
- **Get User Role**: Fetches user role from database
- **Admin Check**: Validates admin permissions
- **Staff Check**: Validates staff permissions
- **Permission Matrix**: Complete role-based permission testing

#### 🎭 Role-Based Access Control
```typescript
// Test matrix for all role/permission combinations
const testCases = [
  { role: 'admin', permission: 'create_users', expected: true },
  { role: 'admin', permission: 'manage_events', expected: true },
  { role: 'staff', permission: 'create_users', expected: false },
  { role: 'staff', permission: 'join_events', expected: true },
  { role: 'student', permission: 'view_eid', expected: true },
  // ... and more
]
```

#### ❌ Error Scenarios
- **Database Errors**: Connection failures
- **Permission Denied**: Insufficient privileges
- **Invalid Users**: Non-existent user checks

## 🎫 Event Management Tests

### Event Service Tests (`src/services/supabase/__tests__/event.service.test.ts`)

#### ✅ Event CRUD Operations
- **Get All Events**: Fetch events with registrations
- **Get Event by ID**: Single event retrieval
- **Create Event**: New event creation
- **Update Event**: Event modification with notifications
- **Delete Event**: Event removal with cleanup

#### 🎯 Registration Management
- **User Registration**: Register user for events
- **User Unregistration**: Remove user from events
- **Registration Status**: Check if user is registered
- **Attendance Tracking**: Mark user attendance
- **Capacity Management**: Handle event capacity limits

#### 📧 Notification System
- **Event Updates**: Notify registered users of changes
- **Event Cancellation**: Send cancellation notifications
- **Email Integration**: Both in-app and email notifications

#### ❌ Error Handling
- **Permission Errors**: Row-level security violations
- **Duplicate Registration**: Handle duplicate attempts
- **Network Issues**: Database connection problems
- **Capacity Exceeded**: Event full scenarios

### Event List Component Tests (`src/components/events/__tests__/EventList.test.tsx`)

#### 🖼️ UI States
- **Loading State**: Skeleton while fetching
- **Error State**: Error message with retry
- **Empty State**: No events available
- **Event Display**: Proper event information layout

#### 🔍 Filtering and Search
- **Search Functionality**: Filter by event name/description
- **Type Filtering**: Filter by event type
- **Date Sorting**: Events sorted chronologically
- **Past Events**: Different UI for completed events

#### 🎫 Registration Flow
- **Registration Button**: Shows correct state
- **Unregistration**: Remove registration
- **Full Events**: Disabled state for capacity
- **Loading States**: Button disabled during operations
- **Error Display**: Registration error messages

## 👥 Membership Management Tests

### Membership Service Tests (`src/services/supabase/__tests__/membership.service.test.ts`)

#### ✅ Core Operations
- **Get Current Membership**: Fetch active membership
- **Check Active Status**: Verify membership validity
- **Create Membership**: New membership application
- **Update Status**: Admin membership approval
- **Payment Creation**: Payment record management

#### 🔄 Renewal Process
- **Membership Renewal**: Extend existing membership
- **Tier Upgrades**: Change membership levels
- **Payment Integration**: Handle renewal payments
- **EID Preservation**: Keep same E-ID during renewal

#### 💰 Payment Processing
- **Payment Records**: Track payment history
- **Status Updates**: Payment confirmation
- **Bank Slip Upload**: File handling
- **Payment Validation**: Admin verification

#### ❌ Error Scenarios
- **No Membership Found**: First-time users
- **Permission Denied**: Security violations
- **Duplicate Applications**: Multiple pending memberships
- **Database Errors**: Connection failures

## 🔗 Integration Tests

### Full User Workflows (`src/__tests__/integration/user-workflow.test.tsx`)

#### 🎯 Complete User Journeys

##### Student Registration to Event Participation
```typescript
// 1. User registers account
// 2. Confirms email
// 3. Applies for membership
// 4. Uploads payment proof
// 5. Gets approved
// 6. Registers for events
// 7. Attends events
```

##### Admin Event Management
```typescript
// 1. Admin logs in
// 2. Creates new event
// 3. Monitors registrations
// 4. Updates event details
// 5. Sends notifications
// 6. Marks attendance
// 7. Closes event
```

##### Membership Lifecycle
```typescript
// 1. Initial application
// 2. Payment submission
// 3. Admin approval
// 4. Active membership
// 5. Renewal notification
// 6. Renewal payment
// 7. Extended membership
```

#### 🚨 Error Recovery Flows
- **Authentication Failures**: Login retry mechanisms
- **Network Interruptions**: Offline/online handling
- **Permission Changes**: Role update scenarios
- **Data Conflicts**: Concurrent operation handling

## 📊 Test Scenarios by User Role

### 👨‍🎓 Student User Tests
- ✅ Account registration and verification
- ✅ Profile management and updates
- ✅ Membership application process
- ✅ Event browsing and filtering
- ✅ Event registration/unregistration
- ✅ Payment upload and tracking
- ✅ E-ID card generation and download
- ✅ Notification center usage
- ❌ Access to admin features (should fail)
- ❌ Unauthorized data access (should fail)

### 👨‍🏫 Staff User Tests
- ✅ All student capabilities
- ✅ Limited event management
- ✅ Attendance marking
- ✅ Event registration viewing
- ✅ Basic report access
- ❌ User creation (should fail)
- ❌ Payment management (should fail)
- ❌ System settings (should fail)

### 👨‍💼 Admin User Tests
- ✅ All system capabilities
- ✅ User management and creation
- ✅ Event creation and management
- ✅ Membership approval workflow
- ✅ Payment verification
- ✅ System notifications
- ✅ Data export and reports
- ✅ Settings management

## 🏷️ Test Categories by Functionality

### 🔒 Security Tests
- **Authentication**: Login/logout flows
- **Authorization**: Role-based access control
- **Data Protection**: Row-level security
- **Session Management**: Timeout and refresh
- **Input Validation**: SQL injection prevention
- **CSRF Protection**: Cross-site request forgery

### 📱 UI/UX Tests
- **Responsive Design**: Mobile and desktop layouts
- **Accessibility**: Screen reader compatibility
- **Loading States**: Skeleton screens and spinners
- **Error Messages**: Clear and actionable feedback
- **Form Validation**: Real-time input validation
- **Navigation**: Breadcrumbs and routing

### 🗄️ Data Management Tests
- **CRUD Operations**: Create, Read, Update, Delete
- **Data Integrity**: Referential constraints
- **Concurrency**: Multiple user scenarios
- **Backup/Recovery**: Data consistency
- **Migration**: Schema updates
- **Performance**: Query optimization

### 🔄 Real-time Features Tests
- **Live Notifications**: Instant updates
- **Event Registration**: Real-time capacity updates
- **Dashboard Updates**: Live data refresh
- **Concurrent Users**: Multiple simultaneous operations
- **WebSocket Connection**: Connection reliability

## 🎯 Test Execution Strategy

### 📋 Test Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run with UI dashboard
npm run test:ui

# Run tests once (CI/CD)
npm run test:run
```

### 📊 Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: All critical paths
- **Component Tests**: All user interactions
- **Service Tests**: All API endpoints
- **Error Scenarios**: All failure modes

### 🔧 Test Environment Setup
```typescript
// Mock configurations
- Supabase client mocking
- React Query mocking  
- Router navigation mocking
- File upload mocking
- Date/time mocking for consistency
```

## 📈 Test Scenarios Coverage Matrix

| Feature | Unit Tests | Integration Tests | Error Handling | Performance |
|---------|------------|-------------------|----------------|-------------|
| Authentication | ✅ | ✅ | ✅ | ⏳ |
| Event Management | ✅ | ✅ | ✅ | ⏳ |
| Membership System | ✅ | ✅ | ✅ | ⏳ |
| Payment Processing | ✅ | ✅ | ✅ | ⏳ |
| Notifications | ✅ | ✅ | ✅ | ⏳ |
| File Uploads | ⏳ | ⏳ | ⏳ | ⏳ |
| Dashboard Analytics | ⏳ | ⏳ | ⏳ | ⏳ |
| Search Functionality | ✅ | ⏳ | ✅ | ⏳ |

## 🚀 Running Specific Test Suites

### By Category
```bash
# Authentication tests only
npm test -- --testNamePattern="Auth"

# Event management tests
npm test -- --testNamePattern="Event"

# Integration tests only
npm test -- --testNamePattern="integration"

# Service tests only
npm test -- src/services
```

### By File
```bash
# Specific component
npm test -- Login.test.tsx

# Specific service
npm test -- auth.service.test.ts

# All component tests
npm test -- src/components
```

## 📝 Test Best Practices

### ✅ What We Test
- **Happy Paths**: Normal user workflows
- **Edge Cases**: Boundary conditions
- **Error Scenarios**: Failure modes
- **User Interactions**: Click, type, navigate
- **Data Flows**: API to UI updates
- **State Management**: Component state changes

### ❌ What We Don't Test
- **Implementation Details**: Internal functions
- **Third-party Libraries**: External dependencies
- **Styling**: CSS appearance (visual tests)
- **Browser Compatibility**: (separate E2E tests)

### 🔄 Continuous Testing
- **Pre-commit Hooks**: Run relevant tests
- **CI/CD Pipeline**: Full test suite
- **Pull Request**: Automated test runs
- **Deployment**: Production smoke tests

This comprehensive test suite ensures that all scenarios in the I-Team Society Hub application work correctly, providing confidence in the system's reliability and user experience.
