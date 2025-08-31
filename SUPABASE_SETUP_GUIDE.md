# Complete Supabase Setup Guide for I-Team Society Management System

## 🚀 Step 1: Create Supabase Project

### 1.1 Sign Up/Login to Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 1.2 Create New Project

1. Click "New Project" in your dashboard
2. Choose your organization (or create one)
3. Fill in project details:
   - **Project Name**: `iteam-society-hub`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with Free tier
4. Click "Create new project"
5. Wait 2-3 minutes for project setup

## 🗄️ Step 2: Database Setup

### 2.1 Access SQL Editor

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the following SQL schema:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  phone_number TEXT,
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_details table
CREATE TABLE student_details (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  degree TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4)
);

-- Create staff_details table
CREATE TABLE staff_details (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  staff_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL
);

-- Create memberships table
CREATE TABLE memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  eid TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending_payment', 'pending_approval', 'active', 'expired')) DEFAULT 'pending_payment',
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
  amount DECIMAL(10,2) NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  bank_slip_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  payment_date DATE NOT NULL,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER,
  poster_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'cancelled', 'completed')) DEFAULT 'active',
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_registrations table
CREATE TABLE event_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  attended BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate E-ID
CREATE OR REPLACE FUNCTION generate_eid(user_role TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  role_part TEXT;
  sequence_num INTEGER;
  eid_result TEXT;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Set role part
  CASE user_role
    WHEN 'student' THEN role_part := 'STU';
    WHEN 'staff' THEN role_part := 'STA';
    WHEN 'admin' THEN role_part := 'ADM';
    ELSE role_part := 'MEM';
  END CASE;

  -- Get next sequence number for this year and role
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(eid FROM LENGTH(eid) - 3) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM memberships
  WHERE eid LIKE 'ITS/' || year_part || '/' || role_part || '/%';

  -- Format the E-ID
  eid_result := 'ITS/' || year_part || '/' || role_part || '/' || LPAD(sequence_num::TEXT, 4, '0');

  RETURN eid_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate E-ID when membership is approved
CREATE OR REPLACE FUNCTION auto_generate_eid()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Only generate E-ID when status changes to 'active' and E-ID is not already set
  IF NEW.status = 'active' AND (OLD.status != 'active' OR OLD.eid IS NULL) AND NEW.eid IS NULL THEN
    -- Get user role
    SELECT role INTO user_role FROM profiles WHERE id = NEW.user_id;

    -- Generate and set E-ID
    NEW.eid := generate_eid(user_role, NEW.user_id);

    -- Set start and end dates if not already set
    IF NEW.start_date IS NULL THEN
      NEW.start_date := CURRENT_DATE;
    END IF;

    IF NEW.end_date IS NULL THEN
      NEW.end_date := CURRENT_DATE + INTERVAL '1 year';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for E-ID generation
CREATE TRIGGER trigger_auto_generate_eid
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION auto_generate_eid();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" to execute the schema
5. Verify all tables are created in the "Table Editor"

### 2.2 Set Up Row Level Security (RLS)

1. Go to "Authentication" → "Policies"
2. Create the following policies by running this SQL:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Student details policies
CREATE POLICY "Users can view own student details" ON student_details FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own student details" ON student_details FOR INSERT WITH CHECK (auth.uid() = id);

-- Staff details policies
CREATE POLICY "Users can view own staff details" ON staff_details FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own staff details" ON staff_details FOR INSERT WITH CHECK (auth.uid() = id);

-- Memberships policies
CREATE POLICY "Users can view own membership" ON memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own membership" ON memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all memberships" ON memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Events policies
CREATE POLICY "Everyone can view active events" ON events FOR SELECT USING (status = 'active');
CREATE POLICY "Staff can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
CREATE POLICY "Creators can update own events" ON events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Event registrations policies
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Event creators can view registrations" ON event_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
```

## 🗂️ Step 3: Storage Setup

### 3.1 Create Storage Buckets

1. Go to "Storage" in your Supabase dashboard
2. Click "Create bucket"
3. Create these buckets:

**Bucket 1: profile-photos**

- Name: `profile-photos`
- Public: ✅ (checked)
- File size limit: 2MB
- Allowed MIME types: `image/*`

**Bucket 2: payment-slips**

- Name: `payment-slips`
- Public: ❌ (unchecked)
- File size limit: 5MB
- Allowed MIME types: `image/*, application/pdf`

**Bucket 3: event-posters**

- Name: `event-posters`
- Public: ✅ (checked)
- File size limit: 5MB
- Allowed MIME types: `image/*`

### 3.2 Set Storage Policies

Run this SQL to set up storage policies:

```sql
-- Profile photos policies (public read, authenticated upload)
CREATE POLICY "Public can view profile photos" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update own profile photos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Payment slips policies (admin read, user upload)
CREATE POLICY "Admins can view payment slips" ON storage.objects FOR SELECT USING (
  bucket_id = 'payment-slips' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can upload own payment slips" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'payment-slips' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Event posters policies (public read, staff/admin upload)
CREATE POLICY "Public can view event posters" ON storage.objects FOR SELECT USING (bucket_id = 'event-posters');
CREATE POLICY "Staff can upload event posters" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'event-posters' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);
```

## 🔑 Step 4: Get API Keys

### 4.1 Find Your Project Credentials

1. Go to "Settings" → "API"
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon (public) key**: `eyJ...` (long string)
   - **Service role key**: `eyJ...` (keep this secret!)

### 4.2 Update Environment Variables

1. In your project root, create/update `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the placeholder values with your actual credentials

## 🔐 Step 5: Authentication Setup

### 5.1 Configure Auth Settings

1. Go to "Authentication" → "Settings"
2. Configure these settings:
   - **Site URL**: `http://localhost:8080` (for development)
   - **Redirect URLs**: Add your production domain later
   - **Email confirmation**: ✅ Enabled
   - **Email change confirmation**: ✅ Enabled

### 5.2 Email Templates (Optional)

1. Go to "Authentication" → "Email Templates"
2. Customize the email templates if needed
3. For development, you can use the default templates

## 🧪 Step 6: Test the Setup

### 6.1 Test Database Connection

1. Start your development server: `npm run dev`
2. Try to register a new user
3. Check if the profile is created in the database

### 6.2 Test File Upload

1. Try uploading a profile photo during registration
2. Check if the file appears in the storage bucket

### 6.3 Test Authentication

1. Register a new user
2. Check your email for verification
3. Try logging in after verification

## 🚀 Step 7: Production Deployment

### 7.1 Update Environment Variables

When deploying to production:

1. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Add your production domain to "Site URL" and "Redirect URLs"

### 7.2 Database Backup

1. Go to "Settings" → "Database"
2. Set up automated backups
3. Download a manual backup before going live

## 🔧 Troubleshooting

### Common Issues:

**1. RLS Policies Not Working**

- Check if RLS is enabled on all tables
- Verify policy conditions match your use case
- Test policies in SQL editor

**2. File Upload Fails**

- Check storage bucket permissions
- Verify file size and type restrictions
- Ensure bucket policies are correct

**3. Authentication Issues**

- Verify environment variables are correct
- Check email confirmation settings
- Ensure Site URL matches your domain

**4. Database Connection Errors**

- Verify project URL and API keys
- Check if database is accessible
- Review network/firewall settings

## 📞 Support

If you encounter issues:

1. Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
2. Visit Supabase community: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
3. Contact Supabase support through their dashboard

---

**Your I-Team Society Management System is now ready to use with Supabase! 🎉**
