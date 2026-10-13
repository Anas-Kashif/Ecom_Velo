import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/admin/AuthProvider';

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
