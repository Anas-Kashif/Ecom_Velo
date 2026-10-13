'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateOrder } from '@/lib/api';

interface OrderStatusModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderStatusModal({ isOpen, order, onClose, onSuccess }: OrderStatusModalProps) {
  const [status, setStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form values when order changes or modal opens
  useEffect(() => {
    if (isOpen && order) {
      setStatus(order.status || 'pending');
      setPaymentStatus(order.paymentStatus || 'unpaid');
      setError('');
    }
  }, [isOpen, order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      const result = await updateOrder(token, order.id, {
        status,
        paymentStatus,
      });

      if (result) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to update order.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error updating order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Update Order Status</h2>
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
            <label className="block text-sm font-medium text-gray-900">Order ID</label>
            <div className="mt-2 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-900">
              {order?.orderNumber || order?.id}
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-900">
              Order Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-900">
              Payment Status
            </label>
            <select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={loading}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
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
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
