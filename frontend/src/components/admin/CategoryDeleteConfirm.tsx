'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCategory } from '@/lib/api';

interface CategoryDeleteConfirmProps {
  isOpen: boolean;
  categoryName: string;
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDeleteConfirm({ isOpen, categoryName, categoryId, onClose, onSuccess }: CategoryDeleteConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found.');
        setLoading(false);
        return;
      }

      await deleteCategory(token, categoryId);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className={`mb-4 flex items-center justify-center rounded-full h-12 w-12 mx-auto ${
          success ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Trash2 className={`h-6 w-6 ${success ? 'text-green-600' : 'text-red-600'}`} />
        </div>

        <h2 className="text-center text-xl font-bold text-gray-900 mb-2">
          {success ? 'Category Deleted' : 'Delete Category'}
        </h2>
        <p className="text-center text-gray-600 mb-4">
          {success ? (
            <span className="font-semibold text-green-600">{categoryName} has been deleted successfully.</span>
          ) : (
            <>Are you sure you want to delete <span className="font-semibold">{categoryName}</span>? This action cannot be undone.</>
          )}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={loading || success}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
