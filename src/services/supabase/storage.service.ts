import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export const StorageService = {
  // Upload profile photo
  uploadProfilePhoto: async (userId: string, file: File): Promise<string> => {
    try {
      console.log('StorageService: Starting upload for user:', userId);
      console.log('StorageService: File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('StorageService: Auth check:', {
        user: user?.id || 'NOT_AUTHENTICATED',
        error: authError?.message || 'none'
      });

      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      if (user.id !== userId) {
        console.log('StorageService: User ID mismatch:', { expected: userId, actual: user.id });
        throw new Error('User ID mismatch. Please refresh and try again.');
      }

      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file provided');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size too large (max 10MB)');
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/profile.${fileExt}`;

      console.log('StorageService: Uploading to bucket profile_photos with filename:', fileName);

      const { data, error } = await supabase.storage
        .from('profile_photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Replace existing file
        });

      if (error) {
        console.error('StorageService: Upload error:', error);

        // Provide more specific error messages
        if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. Please ensure you are logged in and have proper permissions.');
        } else if (error.message.includes('bucket')) {
          throw new Error('Storage bucket not found. Please contact administrator to set up storage.');
        } else if (error.message.includes('not found')) {
          throw new Error('Storage bucket not found. Please contact administrator.');
        } else {
          throw new Error(`Storage upload failed: ${error.message}`);
        }
      }

      console.log('StorageService: Upload successful, data:', data);

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('profile_photos')
        .getPublicUrl(fileName);

      console.log('StorageService: Public URL generated:', publicUrl.publicUrl);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('StorageService: Error uploading profile photo:', error);
      throw error;
    }
  },

  // Upload payment slip
  uploadPaymentSlip: async (userId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment_slips')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('payment_slips')
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading payment slip:', error);
      throw error;
    }
  },

  // Upload event poster
  uploadEventPoster: async (eventId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `events/${eventId}/poster.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('event_posters')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('event_posters')
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading event poster:', error);
      throw error;
    }
  },

  // Delete file from storage
  deleteFile: async (bucket: string, filePath: string): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Get file URL
  getFileUrl: (bucket: string, filePath: string): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Create storage buckets (for admin setup)
  createBuckets: async () => {
    try {
      const buckets = [
        { name: 'profile_photos', public: true },
        { name: 'payment_slips', public: false },
        { name: 'event_posters', public: true }
      ];

      for (const bucket of buckets) {
        const { error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes: bucket.name === 'payment_slips' 
            ? ['image/jpeg', 'image/png', 'application/pdf']
            : ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });

        if (error && !error.message.includes('already exists')) {
          console.error(`Error creating bucket ${bucket.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error creating storage buckets:', error);
      throw error;
    }
  }
};
