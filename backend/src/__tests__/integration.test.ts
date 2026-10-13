import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Integration Tests for E-Commerce API
 * 
 * These tests use HTTP requests directly to the running server instead of
 * importing route modules. This avoids module resolution issues and tests
 * the API in its actual deployed state.
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:3001
 * - PostgreSQL database connected
 * 
 * Run tests with: npm test
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function apiCall(
  method: string,
  endpoint: string,
  body?: any,
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return response;
}

async function test(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await fn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({
      name,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`❌ ${name} (${duration}ms)`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function assertResponseStatus(
  response: Response,
  expectedStatus: number,
  context: string
): Promise<void> {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `${context}: Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`
    );
  }
}

async function runTests(): Promise<void> {
  console.log('\n🧪 E-Commerce API Integration Tests');
  console.log('====================================\n');

  let loginToken: string = '';
  let userId: string = '';
  let productId: string = '';
  let orderId: string = '';

  // ============================================
  // HEALTH CHECK
  // ============================================
  console.log('\n📊 Health Check');
  console.log('─────────────────');

  await test('Server health check', async () => {
    const response = await apiCall('GET', '/health');
    await assertResponseStatus(response, 200, 'Health check');
    const data: any = await response.json();
    assert(data.status === 'OK', 'Health status should be OK');
    assert(data.database === 'Connected', 'Database should be connected');
  });

  // ============================================
  // AUTHENTICATION
  // ============================================
  console.log('\n🔐 Authentication Tests');
  console.log('──────────────────────');

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  await test('User signup with valid credentials', async () => {
    const response = await apiCall('POST', '/api/auth/signup', {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
    });
    await assertResponseStatus(response, 201, 'Signup');
    const data: any = await response.json();
    
    assert(data.user, 'Response should contain user');
    assert(data.token, 'Response should contain token');
    assert(data.user.email === testEmail, 'User email should match');
    assert(!data.user.password, 'Password should not be returned');
    
    loginToken = data.token;
    userId = data.user.id;
  });

  await test('User login with correct credentials', async () => {
    const response = await apiCall('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    await assertResponseStatus(response, 200, 'Login');
    const data: any = await response.json();
    
    assert(data.user, 'Response should contain user');
    assert(data.token, 'Response should contain token');
    assert(data.user.email === testEmail, 'User email should match');
  });

  await test('Get current user with token', async () => {
    const response = await apiCall('GET', '/api/auth/me', undefined, loginToken);
    await assertResponseStatus(response, 200, 'Get current user');
    const data: any = await response.json();
    
    assert(data.id === userId, 'Should return current user ID');
    assert(data.email === testEmail, 'Should return current user email');
  });

  await test('Reject auth without token', async () => {
    const response = await apiCall('GET', '/api/auth/me');
    assert(response.status === 401, 'Should return 401 without token');
  });

  // ============================================
  // CATEGORIES & PRODUCTS
  // ============================================
  console.log('\n📦 Products & Categories');
  console.log('─────────────────────────');

  await test('Get all categories', async () => {
    const response = await apiCall('GET', '/api/categories');
    await assertResponseStatus(response, 200, 'Get categories');
    const data: any = await response.json();
    
    assert(Array.isArray(data), 'Response should be array');
    assert(data.length > 0, 'Should have at least one category');
    assert(data[0].id, 'Category should have ID');
    assert(data[0].name, 'Category should have name');
  });

  await test('Get all products with pagination', async () => {
    const response = await apiCall('GET', '/api/products?skip=0&take=10');
    await assertResponseStatus(response, 200, 'Get products');
    const data: any = await response.json();
    
    assert(data.products, 'Response should contain products array');
    assert(data.total !== undefined, 'Response should contain total count');
    assert(data.products.length > 0, 'Should have at least one product');
    
    productId = data.products[0].id;
  });

  await test('Get product by ID', async () => {
    const response = await apiCall('GET', `/api/products/${productId}`);
    await assertResponseStatus(response, 200, 'Get product details');
    const data: any = await response.json();
    
    assert(data.id === productId, 'Product ID should match');
    assert(data.name, 'Product should have name');
    assert(data.price !== undefined, 'Product should have price');
    assert(data.stock !== undefined, 'Product should have stock');
  });

  await test('Return 404 for non-existent product', async () => {
    const response = await apiCall('GET', '/api/products/nonexistent-id-12345');
    assert(response.status === 404, 'Should return 404 for non-existent product');
  });

  // ============================================
  // USERS
  // ============================================
  console.log('\n👥 Users Management');
  console.log('───────────────────');

  await test('Get all users with authentication', async () => {
    const response = await apiCall('GET', '/api/users', undefined, loginToken);
    await assertResponseStatus(response, 200, 'Get users');
    const data: any = await response.json();
    
    assert(data.users, 'Response should contain users array');
    assert(data.total !== undefined, 'Response should contain total count');
    assert(Array.isArray(data.users), 'Users should be array');
  });

  await test('Get current user details', async () => {
    const response = await apiCall('GET', `/api/users/${userId}`, undefined, loginToken);
    await assertResponseStatus(response, 200, 'Get user details');
    const data: any = await response.json();
    
    assert(data.id === userId, 'User ID should match');
    assert(data.email === testEmail, 'User email should match');
  });

  await test('Update user profile', async () => {
    const response = await apiCall(
      'PUT',
      `/api/users/${userId}`,
      { name: 'Updated Name', phone: '+1234567890' },
      loginToken
    );
    await assertResponseStatus(response, 200, 'Update user');
    const data: any = await response.json();
    
    assert(data.name === 'Updated Name', 'Name should be updated');
    assert(data.phone === '+1234567890', 'Phone should be updated');
  });

  await test('Reject user operations without token', async () => {
    const response = await apiCall('GET', '/api/users');
    assert(response.status === 401, 'Should return 401 without token');
  });

  // ============================================
  // ORDERS
  // ============================================
  console.log('\n📋 Orders Management');
  console.log('────────────────────');

  await test('Create order with items', async () => {
    const response = await apiCall(
      'POST',
      '/api/orders',
      {
        userId,
        items: [
          {
            productId,
            quantity: 2,
          },
        ],
        shippingCity: 'New York',
        shippingState: 'NY',
        shippingZipCode: '10001',
      },
      loginToken
    );
    await assertResponseStatus(response, 201, 'Create order');
    const data: any = await response.json();
    
    assert(data.id, 'Order should have ID');
    assert(data.orderNumber, 'Order should have order number');
    assert(data.totalAmount > 0, 'Order should have total amount');
    assert(data.userId === userId, 'Order should be for correct user');
    
    orderId = data.id;
  });

  await test('Get all user orders', async () => {
    const response = await apiCall('GET', '/api/orders', undefined, loginToken);
    await assertResponseStatus(response, 200, 'Get orders');
    const data: any = await response.json();
    
    assert(data.orders, 'Response should contain orders array');
    assert(data.total !== undefined, 'Response should contain total count');
    assert(data.orders.length > 0, 'User should have at least one order');
  });

  await test('Get order by ID', async () => {
    const response = await apiCall('GET', `/api/orders/${orderId}`, undefined, loginToken);
    await assertResponseStatus(response, 200, 'Get order details');
    const data: any = await response.json();
    
    assert(data.id === orderId, 'Order ID should match');
    assert(data.userId === userId, 'Order should belong to user');
    assert(data.totalAmount > 0, 'Order should have amount');
  });

  await test('Reject order operations without token', async () => {
    const response = await apiCall('GET', '/api/orders');
    assert(response.status === 401, 'Should return 401 without token');
  });

  // ============================================
  // ADMIN DASHBOARD
  // ============================================
  console.log('\n📊 Admin Dashboard');
  console.log('──────────────────');

  await test('Get dashboard statistics', async () => {
    const response = await apiCall('GET', '/api/admin/dashboard');
    await assertResponseStatus(response, 200, 'Get dashboard');
    const data: any = await response.json();
    
    assert(typeof data.totalUsers === 'number', 'Total users should be number');
    assert(typeof data.totalOrders === 'number', 'Total orders should be number');
    assert(typeof data.totalProducts === 'number', 'Total products should be number');
    assert(typeof data.totalRevenue === 'number', 'Total revenue should be number');
    assert(data.totalUsers >= 0, 'Total users should be non-negative');
    assert(data.totalOrders >= 0, 'Total orders should be non-negative');
    assert(data.totalProducts >= 0, 'Total products should be non-negative');
    assert(data.totalRevenue >= 0, 'Total revenue should be non-negative');
  });

  // ============================================
  // ADMIN AUTHENTICATION
  // ============================================
  console.log('\n🔐 Admin Authentication');
  console.log('──────────────────────');

  let adminToken: string = '';
  let adminId: string = '';

  await test('Admin login with correct credentials', async () => {
    const response = await apiCall('POST', '/api/admin/login', {
      email: 'admin@example.com',
      password: 'admin123',
    });
    await assertResponseStatus(response, 200, 'Admin login');
    const data: any = await response.json();
    
    assert(data.token, 'Should return JWT token');
    assert(data.id, 'Should return admin ID');
    assert(data.email === 'admin@example.com', 'Email should match');
    assert(data.role === 'admin', 'Role should be admin');
    
    adminToken = data.token;
    adminId = data.id;
  });

  await test('Admin login with incorrect password', async () => {
    const response = await apiCall('POST', '/api/admin/login', {
      email: 'admin@example.com',
      password: 'wrongpassword',
    });
    assert(response.status === 401, 'Should return 401 for wrong password');
  });

  await test('Admin login with non-existent email', async () => {
    const response = await apiCall('POST', '/api/admin/login', {
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    assert(response.status === 401, 'Should return 401 for non-existent email');
  });

  await test('Get admin profile with token', async () => {
    const response = await apiCall('GET', '/api/admin/profile', undefined, adminToken);
    await assertResponseStatus(response, 200, 'Get admin profile');
    const data: any = await response.json();
    
    assert(data.id, 'Should have admin ID');
    assert(data.email, 'Should have admin email');
    assert(data.role, 'Should have admin role');
    assert(data.permissions, 'Should have admin permissions');
  });

  await test('Reject admin profile without token', async () => {
    const response = await apiCall('GET', '/api/admin/profile');
    assert(response.status === 401, 'Should return 401 without token');
  });

  await test('Verify admin token', async () => {
    const response = await apiCall('GET', '/api/admin/verify', undefined, adminToken);
    await assertResponseStatus(response, 200, 'Verify token');
    const data: any = await response.json();
    
    assert(data.authenticated === true, 'Should be authenticated');
    assert(data.admin, 'Should return admin info');
    assert(data.admin.id === adminId, 'Admin ID should match');
  });

  await test('Get admin stats (admin role)', async () => {
    const response = await apiCall('GET', '/api/admin/stats', undefined, adminToken);
    await assertResponseStatus(response, 200, 'Get admin stats');
    const data: any = await response.json();
    
    assert(typeof data.totalUsers === 'number', 'Should have total users');
    assert(typeof data.totalOrders === 'number', 'Should have total orders');
    assert(typeof data.todayOrders !== 'undefined', 'Should have today orders');
    assert(typeof data.todayRevenue !== 'undefined', 'Should have today revenue');
  });

  await test('Manager login with correct credentials', async () => {
    const response = await apiCall('POST', '/api/admin/login', {
      email: 'manager@example.com',
      password: 'manager123',
    });
    await assertResponseStatus(response, 200, 'Manager login');
    const data: any = await response.json();
    
    assert(data.token, 'Should return JWT token');
    assert(data.role === 'manager', 'Role should be manager');
  });

  // ============================================
  // RESULTS SUMMARY
  // ============================================
  console.log('\n════════════════════════════════════');
  console.log('📈 Test Summary');
  console.log('════════════════════════════════════\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests:  ${total}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ❌`);
  console.log(`Total Time:   ${totalTime}ms`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
