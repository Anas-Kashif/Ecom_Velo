'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, getProducts, getOrders } from '@/lib/api';
import { StatCard } from '@/components/admin/StatCard';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { ProductsTable } from '@/components/admin/ProductsTable';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('authToken') || '';
    setToken(storedToken);
  }, []);

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      const [dashboardStats, productsData, ordersData] = await Promise.all([
        getDashboardStats(),
        getProducts(0, 5),
        getOrders(token, 0, 5)
      ]);

      if (dashboardStats) {
        setStats(dashboardStats);
        setLastUpdate(new Date().toLocaleTimeString());
      }

      // Transform and set products data
      if (productsData.products) {
        setTopProducts(productsData.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          stock: p.stock,
          status: p.status || 'active',
          image: p.image || '',
          description: p.description || '',
          category: p.category?.name || 'Uncategorized'
        })));
      }

      // Transform and set orders data
      if (ordersData.orders) {
        setRecentOrders(ordersData.orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.user?.name || o.guestName || 'Unknown',
          customerEmail: o.user?.email || o.guestEmail || 'unknown@example.com',
          status: o.status,
          paymentStatus: o.paymentStatus || 'unpaid',
          totalAmount: o.totalAmount,
          createdAt: o.createdAt
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!stats) {
        // Fallback to empty data only on initial load
        setStats({
          totalRevenue: 0,
          todayRevenue: 0,
          todayGrowth: 0,
          monthGrowth: 0,
          totalOrders: 0,
          todayOrdersCount: 0,
          totalProducts: 0,
          totalUsers: 0,
          avgOrderValue: 0,
          statusBreakdown: [],
          dailyRevenue: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const GrowthIndicator = ({ value }: { value: number }) => (
    <div className={`flex items-center gap-1 text-sm font-semibold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      {Math.abs(value)}%
    </div>
  );

  if (loading || !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back! Loading your business overview...
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-semibold text-gray-700">{lastUpdate}</p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${(stats.totalRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Today Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Today Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${(stats.todayRevenue || 0).toFixed(2)}
              </p>
              <div className="mt-2">
                <GrowthIndicator value={stats.todayGrowth || 0} />
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* 30-Day Growth */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">30-Day Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${(stats.last30DaysRevenue || 0).toFixed(2)}
              </p>
              <div className="mt-2">
                <GrowthIndicator value={stats.monthGrowth || 0} />
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${(stats.avgOrderValue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOrders || 0} total orders
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
        <StatCard
          label="Total Orders"
          value={stats.totalOrders || 0}
          icon={<ShoppingCart className="h-8 w-8" />}
        />
        <StatCard
          label="Products"
          value={stats.totalProducts || 0}
          icon={<Package className="h-8 w-8" />}
        />
        <StatCard
          label="Customers"
          value={stats.totalUsers || 0}
          icon={<Users className="h-8 w-8" />}
        />
      </div>

      {/* Daily Revenue Chart */}
      {stats.dailyRevenue && stats.dailyRevenue.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">7-Day Revenue Trend</h2>
          <div className="grid grid-cols-7 gap-2">
            {stats.dailyRevenue.map((day: any, index: number) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-md flex-1 relative flex items-end mb-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm"
                    style={{
                      height: Math.max(
                        5,
                        (day.revenue / Math.max(...stats.dailyRevenue.map((d: any) => d.revenue), 1)) * 100
                      ) + '%',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">${day.revenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 text-center">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Breakdown by Status */}
      {stats.statusBreakdown && stats.statusBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Breakdown by Order Status</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.statusBreakdown.map((item: any) => (
              <div key={item.status} className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 capitalize mb-1">{item.status}</p>
                <p className="text-2xl font-bold text-gray-900">${item.revenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">{item.count} orders</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <p className="mt-1 text-sm text-gray-600">
            Latest orders from your store
          </p>
        </div>
        <OrdersTable orders={recentOrders} />
      </div>

      {/* Top Products */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your best-performing products
          </p>
        </div>
        <ProductsTable products={topProducts} />
      </div>
    </div>
  );
}
