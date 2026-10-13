'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductById } from '@/lib/api';
import { generatePlaceholder } from '@/lib/placeholders';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  availableStock: number;
}

// Minimal version for storage - reduces size significantly
interface StorableCartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  availableStock: number;
  image?: string; // Optional URL only, not full image data
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: { id: string; title: string; price: number; image: string; stock: number }, quantity?: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

async function refreshCartItemsFromDatabase(items: CartItem[]): Promise<CartItem[]> {
  const refreshedItems = await Promise.all(
    items.map(async (item) => {
      const latestProduct = await getProductById(item.productId);

      if (!latestProduct) {
        return {
          ...item,
          availableStock: 0,
        };
      }

      return {
        ...item,
        title: latestProduct.name || item.title,
        price: typeof latestProduct.price === 'number' ? latestProduct.price : item.price,
        availableStock: typeof latestProduct.stock === 'number' ? latestProduct.stock : item.availableStock,
        image: latestProduct.image || item.image || generatePlaceholder(item.title),
      };
    })
  );

  return refreshedItems;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [useLocalStorage, setUseLocalStorage] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as StorableCartItem[];
        
        const sanitized = parsed.map((item, idx) => {
          // Ensure image always has a value
          let image = generatePlaceholder(item.title);
          if (item.image) {
            // If image is a URL, use it; otherwise use placeholder with product name
            image = item.image.startsWith('http') || item.image.startsWith('data:')
              ? item.image 
              : generatePlaceholder(item.title);
          }
          
          return {
            id: `${item.productId}-${idx}`,
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: Math.max(1, item.quantity || 1),
            availableStock: item.availableStock || 999,
            image, // Always preserve image
          };
        });
        setItems(sanitized);
      }
    } catch (error) {
      setUseLocalStorage(false);
    }
    setMounted(true);
  }, []);

  // Keep cart availability aligned with the latest database stock values.
  useEffect(() => {
    if (!mounted || items.length === 0) {
      return;
    }

    let cancelled = false;

    const syncCartAvailability = async () => {
      try {
        const refreshedItems = await refreshCartItemsFromDatabase(items);

        if (cancelled) {
          return;
        }

        setItems((currentItems) => {
          if (currentItems.length !== refreshedItems.length) {
            return currentItems;
          }

          const hasChanges = currentItems.some((item, index) => {
            const refreshed = refreshedItems[index];
            return (
              item.availableStock !== refreshed.availableStock ||
              item.price !== refreshed.price ||
              item.title !== refreshed.title ||
              item.image !== refreshed.image
            );
          });

          return hasChanges ? refreshedItems : currentItems;
        });
      } catch (error) {
        void error;
      }
    };

    syncCartAvailability();

    const refreshInterval = window.setInterval(syncCartAvailability, 20000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCartAvailability();
      }
    };

    window.addEventListener('focus', syncCartAvailability);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', syncCartAvailability);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [items, mounted]);

  // Save cart to localStorage whenever it changes - with error handling
  useEffect(() => {
    if (!mounted || !useLocalStorage) return;

    try {
      // Convert to storable format (minimal data only)
      const storableItems = items.map(item => {
        // For storage: only include image if it's a reasonable URL (not huge base64)
        // Most product image URLs are 100-300 bytes, so this should work
        let imageToStore: string | undefined = item.image;
        
        // If image exists and is NOT a huge string, store it
        if (imageToStore && imageToStore.length > 10000) {
          imageToStore = undefined; // Skip huge images
        }
        
        return {
          productId: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          availableStock: item.availableStock,
          image: imageToStore, // Store image as-is if it's reasonable size
        } as StorableCartItem;
      });

      const serialized = JSON.stringify(storableItems);
      
      // Check size before saving (warn if getting large)
      const sizeInKB = new Blob([serialized]).size / 1024;

      localStorage.setItem('cart', serialized);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // QuotaExceededError
        setUseLocalStorage(false);
        // Clear localStorage to free up space
        try {
          localStorage.removeItem('cart');
        } catch {
          // Ignore cleanup failures and continue with in-memory storage.
        }
      } else {
        void error;
        setUseLocalStorage(false);
      }
    }
  }, [items, mounted, useLocalStorage]);

  const addItem = (product: { id: string; title: string; price: number; image: string; stock: number }, quantity = 1): { success: boolean; message?: string } => {
    let result = { success: false, message: '' };
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      
      if (existingItem) {
        // Check if item is ALREADY AT MAX STOCK
        if (existingItem.quantity >= product.stock) {
          result = { 
            success: false, 
            message: `This item is already at maximum stock (${product.stock} units) in your cart.` 
          };
          return prevItems; // Do not add anything
        }
        
        // Calculate new quantity
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          // Try to add up to stock limit
          const cappedQuantity = Math.min(newQuantity, product.stock);
          const addedQuantity = cappedQuantity - existingItem.quantity;
          result = { 
            success: true, 
            message: `Added ${addedQuantity} units. Cart now has ${cappedQuantity}/${product.stock} units of this item (max reached).` 
          };
          return prevItems.map((item) =>
            item.productId === product.id
              ? { 
                  ...item, 
                  quantity: cappedQuantity,
                  availableStock: product.stock,
                  image: product.image || item.image, // Use new image if provided, fallback to existing
                }
              : item
          );
        }
        
        result = { 
          success: true, 
          message: `Added ${quantity} units. Total: ${newQuantity}/${product.stock} units.` 
        };
        return prevItems.map((item) =>
          item.productId === product.id
            ? { 
                ...item, 
                quantity: newQuantity,
                availableStock: product.stock,
                image: product.image || item.image, // Use new image if provided, fallback to existing
              }
            : item
        );
      }
      
      // New item - verify we're not trying to add more than available
      const cappedQuantity = Math.min(quantity, product.stock);
      result = { 
        success: true, 
        message: `Added ${cappedQuantity} units to cart.` 
      };
      return [
        ...prevItems,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: cappedQuantity,
          availableStock: product.stock,
          image: product.image, // Preserve full image data
        },
      ];
    });
    
    return result;
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          // HARD VALIDATION: Cap quantity at available stock
          const maxAllowed = item.availableStock;
          const cappedQuantity = Math.min(quantity, maxAllowed);
          return { ...item, quantity: cappedQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
