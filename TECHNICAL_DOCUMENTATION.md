# I-Team Society Management System - Technical Documentation

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI Components**: Shadcn/ui component library
- **Build Tool**: Vite
- **Package Manager**: npm
- **Deployment**: Ready for Vercel/Netlify

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard-specific components
│   ├── events/          # Event management components
│   ├── layout/          # Layout components
│   ├── membership/      # Membership-related components
│   ├── notifications/   # Notification system
│   └── ui/              # Base UI components
├── context/             # React context providers
├── integrations/        # External service integrations
├── pages/               # Page components
│   └── dashboard/       # Dashboard pages
├── services/            # Business logic and API calls
└── types/               # TypeScript type definitions
```

## 🗄️ Database Schema

### Core Tables

#### profiles
```sql
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- role (text: 'student', 'staff', 'admin')
- phone_number (text)
- address (text)
- photo_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### student_details
```sql
- id (uuid, foreign key to profiles.id)
- student_id (text, unique)
- faculty (text)
- department (text)
- degree (text)
- level (integer)
```

#### staff_details
```sql
- id (uuid, foreign key to profiles.id)
- staff_id (text, unique)
- department (text)
- position (text)
```

#### memberships
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles.id)
- eid (text, unique)
- status (text: 'pending_payment', 'pending_approval', 'active', 'expired')
- tier (text: 'bronze', 'silver', 'gold')
- amount (decimal)
- start_date (date)
- end_date (date)
- created_at (timestamp)
```

#### payments
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles.id)
- membership_id (uuid, foreign key to memberships.id)
- amount (decimal)
- bank_slip_url (text)
- status (text: 'pending', 'approved', 'rejected')
- payment_date (date)
- verified_by (uuid, foreign key to profiles.id)
- verified_at (timestamp)
- comments (text)
```

#### events
```sql
- id (uuid, primary key)
- title (text)
- description (text)
- event_date (timestamp)
- location (text)
- max_participants (integer)
- poster_url (text)
- status (text: 'draft', 'active', 'cancelled', 'completed')
- created_by (uuid, foreign key to profiles.id)
- created_at (timestamp)
```

#### event_registrations
```sql
- id (uuid, primary key)
- event_id (uuid, foreign key to events.id)
- user_id (uuid, foreign key to profiles.id)
- attended (boolean, default false)
- registered_at (timestamp)
```

#### notifications
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles.id)
- title (text)
- message (text)
- type (text: 'info', 'success', 'warning', 'error')
- read (boolean, default false)
- created_at (timestamp)
```

## 🔐 Authentication & Authorization

### Authentication Flow
1. User registers with email/password
2. Supabase sends verification email
3. User verifies email address
4. Profile created with role assignment
5. Role-based dashboard access granted

### Role-Based Access Control
```typescript
// Route protection example
<RoleBasedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</RoleBasedRoute>
```

### Permission Matrix
| Feature | Student | Staff | Admin |
|---------|---------|-------|-------|
| View Events | ✅ | ✅ | ✅ |
| Register for Events | ✅ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Approve Payments | ❌ | ❌ | ✅ |
| System Analytics | ❌ | ❌ | ✅ |

## 📁 File Storage

### Storage Buckets
- **profile-photos**: User profile images
- **payment-slips**: Payment verification documents
- **event-posters**: Event promotional images

### File Upload Process
```typescript
const uploadFile = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  
  if (error) throw error;
  return data.path;
};
```

### Security Policies
- Profile photos: Public read, authenticated upload
- Payment slips: Admin read, user upload
- Event posters: Public read, staff/admin upload

## 🔄 Real-time Features

### Notification System
```typescript
// Real-time notification subscription
const subscribeToNotifications = () => {
  return supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, handleNewNotification)
    .subscribe();
};
```

### Live Updates
- Membership status changes
- Event registrations
- Payment approvals
- System announcements

## 🎨 UI/UX Implementation

### Design System
- **Colors**: I-Team primary (#001155), secondary colors
- **Typography**: System fonts with proper hierarchy
- **Components**: Consistent shadcn/ui components
- **Responsive**: Mobile-first design approach

### Component Architecture
```typescript
// Example component structure
interface ComponentProps {
  data: DataType;
  onAction: (id: string) => void;
  loading?: boolean;
}

const Component: React.FC<ComponentProps> = ({ data, onAction, loading }) => {
  // Component implementation
};
```

## 🔧 Development Setup

### Prerequisites
```bash
Node.js 18+
npm or yarn
Git
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd iteam-society-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Build Process
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment Platforms
- **Vercel**: Automatic deployments from Git
- **Netlify**: Continuous deployment
- **Custom**: Any static hosting service

### Environment Setup
1. Set up Supabase project
2. Configure authentication providers
3. Set up storage buckets
4. Deploy database schema
5. Configure environment variables

## 🧪 Testing

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for critical user flows
- Manual testing for UI/UX

### Test Commands
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📊 Performance Optimization

### Code Splitting
```typescript
// Lazy loading for better performance
const AdminDashboard = lazy(() => import('./pages/dashboard/admin/AdminDashboard'));
```

### Image Optimization
- Automatic image compression
- WebP format support
- Lazy loading implementation
- Responsive image sizing

### Caching Strategy
- React Query for API caching
- Browser caching for static assets
- Service worker for offline support

## 🔍 Monitoring & Analytics

### Error Tracking
- Console error logging
- User action tracking
- Performance monitoring
- Crash reporting

### Analytics Implementation
```typescript
// Track user events
const trackEvent = (eventName: string, properties: object) => {
  // Analytics implementation
};
```

## 📞 Phone Number Handling

### No-Validation Policy
- **Core Principle**: Phone numbers are accepted in ANY format without validation
- **Storage**: Raw strings stored unchanged in database
- **Forms**: No format restrictions on Contact, Registration, and Profile forms
- **User Experience**: Prevents form submission blocking due to format issues
- **International Support**: All international and local phone formats accepted

### Implementation Details
```typescript
// Example: Form validation excludes phone validation
export const validateFormSubmission = (formData: FormData) => {
  // IMPORTANT: No phone number validation - accepts any format
  // Phone numbers stored as raw strings to prevent blocking
  return { isValid: true, errors: [] };
};
```

### Supported Formats
- International: `+94712345678`, `+1-234-567-8900`
- Local: `071-234-5678`, `011 288 1000`
- Any format: `123`, `invalid phone`, `+`, empty strings

### Documentation
See `docs/PHONE_NUMBER_HANDLING.md` for complete implementation details.

---

## 🛡️ Security Considerations

### Data Protection
- Input validation and sanitization (except phone numbers)
- SQL injection prevention
- XSS protection
- CSRF protection

### File Upload Security
- File type validation
- Size limitations
- Virus scanning
- Secure storage

### API Security
- Rate limiting
- Authentication required
- Role-based permissions
- Audit logging

## 🔄 Maintenance

### Regular Tasks
- Database backups
- Security updates
- Performance monitoring
- User feedback review

### Update Process
1. Test in development
2. Deploy to staging
3. User acceptance testing
4. Production deployment
5. Monitor for issues

## 📚 API Documentation

### Authentication Endpoints
```typescript
// Login
POST /auth/login
Body: { email: string, password: string }

// Register
POST /auth/register
Body: { email: string, password: string, userData: object }
```

### Data Endpoints
```typescript
// Get user profile
GET /api/profiles/:id

// Update membership
PUT /api/memberships/:id
Body: { status: string, comments?: string }

// Create event
POST /api/events
Body: { title: string, description: string, eventDate: string }
```

## 🐛 Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version and dependencies
2. **Database Errors**: Verify Supabase configuration
3. **File Upload Issues**: Check storage bucket permissions
4. **Authentication Problems**: Verify environment variables

### Debug Tools
- Browser Developer Tools
- React Developer Tools
- Supabase Dashboard
- Network monitoring

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: I-Team Society Development Team
