# CRITICAL: Database Error Resolution Guide

## Current Error Analysis

- **Error**: `POST https://xywggqgljyoicqqhrlst.supabase.co/auth/v1/signup 500 (Internal Server Error)`
- **Root Cause**: Database-level issues preventing user creation during signup
- **Impact**: Staff registration completely blocked

## IMMEDIATE ACTION REQUIRED

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Login to your account
3. Select your project: `xywggqgljyoicqqhrlst`

### Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** button

### Step 3: Run Emergency Fix

1. **COPY** the entire content from `EMERGENCY_DATABASE_FIX.sql`
2. **PASTE** it into the SQL Editor
3. **CLICK** the "Run" button (or press Ctrl/Cmd + Enter)

### Step 4: Wait for Completion

- You should see multiple status messages like:
  - "EMERGENCY DATABASE FIX STARTING..."
  - "DROPPING ALL EXISTING POLICIES..."
  - "GRANTING NECESSARY PERMISSIONS..."
  - "🎉 EMERGENCY DATABASE FIX COMPLETED!"

### Step 5: Verify Success

- Look for the final message: "Try registering a new user now - it should work!"
- If you see any ERROR messages, copy them and share them

## Alternative Quick Fix (If SQL Editor Doesn't Work)

### Option A: Disable RLS Temporarily

Run this minimal script in SQL Editor:

```sql
-- Temporarily disable RLS to allow registration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;

SELECT 'Quick fix applied - try registration now' as status;
```

### Option B: Check Authentication Settings

1. Go to **Authentication** → **Settings** in Supabase Dashboard
2. Ensure "Enable email confirmations" is **DISABLED** for development
3. Check that "Site URL" is set to `http://localhost:5173`

## After Running the Fix

### Test Registration

1. Go back to your app: http://localhost:5173
2. Navigate to staff registration
3. Fill out the form and submit
4. Registration should work without the 500 error

### If Still Having Issues

- Check the browser Network tab for the exact error response
- Look at the Supabase Dashboard → Logs for detailed error messages
- Share any new error messages you see

## Why This Fix Works

The emergency fix addresses the core issues that cause "Database error saving new user":

1. **Removes conflicting RLS policies** that block database writes
2. **Grants proper permissions** to authenticated and anonymous users
3. **Recreates user creation triggers** that may be broken
4. **Uses simple ownership-based policies** to avoid recursion

## Success Indicators

✅ Staff registration form submits without 500 error
✅ User appears in Supabase Auth → Users
✅ Profile data is created in profiles table
✅ Staff details are saved correctly
✅ Login works after registration
