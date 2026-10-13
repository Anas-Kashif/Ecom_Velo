'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/common/ProductCard';
import { generatePlaceholder } from '@/lib/placeholders';
import { getProducts, getCategories, Product, Category } from '@/lib/api';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' }
];

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    let isActive = true;

    const fetchData = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts(0, 100)
        ]);

        if (!isActive) {
          return;
        }

        const catMap = new Map<string, string>();
        categoriesData.forEach((cat: Category) => {
          catMap.set(cat.id, cat.name);
        });
        
        setCategories(categoriesData);
        setCategoryMap(catMap);
        setProducts(productsData.products);
      } catch (error) {
        console.error('Error fetching data:', error);
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
  }, []);

  // Handle category filter
  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Filter and sort products
  let filteredProducts = products;
  
  // Filter out inactive and draft products (only show active)
  filteredProducts = filteredProducts.filter(p => p.status === 'active');
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (categoryMap.get(p.categoryId) || '').toLowerCase().includes(query)
    );
  }
  
  if (activeCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.categoryId === activeCategory);
  }

  // Apply sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'relevance':
      default:
        return 0;
    }
  });

  const transformedProducts = filteredProducts.map(product => ({
    id: product.id,
    category: categoryMap.get(product.categoryId) || 'Uncategorized',
    title: product.name,
    image: product.image || generatePlaceholder(product.name || 'Product', 300),
    price: product.price,
    stock: product.stock,
  }));

  const displayCategories = [
    { id: 'all', name: 'All Products' },
    ...categories
  ];

  return (
    <section className="pt-8 md:pt-16 pb-16 md:pb-24">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8 md:mb-12">
          <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 mb-3 md:mb-4">
            PRECISION COMPONENTS
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-secondary max-w-2xl">
            Explore our complete catalog of high-end bicycle components engineered for performance and precision.
          </p>
        </div>

        {/* Category Buttons - Scrollable on mobile */}
        <div className="mb-6 md:mb-8 -mx-4 sm:-mx-6 md:mx-0 px-4 sm:px-6 md:px-0 overflow-x-auto md:overflow-visible">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {displayCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-4 sm:px-6 py-2 font-headline text-xs md:text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 md:py-3 border-2 border-slate-900 font-body text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
          />
        </div>

        {/* Sort Controls */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
          <label htmlFor="sort" className="font-headline text-xs md:text-sm font-bold uppercase tracking-widest text-slate-900">
            Sort:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border-2 border-slate-900 font-body text-sm text-slate-900 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
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
              <p className="text-slate-600">No products found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
