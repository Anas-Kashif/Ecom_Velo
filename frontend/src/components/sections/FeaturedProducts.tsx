'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/common/ProductCard';
import { generatePlaceholder } from '@/lib/placeholders';
import { getProducts, getCategories, Product, Category } from '@/lib/api';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories first
        const categoriesData = await getCategories();
        const categoryMap = new Map<string, string>();
        categoriesData.forEach((cat: Category) => {
          categoryMap.set(cat.id, cat.name);
        });
        setCategories(categoryMap);

        // Fetch first 4 products
        const { products: productsData } = await getProducts(0, 4);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const transformedProducts = products
    .filter((product: Product) => product.status === 'active') // Only show active products
    .map((product: Product) => ({
      id: product.id,
      category: categories.get(product.categoryId) || 'Uncategorized',
      title: product.name,
      image: product.image || generatePlaceholder(product.name || 'Product', 300),
      price: product.price,
      stock: product.stock,
    }));

  return (
    <section className="bg-surface-container-low py-24">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="font-headline text-4xl font-bold tracking-tight text-slate-900 mb-2">
              PRECISION INSTRUMENTS
            </h2>
            <p className="text-secondary font-body">Featured components for the modern athlete.</p>
          </div>
          <a 
            className="text-red-600 font-headline font-bold uppercase text-sm tracking-widest border-b-2 border-red-600 pb-1 hover:opacity-70 transition-opacity" 
            href="/products"
          >
            View All
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600">Loading products...</p>
            </div>
          ) : transformedProducts.length > 0 ? (
            transformedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-600">No products available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
