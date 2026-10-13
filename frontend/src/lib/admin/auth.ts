import type { AdminUser } from '@/types/admin';

const API_URL = '/api';

export async function loginUser(
  email: string,
  password: string
): Promise<AdminUser> {
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('authToken', data.token);
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      createdAt: new Date(data.createdAt),
    };
  } catch (error: any) {
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  // Clear tokens
  localStorage.removeItem('adminToken');
  localStorage.removeItem('authToken');
  localStorage.removeItem('adminUser');
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('adminUser');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function storeUser(user: AdminUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('adminUser', JSON.stringify(user));
}

export function removeStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminUser');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('authToken');
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}
