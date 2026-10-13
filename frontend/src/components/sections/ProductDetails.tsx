'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { generatePlaceholder } from '@/lib/placeholders';
import type { Product } from '@/lib/products';

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { addItem, items } = useCart();
  const router = useRouter();

  // Get actual stock from product, fallback to checking inStock boolean
  const productStock = (product as any).stock || (product.inStock ? 999 : 0);
  
  // Find this product in cart to calculate actually available quantity
  const cartItem = items.find(item => item.productId === product.id);
  const quantityInCart = cartItem?.quantity || 0;
  const actuallyAvailableStock = Math.max(0, productStock - quantityInCart);

  const handleQuantityChange = (newQuantity: number) => {
    const safeQuantity = Math.max(1, newQuantity);
    if (safeQuantity > actuallyAvailableStock) {
      const remaining = actuallyAvailableStock;
      setError(`Only ${remaining} unit${remaining === 1 ? '' : 's'} available to add (${quantityInCart} already in cart, ${productStock} total in stock).`);
      setQuantity(Math.min(safeQuantity, actuallyAvailableStock));
      return;
    }
    setError('');
    setQuantity(safeQuantity);
  };

  const handleAddToCart = () => {
    setError('');
    
    // Validate quantity against actually available stock (total - in cart)
    if (quantity > actuallyAvailableStock) {
      setError(`Cannot add ${quantity} units. Only ${actuallyAvailableStock} available to add (${quantityInCart} already in cart, ${productStock} total in stock).`);
      return;
    }

    if (actuallyAvailableStock <= 0) {
      setError(`This product is out of stock. You already have ${quantityInCart} in your cart.`);
      return;
    }

    if (productStock <= 0) {
      setError('This product is out of stock');
      return;
    }

    // Add entire quantity in one call and get result
    const result = addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image || generatePlaceholder(product.title || 'Product', 300),
      stock: productStock,
    }, quantity);

    // Handle result from addItem
    if (!result.success) {
      setError(result.message || 'Could not add item to cart');
      return;
    }

    setSuccess(true);
    setError('');
    
    // Redirect to cart after 800ms to let user see the success message
    setTimeout(() => {
      router.push('/cart');
    }, 800);
  };

  return (
    <section className="pt-6 md:pt-8 pb-16 md:pb-24">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          {/* Product Image */}
          <div className="flex items-start justify-center bg-surface-container-lowest rounded-lg w-full h-80 sm:h-96 md:h-full md:min-h-96">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Product Info */}
          <div className="pt-0 pb-6 md:pb-8">
            <p className="text-xs md:text-sm font-headline font-bold text-primary uppercase tracking-widest mb-3 md:mb-4">
              {product.category}
            </p>

            <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-4 md:mb-6">
              {product.title}
            </h1>

            <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b-2 border-slate-200">
              <p className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-red-600 mb-3 md:mb-4">
                ${(product.price || 0).toFixed(2)}
              </p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${actuallyAvailableStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <p className={`font-headline font-bold text-xs md:text-sm uppercase tracking-widest ${actuallyAvailableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {actuallyAvailableStock > 0 ? `${actuallyAvailableStock} Available to Add` : quantityInCart > 0 ? `Already at max (${quantityInCart} in cart)` : 'Out of Stock'}
                </p>
              </div>
            </div>

            <p className="text-sm md:text-base lg:text-lg text-secondary mb-6 md:mb-8">
              {product.description}
            </p>

            {/* Specifications */}
            <div className="mb-8 md:mb-12 bg-surface-container-lowest p-4 md:p-6">
              <h3 className="font-headline text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-6">
                SPECIFICATIONS
              </h3>
              <div className="space-y-3 md:space-y-4">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start gap-4">
                    <span className="font-headline font-bold text-xs md:text-sm text-slate-900 uppercase tracking-widest">
                      {key}
                    </span>
                    <span className="text-secondary max-w-xs text-right text-sm">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 md:p-4 bg-red-50 border-2 border-red-600 text-red-600 font-headline text-xs md:text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 md:p-4 bg-green-50 border-2 border-green-600 text-green-600 font-headline text-xs md:text-sm">
                ✓ Added to cart! Redirecting...
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex items-center border-2 border-slate-900">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={actuallyAvailableStock <= 0}
                  className="px-3 md:px-4 py-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={actuallyAvailableStock <= 0}
                  min="1"
                  max={actuallyAvailableStock}
                  className="w-12 md:w-16 text-center font-headline font-bold px-2 md:px-2 py-2 border-l-2 border-r-2 border-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={actuallyAvailableStock <= 0 || quantity >= actuallyAvailableStock}
                  className="px-3 md:px-4 py-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  title={quantity >= actuallyAvailableStock ? 'Stock limit reached' : 'Increase quantity'}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={actuallyAvailableStock <= 0 || success}
                className="flex-1 bg-red-600 text-white font-headline font-bold uppercase text-xs md:text-sm tracking-widest px-4 md:px-8 py-2.5 md:py-3 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg md:text-xl">
                  {success ? 'check_circle' : 'add_shopping_cart'}
                </span>
                <span className="hidden sm:inline">{success ? 'Added to Cart' : actuallyAvailableStock > 0 ? 'Add to Cart' : quantityInCart > 0 ? 'Already at Max' : 'Out of Stock'}</span>
                <span className="sm:hidden">{success ? 'Added' : actuallyAvailableStock > 0 ? 'Add' : 'Out'}</span>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t-2 border-slate-200 space-y-4 text-sm text-secondary">
              <p>✓ Premium quality materials</p>
              <p>✓ Free shipping on orders over $100</p>
              <p>✓ 30-day return guarantee</p>
              <p>✓ 1-year warranty included</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
