import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResponse {
  public_id: string;
  url: string;
  secure_url: string;
  size: number;
  width?: number;
  height?: number;
  format: string;
}

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}

/**
 * Delete an image from Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    if (!publicId) return;

    // Remove /upload/ and extension from the public_id if needed
    let cleanPublicId = publicId;
    if (publicId.includes('/upload/')) {
      const parts = publicId.split('/upload/');
      cleanPublicId = parts[1].split('.')[0];
    }

    await cloudinary.uploader.destroy(cleanPublicId);
  } catch (error) {
    logger.error('Error deleting image from Cloudinary', error);
    // Don't throw - allow operation to continue even if delete fails
  }
};

/**
 * Generate upload signature for client-side uploads
 * This allows the frontend to upload directly to Cloudinary
 */
export const generateUploadSignature = (): SignatureResponse => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  // Only sign parameters that will actually be sent in the upload
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: 'ecommerce/products',
    },
    process.env.CLOUDINARY_API_SECRET || ''
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
  };
};

/**
 * Validate Cloudinary URL
 */
export const isValidCloudinaryUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

/**
 * Extract public_id from Cloudinary URL
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url.includes('cloudinary.com')) return null;

    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v[\d]+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch (error) {
    logger.error('Error extracting public_id from Cloudinary URL', error);
    return null;
  }
};

export default cloudinary;
