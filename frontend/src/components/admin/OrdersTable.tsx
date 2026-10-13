'use client';

import type { Order } from '@/types/admin';
import { Edit2, Trash2, Eye } from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  onUpdate?: (order: any) => void;
  onDelete?: (order: any) => void;
  onViewDetails?: (order: any) => void;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const PAYMENT_STATUS_COLORS = {
  unpaid: 'bg-orange-50 text-orange-700',
  paid: 'bg-green-50 text-green-700',
  refunded: 'bg-blue-50 text-blue-700',
};

export function OrdersTable({ orders, onUpdate, onDelete, onViewDetails }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Order
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Payment
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
              Date
            </th>
            {(onUpdate || onDelete) && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-blue-600">
                {order.orderNumber}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {order.customerName}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                ${(order.totalAmount || 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    PAYMENT_STATUS_COLORS[order.paymentStatus]
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              {(onUpdate || onDelete) && (
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(order)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-green-600 hover:bg-green-50"
                        title="View order details"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Details</span>
                      </button>
                    )}
                    {onUpdate && (
                      <button
                        onClick={() => onUpdate(order)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                        title="Update order status"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="text-xs">Update</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(order)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-red-600 hover:bg-red-50"
                        title="Delete order"
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
