# 🚨 TROUBLESHOOTING 500 ERROR: Database error saving new user

## Current Status

- Error: `500 Internal Server Error` on `/auth/v1/signup`
- Message: "Database error saving new user"
- Issue: Supabase Auth cannot write to database during user creation

## CRITICAL QUESTION: Have you run the SQL fixes?

### ❌ If you HAVEN'T run the SQL scripts yet:

**You MUST run one of these SQL scripts in Supabase Dashboard:**

1. `EMERGENCY_DATABASE_FIX.sql` (comprehensive fix)
2. `MINIMAL_EMERGENCY_FIX.sql` (quick fix)

**How to run:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Copy/paste the SQL script content
5. Click "Run" button

### ✅ If you HAVE run the SQL scripts:

Let's diagnose deeper issues...

## Diagnostic Steps

### Step 1: Check Supabase Dashboard Logs

1. Go to Supabase Dashboard → **Logs**
2. Look for recent errors around the time you tried to register
3. Copy any error messages you see

### Step 2: Check Authentication Settings

1. Go to **Authentication** → **Settings**
2. Verify these settings:
   - ✅ "Enable email confirmations" should be **DISABLED** for dev
   - ✅ "Site URL" should be `http://localhost:5173`
   - ✅ "Redirect URLs" should include `http://localhost:5173/**`

### Step 3: Check Database Tables

Run this in SQL Editor to verify tables exist:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'student_details', 'staff_details', 'memberships');

-- Check if RLS is properly configured
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('profiles', 'student_details', 'staff_details', 'memberships');
```

### Step 4: Test Basic Database Access

Run this in SQL Editor:

```sql
-- Test if we can insert into profiles manually
INSERT INTO profiles (id, first_name, last_name, role)
VALUES ('test-id-123', 'Test', 'User', 'student');

-- Check if it worked
SELECT * FROM profiles WHERE id = 'test-id-123';

-- Clean up
DELETE FROM profiles WHERE id = 'test-id-123';
```

## Alternative Approaches

### Option A: Completely Reset Database

If nothing else works, run this NUCLEAR option:

```sql
-- WARNING: This removes ALL security temporarily
DROP POLICY IF EXISTS "allow_all" ON profiles;
DROP POLICY IF EXISTS "allow_all" ON student_details;
DROP POLICY IF EXISTS "allow_all" ON staff_details;
DROP POLICY IF EXISTS "allow_all" ON memberships;

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;

-- Grant everything to everyone (TEMPORARY)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

SELECT 'NUCLEAR OPTION APPLIED - Registration should work now' as status;
```

### Option B: Check Environment Variables

Verify your `.env.local` file has correct values:

```env
VITE_SUPABASE_URL=https://xywggqgljyoicqqhrlst.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Option C: Restart Development Server

Sometimes environment changes need a restart:

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

## What to Check Next

1. **Supabase Dashboard Logs** - Most important
2. **Browser Network Tab** - Check the exact 500 error response
3. **SQL Script Results** - Did they run without errors?
4. **Database Table Structure** - Are tables created properly?

## Expected Solution Path

If you haven't run the SQL scripts → Run them now
If you have run them → Check logs for specific error details
If logs show specific errors → Apply targeted fixes
If nothing works → Use nuclear option (Option A above)

## Report Back With:

1. ✅/❌ Have you run the SQL scripts?
2. What do the Supabase Dashboard logs show?
3. What does the browser Network tab show for the 500 error?
4. Results of the diagnostic SQL queries above
