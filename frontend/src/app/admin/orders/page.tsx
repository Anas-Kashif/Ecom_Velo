'use client';

import { useEffect, useState } from 'react';
import { getOrders, getOrderById } from '@/lib/api';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { OrderStatusModal } from '@/components/admin/OrderStatusModal';
import { OrderDeleteConfirm } from '@/components/admin/OrderDeleteConfirm';
import { OrderDetailsModal } from '@/components/admin/OrderDetailsModal';
import { Search, Filter } from 'lucide-react';

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus>('all');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deletingOrder, setDeletingOrder] = useState<any>(null);
  const [detailingOrder, setDetailingOrder] = useState<any>(null);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('authToken') || '';
    setToken(storedToken);
  }, []);

  const fetchOrders = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getOrders(token, 0, 100);
      
      // Map API orders to admin table format
      const mappedOrders = data.orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user?.name || o.guestName || 'Unknown',
        customerEmail: o.user?.email || o.guestEmail || 'unknown@example.com',
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: o.totalAmount,
        createdAt: new Date(o.createdAt)
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleViewDetails = async (order: any) => {
    try {
      // Fetch full order details from API
      const fullOrder = await getOrderById(token, order.id);
      if (fullOrder) {
        setDetailingOrder(fullOrder);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <OrderDetailsModal
        isOpen={detailingOrder !== null}
        order={detailingOrder}
        onClose={() => setDetailingOrder(null)}
      />
      <OrderStatusModal
        isOpen={editingOrder !== null}
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSuccess={() => {
          setEditingOrder(null);
          fetchOrders();
        }}
      />
      <OrderDeleteConfirm
        isOpen={deletingOrder !== null}
        orderNumber={deletingOrder?.orderNumber || ''}
        orderId={deletingOrder?.id || ''}
        onClose={() => setDeletingOrder(null)}
        onSuccess={() => {
          setDeletingOrder(null);
          fetchOrders();
        }}
      />
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-gray-600">View and manage customer orders</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, customer name, or email..."
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
              onChange={(e) => setFilterStatus(e.target.value as OrderStatus)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {loading ? (
            'Loading orders...'
          ) : (
            <>
              Showing {filteredOrders.length} of {orders.length} orders
            </>
          )}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading orders from database...</p>
          </div>
        ) : (
          <OrdersTable 
            orders={filteredOrders}
            onViewDetails={handleViewDetails}
            onUpdate={setEditingOrder}
            onDelete={setDeletingOrder}
          />
        )}
      </div>
    </>
  );
}
