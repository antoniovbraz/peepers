/**
 * Admin Layout Component - Base layout for admin panel
 * 
 * Provides consistent structure with sidebar navigation and header
 * following Clean Architecture presentation layer patterns
 */

'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import PeepersLogo from '@/components/PeepersLogo';

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof HomeIcon;
  badge?: number;
  description: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
    description: 'Visão geral e métricas principais'
  },
  {
    name: 'Produtos',
    href: '/admin/produtos',
    icon: ShoppingBagIcon,
    description: 'Gerenciar produtos e catálogo'
  },
  {
    name: 'Vendas',
    href: '/admin/vendas',
    icon: CurrencyDollarIcon,
    badge: 3,
    description: 'Pedidos, pagamentos e envios'
  },
  {
    name: 'Métricas',
    href: '/admin/metricas',
    icon: ChartBarIcon,
    description: 'Analytics e relatórios'
  },
  {
    name: 'Comunicação',
    href: '/admin/comunicacao',
    icon: ChatBubbleLeftRightIcon,
    badge: 5,
    description: 'Mensagens e atendimento'
  },
  {
    name: 'Configurações',
    href: '/admin/configuracoes',
    icon: CogIcon,
    description: 'Configurações e ferramentas'
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-6">
            <PeepersLogo className="h-8 w-auto" />
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center rounded-full bg-accent-100 px-2 py-1 text-xs font-medium text-accent-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-gray-200">
            <PeepersLogo className="h-8 w-auto" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Peepers</h1>
              <p className="text-xs text-gray-500">Admin Panel v2.0</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={item.description}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center rounded-full bg-accent-100 px-2 py-1 text-xs font-medium text-accent-600 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@peepers.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-600 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="lg:hidden ml-4">
                <PeepersLogo className="h-6 w-auto" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button
                type="button"
                className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
              </button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Vendedor Premium</p>
                </div>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}