'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fechar menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                  onClick={onClose}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/produtos"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                  onClick={onClose}
                >
                  Produtos
                </Link>
              </li>
              <li>
                <Link
                  href="#como-funciona"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                  onClick={onClose}
                >
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                  onClick={onClose}
                >
                  Contato
                </Link>
              </li>
            </ul>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Quick Links */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Links Rápidos
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/produtos?condition=new"
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    onClick={onClose}
                  >
                    🆕 Produtos Novos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/produtos?shipping=free"
                    className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    onClick={onClose}
                  >
                    🚚 Frete Grátis
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Precisa de ajuda?
              </p>
              <Link
                href="/contato"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                onClick={onClose}
              >
                Fale Conosco
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}