'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  Bars3Icon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

import { PAGES } from '@/config/routes';
import { Button } from '@/components/ui/primitives/Button';
import { Input } from '@/components/ui/primitives/Input';
import { Container } from '@/components/ui/layout/Container';
import { HStack, VStack } from '@/components/ui/layout/Stack';
import { Flex, FlexItem } from '@/components/ui/layout/Flex';

// ==================== COMPONENT ====================

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClick = (callback?: () => void) => {
    try {
      setIsMobileMenuOpen(false);
      if (callback && typeof callback === 'function') {
        callback();
      }
    } catch (error) {
      console.error('[Header] Mobile menu error:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implementar busca
      console.log('Buscar por:', searchQuery);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <Container size="full" padding="none">
        <div className="px-4 sm:px-6">
          <Flex align="center" justify="between" className="h-16">
            {/* Logo */}
            <FlexItem shrink={0}>
              <Link href="/" className="flex items-center group">
                <HStack spacing="sm" align="center">
                  {/* Logo Icon */}
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-primary-500 to-brand-primary-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  {/* Brand Name */}
                  <span className="text-xl font-bold text-gray-900 group-hover:text-brand-primary-600 transition-colors">
                    Peepers
                  </span>
                </HStack>
              </Link>
            </FlexItem>
            
            {/* Search Bar - Desktop */}
            <FlexItem grow={1} className="hidden md:block mx-6 max-w-md">
              <form onSubmit={handleSearchSubmit}>
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  fullWidth
                />
              </form>
            </FlexItem>
            
            {/* Desktop Navigation */}
            <FlexItem shrink={0} className="hidden md:block">
              <HStack spacing="md" align="center">
                <nav>
                  <HStack spacing="lg" align="center">
                    <Link 
                      href={PAGES.HOME}
                      className="text-gray-700 hover:text-brand-primary-600 font-medium transition-colors"
                    >
                      Início
                    </Link>
                    <Link 
                      href={PAGES.PRODUTOS}
                      className="text-gray-700 hover:text-brand-primary-600 font-medium transition-colors"
                    >
                      Produtos
                    </Link>
                    <Link 
                      href="/admin"
                      className="text-gray-700 hover:text-brand-primary-600 font-medium transition-colors"
                    >
                      Admin
                    </Link>
                  </HStack>
                </nav>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-700 hover:text-brand-primary-600"
                >
                  <UserIcon className="h-5 w-5" />
                </Button>
              </HStack>
            </FlexItem>
            
            {/* Mobile Menu Button */}
            <FlexItem shrink={0} className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="text-gray-700"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </Button>
            </FlexItem>
          </Flex>
        </div>
      </Container>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <Container padding="md">
            <VStack spacing="lg">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="w-full">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  fullWidth
                />
              </form>
              
              {/* Mobile Navigation */}
              <nav className="w-full">
                <VStack spacing="md">
                  <Link 
                    href={PAGES.HOME}
                    className="block w-full py-2 text-gray-900 hover:text-brand-primary-600 font-medium transition-colors"
                    onClick={() => handleMobileMenuClick()}
                  >
                    Início
                  </Link>
                  <Link 
                    href={PAGES.PRODUTOS}
                    className="block w-full py-2 text-gray-900 hover:text-brand-primary-600 font-medium transition-colors"
                    onClick={() => handleMobileMenuClick()}
                  >
                    Produtos
                  </Link>
                  <Link 
                    href="/admin"
                    className="block w-full py-2 text-gray-900 hover:text-brand-primary-600 font-medium transition-colors"
                    onClick={() => handleMobileMenuClick()}
                  >
                    Admin
                  </Link>
                  
                  {/* Mobile User Profile */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => handleMobileMenuClick()}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Minha Conta
                    </Button>
                  </div>
                </VStack>
              </nav>
            </VStack>
          </Container>
        </div>
      )}
    </header>
  );
}