import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCw, ZoomIn, Crop, Check, X } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [cropSize, setCropSize] = useState([0.8]); // Size as percentage of smallest dimension
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const updateCropFromSize = useCallback(() => {
    if (imageRef.current && imageRef.current.naturalWidth > 0 && imageRef.current.naturalHeight > 0) {
      const img = imageRef.current;
      // Calculate square crop size based on the smaller dimension
      const minDimension = Math.min(img.naturalWidth, img.naturalHeight);
      const size = minDimension * cropSize[0];

      setCrop({
        x: Math.max(0, (img.naturalWidth - size) / 2),
        y: Math.max(0, (img.naturalHeight - size) / 2),
        width: size,
        height: size // Always square for profile photos
      });
    }
  }, [cropSize]);

  const handleImageLoad = useCallback(() => {
    // Ensure image is fully loaded with valid dimensions
    if (imageRef.current && imageRef.current.naturalWidth > 0 && imageRef.current.naturalHeight > 0) {
      setImageLoaded(true);
      setImageError(false);
      updateCropFromSize();
    }
  }, [updateCropFromSize]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const handleCropSizeChange = (value: number[]) => {
    setCropSize(value);
    updateCropFromSize();
  };

  // Reset state when image source changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setZoom([1]);
    setRotation(0);
    setCropSize([0.8]);
  }, [imageSrc]);

  const getCroppedImage = async (): Promise<File> => {
    console.log('getCroppedImage: Starting...');

    if (!imageRef.current || !canvasRef.current) {
      console.error('getCroppedImage: Missing refs', {
        imageRef: !!imageRef.current,
        canvasRef: !!canvasRef.current
      });
      throw new Error('Image or canvas not available');
    }

    if (!imageRef.current.naturalWidth || !imageRef.current.naturalHeight) {
      console.error('getCroppedImage: Invalid image dimensions', {
        naturalWidth: imageRef.current.naturalWidth,
        naturalHeight: imageRef.current.naturalHeight
      });
      throw new Error('Image not properly loaded');
    }

    const image = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('getCroppedImage: Canvas context not available');
      throw new Error('Canvas context not available');
    }

    console.log('getCroppedImage: Image dimensions:', {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight
    });
    console.log('getCroppedImage: Crop settings:', {
      cropSize: cropSize[0],
      zoom: zoom[0],
      rotation: rotation
    });

    // Set canvas size for output (fixed square size for profile photos)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Calculate the center crop area based on the smaller dimension
    const img = image;
    const minDimension = Math.min(img.naturalWidth, img.naturalHeight);
    const actualCropSize = minDimension * cropSize[0];

    // Center the crop
    const sourceX = (img.naturalWidth - actualCropSize) / 2;
    const sourceY = (img.naturalHeight - actualCropSize) / 2;

    console.log('getCroppedImage: Crop calculations:', {
      minDimension,
      actualCropSize,
      sourceX,
      sourceY
    });

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom[0], zoom[0]);

    // Draw the cropped image
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      actualCropSize,
      actualCropSize,
      -outputSize / (2 * zoom[0]),
      -outputSize / (2 * zoom[0]),
      outputSize / zoom[0],
      outputSize / zoom[0]
    );

    // Restore context state
    ctx.restore();

    // Convert canvas to blob and create file
    console.log('getCroppedImage: Converting canvas to blob...');
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('getCroppedImage: Failed to create blob');
            reject(new Error('Failed to create image blob'));
            return;
          }

          console.log('getCroppedImage: Blob created successfully, size:', blob.size);

          const file = new File([blob], 'profile-photo.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          console.log('getCroppedImage: File created successfully:', {
            name: file.name,
            size: file.size,
            type: file.type
          });

          resolve(file);
        },
        'image/jpeg',
        0.85
      );
    });
  };

  const handleCropConfirm = async () => {
    try {
      console.log('Starting crop confirmation...');
      const croppedFile = await getCroppedImage();
      console.log('Crop completed successfully, file:', {
        name: croppedFile.name,
        size: croppedFile.size,
        type: croppedFile.type
      });
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      // Don't close the dialog on error, let user try again
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Profile Photo
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Adjust the square crop area to frame your profile photo perfectly
          </p>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Image Preview Area */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500">Loading image...</div>
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-500">Failed to load image</div>
              </div>
            )}
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-full max-h-full object-contain mx-auto"
                style={{
                  transform: `scale(${zoom[0]}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
              
              {/* Crop Overlay */}
              {imageLoaded && imageRef.current && imageRef.current.naturalWidth > 0 && imageRef.current.naturalHeight > 0 && (
                <div
                  className="absolute border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '200px',
                    height: '200px',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="w-full h-full border border-dashed border-white/50 relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>

                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-6 h-0.5 bg-white/50"></div>
                      <div className="w-0.5 h-6 bg-white/50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-4">
            {/* Zoom Control */}
            <div className="flex items-center space-x-4">
              <Label className="flex items-center gap-2 min-w-0">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </Label>
              <div className="flex-1 px-4">
                <Slider
                  value={zoom}
                  onValueChange={handleZoomChange}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-gray-500 min-w-0">
                {Math.round(zoom[0] * 100)}%
              </span>
            </div>

            {/* Crop Size Control */}
            <div className="flex items-center space-x-4">
              <Label className="flex items-center gap-2 min-w-0">
                <Crop className="h-4 w-4" />
                Size
              </Label>
              <div className="flex-1 px-4">
                <Slider
                  value={cropSize}
                  onValueChange={handleCropSizeChange}
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-gray-500 min-w-0">
                {Math.round(cropSize[0] * 100)}%
              </span>
            </div>

            {/* Rotation Control */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRotate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Rotate 90°
              </Button>
              <span className="text-sm text-gray-500">
                Current: {rotation}°
              </span>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCropConfirm}
            disabled={!imageLoaded || imageError}
            className="bg-iteam-primary hover:bg-iteam-primary/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
