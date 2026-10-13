'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createCategory, updateCategory } from '@/lib/api';

interface CategoryModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  category?: any;
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

export function CategoryModal({ isOpen, mode, category, onClose, onSuccess }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && mode === 'edit' && category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        image: category.image || '',
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
      });
    }
  }, [isOpen, mode, category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: generateSlug(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      const categoryPayload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image: formData.image,
      };

      if (mode === 'create') {
        const result = await createCategory(token, categoryPayload);
        if (!result) throw new Error('Failed to create category');
      } else {
        const result = await updateCategory(token, category.id, categoryPayload);
        if (!result) throw new Error('Failed to update category');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} category`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Add New Category' : 'Edit Category'}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Electronics"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-900">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="auto-generated"
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
              placeholder="Category description..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-900">
              Image URL
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            />
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
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
