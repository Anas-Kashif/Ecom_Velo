'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { generatePlaceholder } from '@/lib/placeholders';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="pt-4 md:pt-6 pb-16 md:pb-24">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-8 md:mb-12">
            SHOPPING CART
          </h1>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 md:p-12 text-center">
            <p className="text-lg md:text-2xl text-slate-900 mb-3 md:mb-4">Your cart is empty</p>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Add some precision components to get started.</p>
            <Link
              href="/products"
              className="inline-block px-6 md:px-8 py-2 md:py-3 bg-red-600 text-white font-headline font-bold text-sm md:text-base hover:bg-red-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const shipping = total > 100 ? 0 : 15.00;
  const tax = total * 0.08;
  const orderTotal = total + shipping + tax;

  return (
    <section className="pt-4 md:pt-6 pb-16 md:pb-24">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-8 md:mb-12">
          SHOPPING CART
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-3 md:space-y-4">
              {items.map((item) => {
                // Defensive: ensure availableStock exists
                const availableStock = item.availableStock || 999;
                return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 md:gap-6 bg-white border-2 border-slate-200 p-4 md:p-6 hover:border-red-600 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded shrink-0">
                    <img
                      src={item.image || generatePlaceholder(item.title, 100)}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = generatePlaceholder(item.title, 100);
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-headline font-bold text-sm md:text-base text-slate-900 hover:text-red-600 transition-colors"
                      >
                        {item.title}
                      </Link>
                      <p className="text-base md:text-lg font-headline font-bold text-slate-900 mt-1 md:mt-2">
                        ${(item.price || 0).toFixed(2)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">
                        {availableStock} available in stock
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 md:gap-4 mt-3 md:mt-0">
                      <div className="flex items-center border-2 border-slate-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 md:p-2 hover:bg-gray-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <span className="px-2 md:px-4 py-1 md:py-2 font-headline font-bold text-slate-900 text-sm md:text-base">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity < availableStock) {
                              updateQuantity(item.productId, item.quantity + 1);
                            } else {
                              alert(`Maximum stock (${availableStock}) reached for this item`);
                            }
                          }}
                          className={`p-1 md:p-2 transition-colors ${
                            item.quantity >= availableStock
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-gray-100'
                          }`}
                          disabled={item.quantity >= availableStock}
                          title={item.quantity >= availableStock ? 'Stock limit reached' : 'Add more'}
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                      {item.quantity >= availableStock && (
                        <span className="text-xs font-semibold text-red-600">Max</span>
                      )}
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 md:p-2 text-red-600 hover:bg-red-50 rounded transition-colors ml-auto md:ml-0"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Item Total - Mobile positioned at top right */}
                  <div className="text-right flex flex-col justify-start sm:justify-between sm:mt-0">
                    <p className="font-headline font-bold text-slate-900 text-sm md:text-base">
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                      {item.quantity} × ${(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Clear Cart Button */}
            <button
              onClick={clearCart}
              className="mt-6 md:mt-8 px-4 md:px-6 py-2 md:py-3 border-2 border-red-600 text-red-600 font-headline font-bold text-sm md:text-base hover:bg-red-600 hover:text-white transition-colors"
            >
              CLEAR CART
            </button>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-slate-50 border-2 border-slate-200 p-6 md:p-8 lg:sticky lg:top-24">
              <h2 className="font-headline text-xl md:text-2xl font-bold text-slate-900 mb-6">
                ORDER SUMMARY
              </h2>

              <div className="space-y-3 md:space-y-4 border-b-2 border-slate-200 pb-4 md:pb-6 mb-4 md:mb-6">
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-headline font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-headline font-bold text-slate-900">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-green-600">Free shipping over $100</p>
                )}
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-slate-600">Tax (8%)</span>
                  <span className="font-headline font-bold text-slate-900">
                    ${tax.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 md:mb-8">
                <span className="font-headline text-lg md:text-xl font-bold text-slate-900">Total</span>
                <span className="font-headline text-xl md:text-2xl font-bold text-red-600">
                  ${orderTotal.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-red-600 text-white py-3 md:py-4 font-headline font-bold text-center text-sm md:text-base hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mb-3 md:mb-4"
              >
                <span className="hidden sm:inline">PROCEED TO CHECKOUT</span>
                <span className="sm:hidden">CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/products"
                className="block w-full border-2 border-slate-900 text-slate-900 py-3 md:py-4 font-headline font-bold text-center text-sm md:text-base hover:bg-slate-900 hover:text-white transition-colors"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
