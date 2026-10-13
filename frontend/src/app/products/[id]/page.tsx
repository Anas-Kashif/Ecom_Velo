'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import ProductDetails from '@/components/sections/ProductDetails';
import { getProductById, getCategories, Product, Category } from '@/lib/api';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    let isActive = true;

    const fetchData = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const [productData, categoriesData] = await Promise.all([
          getProductById(id),
          getCategories()
        ]);

        if (!isActive) {
          return;
        }

        if (!productData) {
          notFound();
        }

        setProduct(productData);

        // Find category name
        const category = categoriesData.find(c => c.id === productData.categoryId);
        if (category) {
          setCategoryName(category.name);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        notFound();
      } finally {
        if (showLoading && isActive) {
          setLoading(false);
        }
      }
    };

    fetchData(true);

    const refreshInterval = window.setInterval(() => {
      fetchData(false);
    }, 20000);

    // Refetch product data when page becomes visible (user returns from checkout)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      isActive = false;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-24">
          <div className="max-w-screen-2xl mx-auto px-8 text-center">
            <p className="text-slate-600">Loading product...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    notFound();
  }

  // Transform API product to match ProductDetails component interface
  const transformedProduct = {
    ...product,
    title: product.name,
    category: categoryName || 'Uncategorized',
    inStock: product.stock > 0,
    specs: {
      'SKU': product.sku,
      'Price': `$${product.price}`,
      'Stock': `${product.stock} units`,
    }
  };

  return (
    <>
      <Header />
      <main className="pt-20">
        <ProductDetails product={transformedProduct as any} />
      </main>
      <Footer />
    </>
  );
}
