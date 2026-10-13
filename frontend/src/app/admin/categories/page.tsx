'use client';

import { useEffect, useState } from 'react';
import { getCategories } from '@/lib/api';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { CategoryDeleteConfirm } from '@/components/admin/CategoryDeleteConfirm';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  return (
    <>
      <CategoryModal
        isOpen={isModalOpen}
        mode={modalMode}
        category={editingCategory}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          fetchCategories();
        }}
      />
      <CategoryDeleteConfirm
        isOpen={deletingCategory !== null}
        categoryName={deletingCategory?.name || ''}
        categoryId={deletingCategory?.id || ''}
        onClose={() => setDeletingCategory(null)}
        onSuccess={() => {
          setDeletingCategory(null);
          fetchCategories();
        }}
      />

      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="mt-1 text-gray-600">Manage product categories</p>
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            Add Category
          </button>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{category.slug}</p>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{category.description}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
