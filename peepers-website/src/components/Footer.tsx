import Link from 'next/link';
import { Instagram, Facebook, MessageCircle, CheckCircle, Shield } from 'lucide-react';
import PeepersLogo from './PeepersLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    produtos: {
      title: 'Produtos',
      links: [
        { name: 'Todos os Produtos', href: '/produtos' },
        { name: 'Produtos Novos', href: '/produtos?condition=new' },
        { name: 'Frete Grátis', href: '/produtos?shipping=free' },
        { name: 'Ofertas', href: '/produtos?ofertas=true' },
      ],
    },
    empresa: {
      title: 'Empresa',
      links: [
        { name: 'Sobre Nós', href: '/sobre' },
        { name: 'Nossa História', href: '/sobre#historia' },
        { name: 'Contato', href: '/contato' },
        { name: 'Blog', href: '/blog' },
      ],
    },
    suporte: {
      title: 'Suporte',
      links: [
        { name: 'Central de Ajuda', href: '/ajuda' },
        { name: 'Como Comprar', href: '/ajuda/como-comprar' },
        { name: 'Política de Troca', href: '/ajuda/trocas' },
        { name: 'Rastreamento', href: '/ajuda/rastreamento' },
      ],
    },
    legal: {
      title: 'Legal',
      links: [
        { name: 'Termos de Uso', href: '/termos' },
        { name: 'Política de Privacidade', href: '/privacidade' },
        { name: 'Cookies', href: '/cookies' },
        { name: 'LGPD', href: '/lgpd' },
      ],
    },
  };

  const socialLinks = [
    {
      name: 'Instagram',
      href: '#',
      icon: <Instagram className="w-5 h-5" />,
    },
    {
      name: 'Facebook',
      href: '#',
      icon: <Facebook className="w-5 h-5" />,
    },
    {
      name: 'WhatsApp',
      href: '#',
      icon: <MessageCircle className="w-5 h-5" />,
    },
  ];

  return (
    <footer className="bg-accent-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <PeepersLogo 
                variant="full" 
                size="md" 
                className="brightness-0 invert" 
              />
            </div>
            <p className="text-accent-300 mb-6 leading-relaxed">
              Sua loja oficial com produtos de qualidade, integrada ao Mercado Livre 
              para sua segurança e comodidade. Qualidade garantida e entrega rápida.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-accent-400 hover:text-secondary-400 transition-colors duration-200 p-2 rounded-lg hover:bg-accent-800"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-white mb-4 text-lg">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-accent-300 hover:text-secondary-400 transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-accent-800 mt-12 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="font-semibold text-white mb-2 text-lg">
                Fique por dentro das novidades
              </h4>
              <p className="text-accent-300 text-sm">
                Receba ofertas exclusivas e lançamentos em primeira mão.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 px-4 py-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
              <button className="bg-gold-gradient text-accent-900 px-6 py-3 rounded-lg font-medium hover:shadow-large transform hover:scale-105 transition-all duration-200 whitespace-nowrap">
                Inscrever-se
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-accent-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-accent-400 text-sm">
              © {currentYear} Peepers. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center text-accent-400">
                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                Integrado ao Mercado Livre
              </div>
              <div className="flex items-center text-accent-400">
                <Shield className="w-4 h-4 mr-2 text-blue-400" />
                Compra 100% Segura
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
