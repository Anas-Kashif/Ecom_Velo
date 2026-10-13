'use client';

import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  category: string;
  title: string;
  image: string;
  price: number;
  stock: number;
}

export default function ProductCard({ 
  id,
  category, 
  title, 
  image, 
  price,
  stock
}: ProductCardProps) {
  const { addItem } = useCart();
  const [showAdded, setShowAdded] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stock <= 0) {
      alert('This product is out of stock');
      return;
    }
    
    const result = addItem({ id, title, price, image, stock });
    
    if (result.success) {
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    } else {
      // Show error feedback
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      if (result.message) {
        alert(result.message);
      }
    }
  };

  return (
    <a href={`/products/${id}`}>
      <div className="bg-surface-container-lowest group p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative cursor-pointer h-full">
        <div className="aspect-square mb-6 overflow-hidden bg-surface rounded">
          <img 
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
            alt={title}
            src={image} 
          />
        </div>
        <div className="mb-4">
          <p className="text-[10px] font-headline font-bold text-primary uppercase tracking-widest mb-1">
            {category}
          </p>
          <h3 className="font-headline font-bold text-slate-900 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
        <div className="flex items-center justify-between mt-auto gap-4">
          <div>
            <span className="font-headline text-xl font-bold text-slate-900">
              ${(price || 0).toFixed(2)}
            </span>
            <p className="text-xs text-gray-600 mt-1">
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </p>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={stock <= 0}
            className={`p-3 shrink-0 transition-all ${
              stock <= 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : showAdded
                ? 'bg-green-600 text-white'
                : 'bg-slate-900 text-white hover:bg-primary-container'
            }`}
            title={stock <= 0 ? 'Out of stock' : 'Add to cart'}
          >
            <span className="material-symbols-outlined text-lg">
              {showAdded ? 'check' : stock <= 0 ? 'block' : 'add_shopping_cart'}
            </span>
          </button>
        </div>
      </div>
    </a>
  );
}
