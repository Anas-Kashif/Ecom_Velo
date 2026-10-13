'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    image: string;
    price: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  guestEmail: string;
  guestName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingAttn: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  items: OrderItem[];
  createdAt: string;
  notes?: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/checkout/guest/${orderId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError((err as Error).message || 'Failed to load order');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20">
          <section className="pt-4 md:pt-6 pb-16 md:pb-24">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-center items-center min-h-96">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  <p className="mt-4 text-slate-600">Loading order details...</p>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="pt-20">
          <section className="pt-4 md:pt-6 pb-16 md:pb-24">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="bg-red-50 border-2 border-red-600 rounded-lg p-6 md:p-8">
                <h1 className="font-headline text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                  ❌ Order Not Found
                </h1>
                <p className="text-slate-700 mb-6">{error || 'Could not load the order details.'}</p>
                <Link
                  href="/products"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-headline font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Back to Shopping
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const notes = order.notes ? JSON.parse(order.notes) : {};
  const shippingAddress = typeof order.shippingAddress === 'string' 
    ? JSON.parse(order.shippingAddress) 
    : order.shippingAddress;

  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="pt-4 md:pt-6 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Success Message */}
            <div className="bg-green-50 border-2 border-green-600 rounded-lg p-6 md:p-8 mb-8 md:mb-12">
              <div className="flex items-start gap-3 md:gap-4">
                <span className="text-3xl md:text-4xl">✅</span>
                <div>
                  <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                    Order Confirmed!
                  </h1>
                  <p className="text-slate-700 text-base md:text-lg">
                    Thank you for your purchase. Your order has been successfully placed.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Order Number & Details */}
                <div className="bg-white border-2 border-slate-900 rounded-lg p-6 md:p-8 mb-6 md:mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Order Number
                      </p>
                      <p className="font-headline text-lg md:text-xl font-bold text-slate-900">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Order Date
                      </p>
                      <p className="font-headline text-lg md:text-xl font-bold text-slate-900">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Order Status
                      </p>
                      <p className="font-headline text-lg md:text-xl font-bold text-slate-900">
                        {order.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Payment Status
                      </p>
                      <p className="font-headline text-lg md:text-xl font-bold text-red-600">
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white border-2 border-slate-900 rounded-lg p-6 md:p-8 mb-6 md:mb-8">
                  <h2 className="font-headline text-xl md:text-2xl font-bold text-slate-900 mb-6">
                    ORDER ITEMS
                  </h2>
                  <div className="space-y-4">
                    {order.items && order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-4 border-b border-slate-200 last:border-0">
                        <div className="flex-1">
                          <p className="font-headline font-bold text-slate-900">
                            {item.product?.name || `Product ${index + 1}`}
                          </p>
                          <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline font-bold text-slate-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-500">${item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="bg-white border-2 border-slate-900 rounded-lg p-6 md:p-8">
                  <h2 className="font-headline text-xl md:text-2xl font-bold text-slate-900 mb-6">
                    SHIPPING INFORMATION
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Ship To
                      </p>
                      <p className="font-headline font-bold text-slate-900 mb-1">
                        {shippingAddress.firstName} {shippingAddress.lastName}
                      </p>
                      <p className="text-slate-700 text-sm mb-1">{shippingAddress.address}</p>
                      <p className="text-slate-700 text-sm mb-1">
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                      </p>
                      <p className="text-slate-700 text-sm">{shippingAddress.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Shipping Method
                      </p>
                      <p className="font-headline font-bold text-slate-900 mb-4 capitalize">
                        {order.shippingMethod} Shipping
                      </p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-2">
                        Estimated Delivery
                      </p>
                      <p className="text-slate-700">
                        {order.shippingMethod === 'standard'
                          ? '5-7 business days'
                          : order.shippingMethod === 'express'
                          ? '2-3 business days'
                          : 'Next business day'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Order Summary */}
                <div className="bg-white border-2 border-slate-900 rounded-lg p-6 md:p-8 sticky top-24">
                  <h3 className="font-headline text-lg md:text-xl font-bold text-slate-900 mb-6 pb-4 border-b-2 border-slate-200">
                    ORDER SUMMARY
                  </h3>

                  <div className="space-y-3 md:space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Subtotal</span>
                      <span className="font-headline font-bold text-slate-900">${(order.totalAmount - (notes.shippingCost || 0) - (notes.tax || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Shipping</span>
                      <span className="font-headline font-bold text-slate-900">${(notes.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Tax</span>
                      <span className="font-headline font-bold text-slate-900">${(notes.tax || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="py-4 border-t-2 border-b-2 border-slate-200 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-bold text-slate-900 text-lg">Total</span>
                      <span className="font-headline font-bold text-red-600 text-xl">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment & Contact Info */}
                  <div className="space-y-4 mb-6 pb-6 border-b-2 border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-1">
                        Payment Method
                      </p>
                      <p className="text-slate-900 capitalize">
                        {order.paymentMethod === 'cash_on_delivery'
                          ? '🚚 Cash on Delivery'
                          : '💳 Credit/Debit Card'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-headline font-semibold mb-1">
                        Email Confirmation
                      </p>
                      <p className="text-slate-900 break-all text-sm">{order.guestEmail}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href="/products"
                      className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-headline font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      Continue Shopping
                    </Link>
                    <Link
                      href="/"
                      className="block w-full text-center border-2 border-slate-900 hover:bg-slate-100 text-slate-900 font-headline font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 md:mt-12 bg-slate-50 border-l-4 border-red-600 rounded-lg p-6 md:p-8">
              <h3 className="font-headline text-lg md:text-xl font-bold text-slate-900 mb-3 md:mb-4">
                ℹ️ What happens next?
              </h3>
              <ul className="space-y-2 md:space-y-3 text-slate-700 text-sm md:text-base">
                <li className="flex gap-3">
                  <span className="text-lg">📧</span>
                  <span>A confirmation email has been sent to <strong className="text-slate-900">{order.guestEmail}</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">📦</span>
                  <span>Your order number is <strong className="text-slate-900">{order.orderNumber}</strong> - save this for reference</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">🚚</span>
                  <span>
                    {order.paymentMethod === 'cash_on_delivery'
                      ? 'Payment will be collected upon delivery'
                      : 'Your payment has been received'}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-lg">✈️</span>
                  <span>Your order will be{order.shippingMethod === 'standard' ? ' shipped' : ' delivered'} within {order.shippingMethod === 'standard' ? '5-7' : order.shippingMethod === 'express' ? '2-3' : '1'} business days</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

