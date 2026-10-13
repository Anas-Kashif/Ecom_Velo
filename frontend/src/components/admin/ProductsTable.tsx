'use client';

import type { Product } from '@/types/admin';
import { Edit2, Trash2 } from 'lucide-react';

interface ProductsTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-50 text-gray-700',
  draft: 'bg-yellow-50 text-yellow-700',
};

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Status
            </th>
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-3">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Crect fill="%23E5E7EB" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" font-size="12" text-anchor="middle" dy=".3em" fill="%239CA3AF"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-400">No Image</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.description}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-gray-600">
                {product.sku}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {product.category}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                ${(product.price || 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {product.stock} units
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    STATUS_COLORS[product.status]
                  }`}
                >
                  {product.status}
                </span>
              </td>
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                        title="Edit product"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="text-xs">Edit</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-red-600 hover:bg-red-50"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="text-xs">Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
