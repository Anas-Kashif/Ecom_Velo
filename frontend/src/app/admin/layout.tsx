import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/admin/AuthProvider';
import { AdminLayout } from '@/components/admin/AdminLayoutWrapper';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'E-commerce Admin Dashboard',
};

interface AdminRootLayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <AuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AuthProvider>
  );
}
