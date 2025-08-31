# Event Banner Image Upload Feature

## Overview
The I-Team Society dashboard now supports banner image uploads for events. This feature allows staff and admin users to add attractive banner images to events, making them more visually appealing and engaging.

## Features

### ✅ Image Upload
- **File Types**: Supports JPEG, PNG, GIF, and WebP formats
- **File Size**: Maximum 5MB per image
- **Storage**: Images are stored in Supabase Storage bucket `event-images`
- **Validation**: Client-side validation for file type and size

### ✅ Image Preview
- Real-time preview of uploaded images
- Ability to remove/replace images before saving
- Responsive image display in event cards

### ✅ Event Display
- Banner images are displayed in event cards across all tabs
- Fallback handling if images fail to load
- Optimized image sizing (1200x600px recommended)

## Usage

### For Staff/Admin Users:
1. Click "Create Event" button
2. Fill in the event details
3. In the "Event Banner Image" section:
   - Click "Click to upload banner image" 
   - Select an image file (max 5MB)
   - Preview will appear immediately
   - Use the X button to remove if needed
4. Complete the form and click "Create Event"

### Image Guidelines:
- **Recommended Size**: 1200x600px (2:1 aspect ratio)
- **File Size**: Under 5MB for optimal performance
- **Format**: PNG or JPEG for best quality
- **Content**: Should be relevant to the event and professional

## Technical Implementation

### Database Changes
- Added `banner_image` column to `events` table
- Added `event_type`, `requirements`, and `contact_info` columns
- All new columns are optional (nullable)

### Storage Setup
- Created `event-images` bucket in Supabase Storage
- Configured RLS policies for secure access
- Public read access for displaying images
- Authenticated users can upload images

### Security Features
- File type validation (images only)
- File size limits (5MB maximum)
- Secure file naming with timestamps
- RLS policies for access control

## File Structure
```
src/pages/dashboard/Events.tsx - Main events component with upload UI
supabase/migrations/20241215000000_create_event_images_bucket.sql - Database migration
docs/EVENT_IMAGE_UPLOAD.md - This documentation
```

## Error Handling
- Invalid file type warnings
- File size limit notifications
- Upload failure messages
- Network error handling
- Graceful fallbacks for missing images

## Future Enhancements
- Image compression before upload
- Multiple image support
- Image cropping/editing tools
- Bulk image management
- Image optimization for different screen sizes

## Troubleshooting

### Common Issues:
1. **"Bucket not found" error**: Run the migration to create the storage bucket
2. **Upload fails**: Check file size (must be under 5MB)
3. **Image not displaying**: Verify the image URL and storage permissions
4. **Slow uploads**: Consider image compression or smaller file sizes

### Migration Required:
Before using this feature, run the migration:
```sql
-- Run this migration to set up the storage bucket and database columns
supabase/migrations/20241215000000_create_event_images_bucket.sql
```

## Support
For technical issues or questions about the image upload feature, contact the development team or check the application logs for detailed error messages.
