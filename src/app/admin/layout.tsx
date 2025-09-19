/**
 * Admin Layout Root - Wraps admin pages with consistent layout
 * 
 * This layout applies to all /admin/* routes and provides
 * authentication checking and consistent UI structure
 */

import { ReactNode } from 'react';
import AuthCheck from '@/components/AuthCheck';
import AdminLayout from '@/components/admin/AdminLayout';
import { EntitlementsGuard } from './entitlements-guard';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - Peepers',
  description: 'Painel administrativo completo para vendedores do Mercado Livre',
};

// Ensure Node.js runtime (avoids Edge bundling for server checks)
export const runtime = 'nodejs';

interface AdminRootLayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <AuthCheck>
      <NotificationProvider>
        <AdminLayout>
          <EntitlementsGuard>
            {children}
          </EntitlementsGuard>
        </AdminLayout>
      </NotificationProvider>
    </AuthCheck>
  );
}