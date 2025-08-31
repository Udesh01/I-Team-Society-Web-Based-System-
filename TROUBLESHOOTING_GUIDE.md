# 🚨 Dashboard Error Troubleshooting Guide

This guide addresses the specific errors you're encountering in your I-Team Society Dashboard and provides step-by-step solutions.

## 📋 Current Error Summary

Based on your console logs, you're experiencing:

1. **Profile Photo Upload Errors (400/403)**
   - `StorageService: Upload error: Object`
   - `Permission denied. Please ensure you are logged in and have proper permissions`

2. **Event List Loading Errors (400)**
   - `Failed to load resource: the server responded with a status of 400`
   - `Error fetching events: Object`

3. **Membership Approval Conflicts (409)**
   - Multiple repeated `Error approving membership` with 409 status codes
   - Indicates duplicate operations or constraint violations

## 🔧 Immediate Fixes

### Step 1: Fix Database Issues (CRITICAL)

**Run the Emergency SQL Script** in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `database/emergency-fix.sql`
4. Click "Run" to execute

This script will:
- ✅ Create missing storage buckets
- ✅ Fix RLS (Row Level Security) policies
- ✅ Prevent duplicate membership operations
- ✅ Add missing database columns
- ✅ Create proper indexes for performance

### Step 2: Verify Your Environment Variables

Check your `.env.local` file contains:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**To find these values:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the "Project URL" and "anon public key"

### Step 3: Test Authentication

1. Try logging out and logging back in
2. Check if you can access your profile page
3. Verify your user role is set correctly in the database

## 🔍 Detailed Error Analysis & Solutions

### Error 1: Profile Photo Upload (StorageService Error)

**Root Cause:** Missing storage bucket or incorrect RLS policies

**Solution Applied:**
- Created `profile_photos` bucket with proper permissions
- Fixed storage policies to allow authenticated users to upload
- Simplified permission checks to avoid complex folder-based restrictions

**Test Fix:**
1. Go to Profile page
2. Click "Edit Profile"
3. Try uploading a new profile photo
4. Should now work without permission errors

### Error 2: Event List 400 Error

**Root Cause:** Complex query with missing relationships or malformed SQL

**Solution Applied:**
- Simplified event query structure
- Fixed relationship between `events` and `event_registrations`
- Changed from `count` aggregation to array length counting
- Added proper RLS policies for events table

**Test Fix:**
1. Go to Events page
2. Events should now load without 400 errors
3. Registration counts should display correctly

### Error 3: Membership Approval 409 Conflicts

**Root Cause:** Multiple simultaneous approval attempts creating duplicates

**Solution Applied:**
- Added duplicate prevention checks
- Created unique constraints to prevent multiple active memberships
- Added status validation before operations
- Cleaned up existing duplicate records

**Test Fix:**
1. Go to Admin → Membership Management
2. Try approving a membership
3. Should only allow one approval per membership
4. No more 409 conflict errors

## 🧪 Testing Your Fixes

### Test Sequence:

1. **Authentication Test:**
   ```
   ✅ Can log in successfully
   ✅ Profile page loads without errors
   ✅ User role displays correctly
   ```

2. **Storage Test:**
   ```
   ✅ Can upload profile photo
   ✅ Photo appears in profile immediately
   ✅ No 400/403 storage errors
   ```

3. **Events Test:**
   ```
   ✅ Events page loads successfully
   ✅ Can see event list with registration counts
   ✅ Can register/unregister for events
   ```

4. **Admin Functions Test:**
   ```
   ✅ Membership approval works once per membership
   ✅ No duplicate approvals possible
   ✅ E-ID generation works correctly
   ```

## 🔧 Frontend Code Improvements

The following files have been updated to handle errors better:

### EventList.tsx Changes:
- Fixed query structure to prevent 400 errors
- Improved relationship handling
- Better error handling and user feedback

### MembershipApproval.tsx Changes:
- Added duplicate operation prevention
- Better status checking before operations
- Improved error messages

### Profile.tsx Improvements:
- Enhanced photo upload error handling
- Better storage service integration
- Added debug tools for troubleshooting

## 🚨 If Errors Persist

### Check These Common Issues:

1. **RLS Policies Not Applied:**
   ```sql
   -- Run this in Supabase SQL Editor to check
   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
   ```

2. **Missing Tables/Columns:**
   ```sql
   -- Check table structure
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

3. **Storage Bucket Missing:**
   ```sql
   -- Check storage buckets
   SELECT id, name, public FROM storage.buckets;
   ```

### Debug Steps:

1. **Open Browser Developer Tools (F12)**
2. **Check Console tab for JavaScript errors**
3. **Check Network tab for failed requests**
4. **Look for specific error codes:**
   - 400: Bad request (usually query/permission issues)
   - 403: Forbidden (RLS policy blocks access)
   - 409: Conflict (duplicate operations)

## 📞 Getting Help

If issues persist after following this guide:

1. **Check the verification queries** at the end of `emergency-fix.sql`
2. **Share the output** of those queries
3. **Include specific error messages** from browser console
4. **Mention which step failed** in the testing sequence

## 📈 Performance Improvements

The emergency fix also includes:
- Database indexes for faster queries
- Optimized RLS policies
- Better query structures
- Reduced redundant operations

Your dashboard should now be **significantly faster** and more reliable.

---

**✅ After running these fixes, your dashboard should work without the errors you were experiencing!**
