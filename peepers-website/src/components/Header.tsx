'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import PeepersLogo from './PeepersLogo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Produtos', href: '/produtos' },
    { name: 'Sobre', href: '/sobre' },
    { name: 'Contato', href: '/contato' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
            >
              <PeepersLogo variant="full" size="md" priority />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-accent-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/produtos"
              className="bg-brand-gradient text-white px-6 py-2.5 rounded-lg font-medium shadow-brand hover:shadow-large transform hover:scale-105 transition-all duration-200"
            >
              Ver Produtos
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              type="button"
              className="text-accent-700 hover:text-primary-600 focus:outline-none focus:text-primary-600 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-accent-200 shadow-medium animate-slide-down">
          <div className="px-4 py-6 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-accent-700 hover:text-primary-600 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-accent-200">
              <Link
                href="/produtos"
                className="block w-full bg-brand-gradient text-white text-center px-6 py-3 rounded-lg font-medium shadow-brand"
                onClick={() => setIsMenuOpen(false)}
              >
                Ver Produtos
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
