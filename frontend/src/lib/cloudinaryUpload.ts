/**
 * Utility functions for Cloudinary image uploads
 */

export interface CloudinaryUploadResult {
  event?: string;
  info?: {
    public_id: string;
    secure_url: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    [key: string]: any;
  };
}

/**
 * Upload image to Cloudinary directly
 */
export const uploadToCloudinary = async (file: File, token: string): Promise<string> => {
  try {
    // Get upload signature from backend
    const signatureRes = await fetch('/api/products/signature/upload', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!signatureRes.ok) {
      const errorText = await signatureRes.text();
      throw new Error(`Failed to get upload signature (Status: ${signatureRes.status}). Response: ${errorText}`);
    }

    const signatureData = await signatureRes.json();
    const { signature, timestamp, cloudName, apiKey } = signatureData;

    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'ecommerce/products');

    // Upload to Cloudinary
    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const uploadData = await uploadRes.json();

    // Return secure URL
    return uploadData.secure_url;
  } catch (error) {
    throw error;
  }
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File, maxSizeMB: number = 50): string | null => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file';
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Image size must be less than ${maxSizeMB}MB`;
  }

  return null;
};

/**
 * Get image dimensions from URL (for display)
 */
export const getImageDimensions = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};
