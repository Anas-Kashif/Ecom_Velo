'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import { ProductsTable } from '@/components/admin/ProductsTable';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import { ProductDeleteConfirm } from '@/components/admin/ProductDeleteConfirm';
import { Plus, Search, Filter } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 50;

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pageSize;
      const data = await getProducts(skip, pageSize);
      
      // Map API products to admin table format
      const mappedProducts = data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        category: p.category?.name || 'Uncategorized',
        categoryId: p.categoryId,
        image: p.image,
        status: p.status || 'active'
      }));
      
      setProducts(mappedProducts);
      setTotalProducts(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const filteredProducts = products.filter((product) => {
    // If search term is empty, search matches
    const matchesSearch = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = filterStatus === 'all' || (product.status && product.status.toLowerCase() === filterStatus.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <ProductFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchProducts(currentPage);
        }}
      />
      <ProductEditModal
        isOpen={editingProduct !== null}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={() => {
          setEditingProduct(null);
          fetchProducts(currentPage);
        }}
      />
      <ProductDeleteConfirm
        isOpen={deletingProduct !== null}
        productName={deletingProduct?.name || ''}
        productId={deletingProduct?.id || ''}
        onClose={() => setDeletingProduct(null)}
        onSuccess={() => {
          setDeletingProduct(null);
          fetchProducts(currentPage);
        }}
      />
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-gray-600">Manage your product inventory</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'draft')
            }
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {loading ? (
          'Loading products...'
        ) : (
          <>
            Showing {filteredProducts.length} of {totalProducts} total products (Page {currentPage})
          </>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products from database...</p>
        </div>
      ) : (
        <>
          <ProductsTable 
            products={filteredProducts}
            onEdit={setEditingProduct}
            onDelete={setDeletingProduct}
          />
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => fetchProducts(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(totalProducts / pageSize) || 1}
            </div>
            
            <button
              onClick={() => fetchProducts(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalProducts / pageSize) || loading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
      </div>
    </>
  );
}
