'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { fuzzySearch, FuzzySearchResult, highlightMatches } from '@/lib/fuzzySearch';
import { getProducts, Product } from '@/lib/api';

interface SearchResult {
  product: Product;
  category: string;
  score: number;
  matches: { start: number; end: number }[];
}

export default function Header() {
  const { itemCount } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/products' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ];

  // Load all products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getProducts(0, 1000);
        setAllProducts(products.products || []);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    
    loadProducts();
  }, []);

  // Perform fuzzy search on query change
  const performSearch = useCallback((query: string) => {
    if (!query.trim() || allProducts.length === 0) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    
    try {
      // Prepare search data with product names and descriptions
      const searchData = allProducts.map(product => ({
        ...product,
        searchName: product.name,
        searchDesc: product.description,
      }));

      // Perform fuzzy search on product names and descriptions
      const results = fuzzySearch(
        searchData,
        query,
        ['searchName', 'searchDesc'] as any,
        0.2 // Lower threshold for better results
      );

      // Transform results to include category and limit to top 8
      const transformedResults = results.slice(0, 8).map(result => ({
        product: result.item,
        category: 'Product',
        score: result.score,
        matches: result.matches,
      }));

      setSearchResults(transformedResults);
    } finally {
      setLoadingSearch(false);
    }
  }, [allProducts]);

  // Handle search input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection of a product from search results
  const handleSelectProduct = (productId: string) => {
    setSearchQuery('');
    setShowResults(false);
    setMobileSearchOpen(false);
    router.push(`/products/${productId}`);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchQuery('');
      setShowResults(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 glass-header shadow-sm">
      <nav className="flex justify-between items-center px-4 sm:px-6 md:px-8 h-20 w-full max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link className="text-lg sm:text-xl md:text-2xl font-bold tracking-tighter text-slate-900 font-headline" href="/">
          VELO
          <br className="hidden sm:block md:hidden" />
          PRECISION
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="hidden lg:flex gap-8 font-headline tracking-widest text-xs font-semibold uppercase">
            {navLinks.map((link) => (
              <Link key={link.href} className="nav-link" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Search and Icons */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          {/* Desktop Search */}
          <div 
            ref={searchContainerRef}
            className="hidden lg:block relative"
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-gray-100 rounded-full px-4 md:px-5 py-2 md:py-3 gap-3 shadow-sm hover:shadow-md transition-shadow focus-within:outline focus-within:outline-2 focus-within:outline-red-600">
              <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-body w-40 md:w-56 text-slate-900 placeholder-gray-400" 
                placeholder="Search components..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
              />
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full mt-2 w-96 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-50">
                {loadingSearch ? (
                  <div className="px-4 py-4 text-center text-sm text-gray-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectProduct(result.product.id)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center gap-3"
                      >
                        {result.product.image && (
                          <img
                            src={result.product.image}
                            alt={result.product.name}
                            className="w-12 h-12 object-contain bg-gray-100 rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-headline font-bold text-sm text-slate-900 truncate">
                            {result.product.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            ${result.product.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-xs text-red-600 font-semibold">
                          {(result.score * 100).toFixed(0)}%
                        </span>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-4 text-center text-sm text-gray-500">
                    No products found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Mobile Search Icon */}
          <button 
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="lg:hidden text-slate-900 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg md:text-xl">search</span>
          </button>

          {/* Admin Login */}
          <Link href="/admin/login" className="text-slate-900 hover:text-red-600 transition-colors hidden sm:block">
            <span className="material-symbols-outlined text-lg md:text-xl">person</span>
          </Link>

          {/* Shopping Cart */}
          <Link href="/cart" className="text-slate-900 hover:text-red-600 transition-colors relative">
            <span className="material-symbols-outlined text-lg md:text-xl">shopping_cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-900 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div 
          ref={mobileSearchRef}
          className="lg:hidden border-b border-slate-200 bg-white px-4 py-3"
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-gray-100 rounded-full px-4 py-2.5 gap-2">
            <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-body flex-1 text-slate-900 placeholder-gray-400" 
              placeholder="Search components..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>

          {/* Mobile Search Results */}
          {showResults && (
            <div className="mt-3 max-h-80 overflow-y-auto">
              {loadingSearch ? (
                <div className="px-2 py-2 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectProduct(result.product.id)}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 transition-colors rounded flex items-center gap-2"
                    >
                      {result.product.image && (
                        <img
                          src={result.product.image}
                          alt={result.product.name}
                          className="w-10 h-10 object-contain bg-gray-100 rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-bold text-xs text-slate-900 truncate">
                          {result.product.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          ${result.product.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="px-2 py-2 text-center text-sm text-gray-500">
                  No products found
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-headline font-bold uppercase tracking-widest text-slate-900 hover:bg-red-50 hover:text-red-600 transition-colors rounded"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin/login"
              onClick={() => setMenuOpen(false)}
              className="md:hidden block px-4 py-3 text-sm font-headline font-bold uppercase tracking-widest text-slate-900 hover:bg-red-50 hover:text-red-600 transition-colors rounded"
            >
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
