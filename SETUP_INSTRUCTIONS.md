# 🚀 Event Banner Image Setup Instructions

## Quick Setup (5 minutes)

### **Step 1: Access Supabase Dashboard**
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your I-Team Society project

### **Step 2: Run the Setup Script**
1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `setup_event_images.sql` from your project root
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** button

### **Step 3: Verify Setup**
After running the script, you should see:
- ✅ "Setup completed successfully!" message
- ✅ Storage bucket details showing `event-images` bucket
- ✅ New columns listed: `banner_image`, `event_type`, `requirements`, `contact_info`

### **Step 4: Test the Feature**
1. Start your development server: `npm run dev`
2. Login as staff or admin user
3. Go to Events page
4. Click "Create Event"
5. You should now see the "Event Banner Image" upload section

---

## Alternative Setup Methods

### **Method 1: Manual Storage Setup**
If the script fails, you can set up storage manually:

1. **Create Storage Bucket:**
   - Go to **Storage** in Supabase dashboard
   - Click **"New Bucket"**
   - Name: `event-images`
   - Make it **Public**
   - Set file size limit: **5MB**

2. **Set Bucket Policies:**
   - Click on the `event-images` bucket
   - Go to **Policies** tab
   - Add these policies:
     ```sql
     -- Allow public viewing
     CREATE POLICY "Public can view event images" ON storage.objects
     FOR SELECT USING (bucket_id = 'event-images');
     
     -- Allow authenticated uploads
     CREATE POLICY "Authenticated users can upload event images" ON storage.objects
     FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
     ```

### **Method 2: Manual Database Setup**
If you need to add columns manually:

1. Go to **Table Editor** in Supabase dashboard
2. Select the **events** table
3. Add these columns:
   - `banner_image` (text, nullable)
   - `event_type` (text, nullable)
   - `requirements` (text, nullable)
   - `contact_info` (text, nullable)

---

## Troubleshooting

### **Common Issues:**

#### **"Bucket already exists" error:**
- This is normal if you've run the script before
- The script uses `ON CONFLICT DO NOTHING` to handle this

#### **"Policy already exists" error:**
- Drop existing policies first:
  ```sql
  DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
  ```
- Then re-run the policy creation commands

#### **"Column already exists" error:**
- This is normal - the script checks for existing columns
- No action needed

#### **Upload fails in the app:**
- Check that the `event-images` bucket exists in Storage
- Verify bucket is set to **Public**
- Check RLS policies are applied correctly

### **Verification Commands:**
Run these in SQL Editor to verify setup:

```sql
-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'event-images';

-- Check table columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'events' AND column_name IN ('banner_image', 'event_type', 'requirements', 'contact_info');

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%event images%';
```

---

## What This Setup Enables

After successful setup, your I-Team Society dashboard will have:

✅ **Event Banner Upload**: Staff/admin can upload banner images for events
✅ **Image Storage**: Secure storage in Supabase with 5MB limit
✅ **Visual Events**: Events display with attractive banner images
✅ **Enhanced Forms**: Additional fields for event type, requirements, and contact info
✅ **Mobile Responsive**: Images work perfectly on all devices

---

## Need Help?

If you encounter any issues:
1. Check the Supabase dashboard logs
2. Verify your project permissions
3. Ensure you're running the script as a project owner/admin
4. Contact support with the specific error message

The feature is ready to use immediately after successful setup!
