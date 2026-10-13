'use client';

import { X } from 'lucide-react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
}

// Helper function to get order status color
function getOrderStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'shipped':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// Helper function to get payment status color
function getPaymentStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'unpaid':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

// Helper function to get payment method color
function getPaymentMethodColor(method: string): string {
  switch (method?.toLowerCase()) {
    case 'card':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'cash':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const notes = order.notes ? JSON.parse(order.notes) : {};
  const shippingAddress = typeof order.shippingAddress === 'string' 
    ? JSON.parse(order.shippingAddress) 
    : order.shippingAddress;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Order Header Info */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Order Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getOrderStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Payment Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Order Date</p>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">Payment Method</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPaymentMethodColor(order.paymentMethod)}`}>
                {order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="text-gray-600">Name:</span> <span className="font-medium">{order.user?.name || order.guestName || 'Unknown'}</span></p>
              <p><span className="text-gray-600">Email:</span> <span className="font-medium">{order.user?.email || order.guestEmail || 'Unknown'}</span></p>
              {order.userId && (
                <p><span className="text-gray-600">User ID:</span> <span className="font-medium font-mono text-xs">{order.userId}</span></p>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Shipping Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="text-gray-600">Recipient:</span> <span className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</span></p>
              <p><span className="text-gray-600">Address:</span> <span className="font-medium">{shippingAddress.address}</span></p>
              <p><span className="text-gray-600">City:</span> <span className="font-medium">{shippingAddress.city}</span></p>
              <p><span className="text-gray-600">State:</span> <span className="font-medium">{shippingAddress.state}</span></p>
              <p><span className="text-gray-600">ZIP Code:</span> <span className="font-medium">{shippingAddress.zipCode}</span></p>
              <p><span className="text-gray-600">Country:</span> <span className="font-medium">{shippingAddress.country}</span></p>
              <p><span className="text-gray-600">Shipping Method:</span> <span className="font-medium capitalize">{order.shippingMethod}</span></p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items && order.items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</td>
                      <td className="px-4 py-2 text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${(order.totalAmount - (notes.shippingCost || 0) - (notes.tax || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">${(notes.shippingCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${(notes.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-blue-600">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {notes.lastFourDigits && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><span className="text-gray-600">Card Last 4 Digits:</span> <span className="font-mono font-medium">****{notes.lastFourDigits}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
