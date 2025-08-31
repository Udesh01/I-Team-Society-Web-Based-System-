/**
 * Image utility functions for compression, resizing, and processing
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

/**
 * Compress an image file with various options
 */
export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg',
    maxSizeKB = 500
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        maxWidth,
        maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with specified quality
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          let finalBlob = blob;
          let currentQuality = quality;

          // If file is still too large, reduce quality further
          while (finalBlob.size > maxSizeKB * 1024 && currentQuality > 0.1) {
            currentQuality -= 0.1;
            finalBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(
                (blob) => resolve(blob!),
                `image/${format}`,
                currentQuality
              );
            });
          }

          // Create new file with compressed data
          const compressedFile = new File([finalBlob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now()
          });

          resolve(compressedFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if necessary
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Create a thumbnail from an image file
 */
export const createThumbnail = async (
  file: File,
  size: number = 150
): Promise<File> => {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.9,
    format: 'jpeg',
    maxSizeKB: 50
  });
};

/**
 * Get image dimensions from a file
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file type
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validate image file size
 */
export const isValidImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Create a data URL from a file for preview
 */
export const createPreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress profile photo specifically for profile use - ensures square output
 */
export const compressProfilePhoto = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Force square dimensions for profile photos
      const size = 400; // Fixed 400x400 for profile photos
      canvas.width = size;
      canvas.height = size;

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Calculate dimensions to fit image in square while maintaining aspect ratio
      const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;

      // Center the image in the square
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      // Draw the image centered in the square
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Convert to blob with compression
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          let finalBlob = blob;
          let currentQuality = 0.85;
          const maxSizeKB = 200;

          // Reduce quality if file is too large
          while (finalBlob.size > maxSizeKB * 1024 && currentQuality > 0.1) {
            currentQuality -= 0.1;
            finalBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(
                (blob) => resolve(blob!),
                'image/jpeg',
                currentQuality
              );
            });
          }

          // Create new file with compressed data
          const compressedFile = new File([finalBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};
