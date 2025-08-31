import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  preview?: boolean;
  className?: string;
  required?: boolean;
  currentFile?: string; // URL of current file
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = "image/*",
  maxSize = 5,
  onFileSelect,
  preview = true,
  className = "",
  required = false,
  currentFile
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFile || null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(currentFile || null);
      onFileSelect(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      setError("Invalid file type");
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Create preview URL for images
    if (preview && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(currentFile || null);
    setError("");
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="space-y-3">
        {/* File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          required={required}
        />

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="w-full h-auto p-4 border-dashed border-2 hover:border-iteam-primary"
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload</p>
              <p className="text-xs text-gray-500">
                {accept.includes("image") ? "PNG, JPG, GIF" : "PDF, DOC, DOCX"} up to {maxSize}MB
              </p>
            </div>
          </div>
        </Button>

        {/* Preview */}
        {previewUrl && preview && (
          <div className="relative">
            <div className="border rounded-lg p-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {previewUrl.startsWith("data:") || previewUrl.startsWith("blob:") || previewUrl.startsWith("http") ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <FileImage className="h-16 w-16 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {selectedFile?.name || "Current file"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* File Info */}
        {selectedFile && !preview && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
