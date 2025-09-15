'use client';

import { PAGES } from '@/config/routes';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="flex items-center space-x-2">
              {/* Placeholder para o logo - substituir pela imagem real */}
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Peepers</span>
            </div>
          </Link>
          
          {/* Barra de Pesquisa - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Navegação Principal - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href={PAGES.PRODUTOS} 
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              Produtos
            </Link>
            <Link 
              href="/categorias" 
              className="text-gray-700 hover:text-primary transition-colors font-medium"
            >
              Categorias
            </Link>
            <a 
              href="https://www.mercadolivre.com.br/pagina/peepersshop" 
              target="_blank"
              rel="noopener noreferrer" 
              className="text-primary font-semibold hover:text-primary-dark transition-colors"
            >
              Nossa Loja ML
            </a>
          </nav>
          
          {/* Ações da Direita */}
          <div className="flex items-center space-x-4">
            {/* Busca Mobile */}
            <button className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
            </button>
            
            {/* Login */}
            <Link href={PAGES.LOGIN} className="hidden sm:block p-2 rounded-full hover:bg-gray-100 transition-colors">
              <UserIcon className="h-5 w-5 text-gray-700" />
            </Link>
            
            {/* Menu Mobile */}
            <button 
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5 text-gray-700" />
              ) : (
                <Bars3Icon className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
        
        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {/* Barra de Pesquisa Mobile */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar produtos..." 
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {/* Links de Navegação */}
              <Link 
                href={PAGES.PRODUTOS} 
                className="text-gray-700 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Produtos
              </Link>
              <Link 
                href="/categorias" 
                className="text-gray-700 hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categorias
              </Link>
              <a 
                href="https://www.mercadolivre.com.br/pagina/peepersshop" 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-primary font-semibold hover:text-primary-dark transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Nossa Loja ML
              </a>
              <Link 
                href={PAGES.LOGIN} 
                className="text-gray-700 hover:text-primary transition-colors font-medium py-2 sm:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}