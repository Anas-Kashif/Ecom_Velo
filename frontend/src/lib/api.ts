// API Service Layer for Roady Ecom Backend

const API_BASE_URL = '/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  categoryId: string;
  category?: Category;
  sku: string;
  image?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  guestEmail?: string;
  guestName?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  totalAmount: number;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  user?: User;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// ============================================
// CATEGORIES
// ============================================
export const getCategories = async (): Promise<Category[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch categories');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// ============================================
// PRODUCTS
// ============================================
export const getProducts = async (skip = 0, take = 20): Promise<{ products: Product[]; total: number }> => {
  try {
    // Get auth token from localStorage if available (for admin requests)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || localStorage.getItem('adminToken') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Include auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add cache busting parameters with timestamp and noCache flag
    const timestamp = Date.now();
    const res = await fetch(`${API_BASE_URL}/products?skip=${skip}&take=${take}&noCache=true&t=${timestamp}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0 };
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    // Get auth token from localStorage if available (for admin requests)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || localStorage.getItem('adminToken') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Include auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add cache busting parameters with timestamp and noCache flag
    const timestamp = Date.now();
    const res = await fetch(`${API_BASE_URL}/products/${id}?noCache=true&t=${timestamp}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch product');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const searchProducts = async (categoryId?: string, skip = 0, take = 20): Promise<{ products: Product[]; total: number }> => {
  try {
    // Get auth token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || localStorage.getItem('adminToken') : null;
    
    let url = `${API_BASE_URL}/products?skip=${skip}&take=${take}`;
    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Include auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to search products');
    }

    return res.json();
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], total: 0 };
  }
};

// ============================================
// AUTHENTICATION
// ============================================
export const signup = async (email: string, password: string, name: string): Promise<AuthResponse | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      throw new Error('Failed to signup');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    return null;
  }
};

export const login = async (email: string, password: string): Promise<AuthResponse | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error('Failed to login');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const getCurrentUser = async (token: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch current user');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// ============================================
// ORDERS
// ============================================
export const getOrders = async (tokenOrSkip?: string | number, skipOrTake?: number, take?: number): Promise<{ orders: Order[]; total: number }> => {
  try {
    let skip = 0;
    let pageSize = 20;
    let token: string | null = null;

    // Detect which API format is being used
    if (typeof tokenOrSkip === 'string' && tokenOrSkip.trim()) {
      // Old API: getOrders(token, skip, take) - only if token is non-empty
      token = tokenOrSkip;
      skip = typeof skipOrTake === 'number' ? skipOrTake : 0;
      pageSize = typeof take === 'number' ? take : 20;
    } else if (typeof tokenOrSkip === 'number') {
      // New API: getOrders(skip, take)
      skip = tokenOrSkip;
      pageSize = typeof skipOrTake === 'number' ? skipOrTake : 20;
    }

    // If no token provided from params, get from localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/orders?skip=${skip}&take=${pageSize}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Orders API error ${res.status}:`, errorText);
      throw new Error(`Failed to fetch orders (${res.status})`);
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], total: 0 };
  }
};

export const getOrderById = async (tokenOrId: string, id?: string): Promise<Order | null> => {
  try {
    // Handle both old API (token, id) and new API (id)
    let orderId: string;
    let token: string | null = null;

    if (id) {
      // Old API: first param is token, second is id
      token = tokenOrId;
      orderId = id;
    } else {
      // New API: first param is id
      orderId = tokenOrId;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to fetch order');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

export interface CreateOrderRequest {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
}

export const createOrder = async (token: string, orderData: CreateOrderRequest): Promise<Order | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      throw new Error('Failed to create order');
    }

    return res.json();
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

// ============================================
// USERS
// ============================================
export const getUsers = async (tokenOrSkip?: string | number, skipOrTake?: number, take?: number): Promise<{ users: User[]; total: number }> => {
  try {
    let skip = 0;
    let pageSize = 20;
    let token: string | null = null;

    // Detect which API format is being used
    if (typeof tokenOrSkip === 'string' && tokenOrSkip.trim()) {
      // Old API: getUsers(token, skip, take) - only if token is non-empty
      token = tokenOrSkip;
      skip = typeof skipOrTake === 'number' ? skipOrTake : 0;
      pageSize = typeof take === 'number' ? take : 20;
    } else if (typeof tokenOrSkip === 'number') {
      // New API: getUsers(skip, take)
      skip = tokenOrSkip;
      pageSize = typeof skipOrTake === 'number' ? skipOrTake : 20;
    }

    // If no token provided from params, get from localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/users?skip=${skip}&take=${pageSize}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Users API error ${res.status}:`, errorText);
      throw new Error(`Failed to fetch users (${res.status})`);
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], total: 0 };
  }
};

// ============================================
// REVIEWS
// ============================================
export const getProductReviews = async (productId: string): Promise<any[]> => {
  try {
    // Note: This would need a reviews endpoint in your backend
    // For now, we'll return empty since reviews come with product query
    return [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

// ============================================
// DASHBOARD (Public Stats)
// ============================================
export const getDashboardStats = async (): Promise<any> => {
  try {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || localStorage.getItem('adminToken') : null;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

// ============================================
// ADMIN OPERATIONS (CREATE, UPDATE, DELETE)
// ============================================

// Products
export const createProduct = async (token: string, productData: any): Promise<Product | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      throw new Error('Failed to create product');
    }

    return res.json();
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};

export const updateProduct = async (token: string, id: string, productData: any): Promise<Product | null> => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update product');
  }

  return res.json();
};

export const deleteProduct = async (token: string, id: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete product');
  }

  return true;
};

// Categories
export const createCategory = async (token: string, categoryData: any): Promise<Category | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });

    if (!res.ok) {
      throw new Error('Failed to create category');
    }

    return res.json();
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

export const updateCategory = async (token: string, id: string, categoryData: any): Promise<Category | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });

    if (!res.ok) {
      throw new Error('Failed to update category');
    }

    return res.json();
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
};

export const deleteCategory = async (token: string, id: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete category');
  }

  return true;
};

// Orders
export const updateOrder = async (token: string, id: string, orderData: any): Promise<Order | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      throw new Error('Failed to update order');
    }

    return res.json();
  } catch (error) {
    console.error('Error updating order:', error);
    return null;
  }
};

export const deleteOrder = async (token: string, id: string): Promise<boolean> => {
  const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete order');
  }

  return true;
};
