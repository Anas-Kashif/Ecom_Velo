'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { updateProduct, getCategories } from '@/lib/api';
import { uploadToCloudinary, validateImageFile } from '@/lib/cloudinaryUpload';

interface Category {
  id: string;
  name: string;
}

interface ProductEditModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export function ProductEditModal({ isOpen, product, onClose, onSuccess }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',
    sku: '',
    image: '',
    status: 'DRAFT',
  });

  const [imagePreview, setImagePreview] = useState('');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        stock: product.stock?.toString() || '',
        categoryId: product.categoryId || '',
        sku: product.sku || '',
        image: product.image || '',
        status: product.status || 'draft',
      });
      setImagePreview(product.image || '');
      setImageMode('url');

      fetchCategories();
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file, 50);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file, token);

      // Set the image URL from Cloudinary
      setFormData((prev) => ({
        ...prev,
        image: cloudinaryUrl,
      }));

      // Create preview from file for immediate display
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Error uploading image:', err);
      setLoading(false);
    }
  };

  const clearImageData = () => {
    setImagePreview('');
    setFormData((prev) => ({
      ...prev,
      image: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Update preview for URL input
    if (name === 'image' && imageMode === 'url') {
      setImagePreview(value);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.sku || !formData.categoryId) {
      setError('Please fill in all required fields: Name, Price, SKU, and Category');
      return;
    }

    // Validate stock is a number
    const stockNum = parseInt(formData.stock || '0', 10);
    if (isNaN(stockNum)) {
      setError('Stock must be a valid number');
      return;
    }

    // Validate price is a number
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a valid number greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const slug = generateSlug(formData.name);

      const productPayload = {
        name: formData.name,
        slug: slug,
        description: formData.description || '',
        price: priceNum,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        stock: stockNum,
        categoryId: formData.categoryId,
        sku: formData.sku,
        image: formData.image || '',
        status: formData.status,
      };

      await updateProduct(token, product.id, productPayload);

      // Clear image data and file input
      clearImageData();
      setImageMode('url');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the product');
      console.error('Error updating product:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-900">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-900">
                Cost ($)
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-900">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-900">
                SKU *
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-900">
                Category *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading || loadingCategories}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-900">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Product Image
            </label>
            
            {/* Image Mode Selector */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="imageMode"
                  value="url"
                  checked={imageMode === 'url'}
                  onChange={(e) => {
                    setImageMode('url');
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Image URL</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="imageMode"
                  value="upload"
                  checked={imageMode === 'upload'}
                  onChange={(e) => {
                    setImageMode('upload');
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Upload File</span>
              </label>
            </div>

            {/* URL Input or File Upload */}
            {imageMode === 'url' ? (
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload-edit"
                  ref={fileInputRef}
                  disabled={loading}
                />
                <label
                  htmlFor="image-upload-edit"
                  className="w-full flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx={21} cy={24} r={3} stroke="currentColor" strokeWidth={2} />
                      <path d="M42 8l-8 8m0 0l8 8m-8-8h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 50MB</p>
                  </div>
                </label>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                  onError={() => setError('Failed to load image preview')}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingCategories}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
