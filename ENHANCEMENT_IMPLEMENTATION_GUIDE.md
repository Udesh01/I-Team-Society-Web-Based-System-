# 🚀 Enhancement Implementation Guide - Phase 1 Priority Features

## 1. 🔐 Password Reset System

### Implementation Steps:

#### Step 1: Create Password Reset Page
```typescript
// src/pages/auth/ResetPassword.tsx
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirm`
      });

      if (error) throw error;
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleResetPassword} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
};
```

#### Step 2: Add Reset Password Confirmation
```typescript
// src/pages/auth/ResetPasswordConfirm.tsx
const ResetPasswordConfirm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      navigate('/login');
    }
  };
  
  // ... rest of component
};
```

---

## 2. 💳 Online Payment Gateway Integration

### Implementation with Stripe:

#### Step 1: Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### Step 2: Create Payment Service
```typescript
// src/services/payment/stripe.service.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

export const StripeService = {
  createPaymentIntent: async (amount: number, membershipTier: string) => {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents
        currency: 'lkr',
        metadata: { membershipTier }
      }),
    });

    return response.json();
  },

  processPayment: async (paymentMethodId: string, paymentIntentId: string) => {
    const stripe = await stripePromise;
    
    const { error, paymentIntent } = await stripe!.confirmCardPayment(
      paymentIntentId,
      {
        payment_method: paymentMethodId
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  }
};
```

#### Step 3: Create Payment Component
```typescript
// src/components/payment/StripePayment.tsx
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = ({ amount, membershipTier, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    
    try {
      // Create payment intent
      const { client_secret } = await StripeService.createPaymentIntent(
        amount, 
        membershipTier
      );

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement!,
          }
        }
      );

      if (error) {
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Update membership status
        await updateMembershipAfterPayment(paymentIntent.id);
        onSuccess();
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay LKR ${amount}`}
      </Button>
    </form>
  );
};
```

---

## 3. ⭐ Event Feedback System

### Implementation Steps:

#### Step 1: Create Feedback Database Schema
```sql
-- Add to Supabase SQL Editor
CREATE TABLE event_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create feedback for events they attended" ON event_feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_registrations 
      WHERE event_id = event_feedback.event_id 
      AND user_id = auth.uid() 
      AND attended = true
    )
  );
```

#### Step 2: Create Feedback Component
```typescript
// src/components/events/EventFeedback.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface EventFeedbackProps {
  eventId: string;
  onSubmit: () => void;
}

const EventFeedback: React.FC<EventFeedbackProps> = ({ eventId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('event_feedback')
        .insert({
          event_id: eventId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          rating,
          feedback_text: feedback,
          anonymous
        });

      if (error) throw error;

      toast.success('Feedback submitted successfully!');
      onSubmit();
    } catch (error: any) {
      toast.error('Failed to submit feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 cursor-pointer ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      {/* Feedback Text */}
      <div>
        <label className="block text-sm font-medium mb-2">Feedback</label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts about this event..."
          rows={4}
        />
      </div>

      {/* Anonymous Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="anonymous" className="text-sm">
          Submit anonymously
        </label>
      </div>

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
};
```

---

## 4. 📧 Email Notification System

### Implementation with Resend:

#### Step 1: Install Dependencies
```bash
npm install resend
```

#### Step 2: Create Email Service
```typescript
// src/services/email/email.service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const EmailService = {
  sendWelcomeEmail: async (to: string, name: string) => {
    await resend.emails.send({
      from: 'I-Team Society <noreply@iteam.ousl.lk>',
      to,
      subject: 'Welcome to I-Team Society!',
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Thank you for joining I-Team Society. Your membership is now active.</p>
        <p>You can access your dashboard at: <a href="${window.location.origin}/dashboard">Dashboard</a></p>
      `
    });
  },

  sendEventReminder: async (to: string, eventTitle: string, eventDate: string) => {
    await resend.emails.send({
      from: 'I-Team Society <events@iteam.ousl.lk>',
      to,
      subject: `Reminder: ${eventTitle} is tomorrow!`,
      html: `
        <h2>Event Reminder</h2>
        <p>Don't forget about the upcoming event:</p>
        <h3>${eventTitle}</h3>
        <p>Date: ${new Date(eventDate).toLocaleDateString()}</p>
        <p>We look forward to seeing you there!</p>
      `
    });
  },

  sendMembershipExpiry: async (to: string, name: string, expiryDate: string) => {
    await resend.emails.send({
      from: 'I-Team Society <membership@iteam.ousl.lk>',
      to,
      subject: 'Membership Expiring Soon',
      html: `
        <h2>Membership Renewal Reminder</h2>
        <p>Hi ${name},</p>
        <p>Your I-Team Society membership will expire on ${new Date(expiryDate).toLocaleDateString()}.</p>
        <p>Renew now to continue enjoying all benefits: <a href="${window.location.origin}/dashboard/membership">Renew Membership</a></p>
      `
    });
  }
};
```

#### Step 3: Create Email Notification Hook
```typescript
// src/hooks/useEmailNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmailService } from '@/services/email/email.service';

export const useEmailNotifications = () => {
  useEffect(() => {
    // Listen for membership approvals
    const membershipChannel = supabase
      .channel('membership-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'memberships',
          filter: 'status=eq.active'
        },
        async (payload) => {
          const membership = payload.new;
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name')
            .eq('id', membership.user_id)
            .single();

          if (profile) {
            await EmailService.sendWelcomeEmail(
              profile.email,
              profile.first_name
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membershipChannel);
    };
  }, []);
};
```

---

## 5. 📱 QR-Based Attendance System

### Implementation Steps:

#### Step 1: Install QR Scanner
```bash
npm install react-qr-scanner
```

#### Step 2: Create QR Scanner Component
```typescript
// src/components/events/QRAttendanceScanner.tsx
import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface QRAttendanceScannerProps {
  eventId: string;
}

const QRAttendanceScanner: React.FC<QRAttendanceScannerProps> = ({ eventId }) => {
  const [scanning, setScanning] = useState(false);

  const handleScan = async (data: string | null) => {
    if (!data) return;

    try {
      // Extract E-ID from QR code data
      const url = new URL(data);
      const eid = url.pathname.split('/').pop();

      if (!eid) {
        toast.error('Invalid QR code');
        return;
      }

      // Find user by E-ID
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('user_id, profiles(first_name, last_name)')
        .eq('eid', eid)
        .eq('status', 'active')
        .single();

      if (membershipError || !membership) {
        toast.error('Invalid or inactive membership');
        return;
      }

      // Mark attendance
      const { error: attendanceError } = await supabase
        .from('event_registrations')
        .update({ attended: true, attendance_marked_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', membership.user_id);

      if (attendanceError) {
        toast.error('Failed to mark attendance');
        return;
      }

      toast.success(
        `Attendance marked for ${membership.profiles.first_name} ${membership.profiles.last_name}`
      );
    } catch (error) {
      toast.error('Error processing QR code');
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner error:', err);
    toast.error('Camera access error');
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setScanning(!scanning)}
        className={scanning ? 'bg-red-500' : 'bg-green-500'}
      >
        {scanning ? 'Stop Scanning' : 'Start QR Attendance'}
      </Button>

      {scanning && (
        <div className="w-full max-w-sm mx-auto">
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 Implementation Timeline

### Week 1-2: Password Reset System
- [ ] Create reset password pages
- [ ] Add email templates
- [ ] Test password reset flow
- [ ] Update navigation links

### Week 3-4: Online Payment Gateway
- [ ] Set up Stripe account
- [ ] Implement payment components
- [ ] Create webhook handlers
- [ ] Test payment flow

### Week 5-6: Event Feedback System
- [ ] Create database schema
- [ ] Build feedback components
- [ ] Add feedback analytics
- [ ] Test feedback submission

### Week 7-8: Email Notifications
- [ ] Set up email service
- [ ] Create email templates
- [ ] Implement notification triggers
- [ ] Test email delivery

### Week 9-10: QR Attendance System
- [ ] Build QR scanner component
- [ ] Update attendance tracking
- [ ] Test QR code scanning
- [ ] Add attendance reports

---

## 🧪 Testing Checklist

### Password Reset:
- [ ] Email delivery works
- [ ] Reset link expires correctly
- [ ] Password validation works
- [ ] User can login with new password

### Payment Gateway:
- [ ] Payment processing works
- [ ] Membership activation after payment
- [ ] Error handling for failed payments
- [ ] Receipt generation

### Event Feedback:
- [ ] Rating submission works
- [ ] Anonymous feedback option
- [ ] Feedback display for organizers
- [ ] Duplicate submission prevention

### Email Notifications:
- [ ] Welcome emails sent
- [ ] Event reminders work
- [ ] Membership expiry alerts
- [ ] Email unsubscribe option

### QR Attendance:
- [ ] QR code scanning accuracy
- [ ] Attendance marking works
- [ ] Invalid QR code handling
- [ ] Real-time attendance updates

---

## 📋 Deployment Considerations

1. **Environment Variables:**
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   RESEND_API_KEY=re_...
   ```

2. **Database Migrations:**
   - Run SQL scripts in Supabase
   - Update RLS policies
   - Test permissions

3. **Third-party Services:**
   - Configure Stripe webhooks
   - Set up email domain verification
   - Test API rate limits

4. **Performance Monitoring:**
   - Monitor payment success rates
   - Track email delivery rates
   - Monitor QR scanning performance
