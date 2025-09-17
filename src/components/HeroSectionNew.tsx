'use client';

import { PAGES } from '@/config/routes';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/primitives/Button';
import { Badge } from '@/components/ui/primitives/Badge';
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack, HStack } from '@/components/ui/layout/Stack';
import { Center } from '@/components/ui/layout/Flex';

// ==================== TYPES ====================

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  variant?: 'primary' | 'secondary' | 'gradient';
}

// ==================== COMPONENT ====================

export default function HeroSection({
  title = "Descubra produtos únicos na Peepers",
  subtitle = "Encontre os melhores produtos com qualidade garantida. Visite nossa loja oficial no Mercado Livre.",
  ctaText = "Ver Nossa Loja",
  ctaLink = "https://www.mercadolivre.com.br/pagina/peepersshop",
  backgroundImage,
  variant = 'gradient'
}: HeroSectionProps) {
  
  // Variant configurations
  const variants = {
    primary: 'bg-brand-primary-600 text-white',
    secondary: 'bg-brand-secondary-600 text-white', 
    gradient: 'bg-gradient-to-br from-brand-primary-600 via-brand-primary-700 to-brand-secondary-600 text-white'
  };

  return (
    <Section
      as="section"
      spacing="xl"
      className={`relative ${variants[variant]} overflow-hidden`}
    >
      {/* Background Image Overlay */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Hero Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-brand-secondary-400/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <Container size="lg" className="relative z-10">
        <Center>
          <VStack spacing="xl" align="center" className="max-w-4xl text-center">
            
            {/* Badge */}
            <Badge 
              variant="secondary" 
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              🏆 Loja Oficial no Mercado Livre
            </Badge>
            
            {/* Main Title */}
            <VStack spacing="md" align="center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                {title}
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            </VStack>
            
            {/* Action Buttons */}
            <HStack spacing="md" className="flex-wrap justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-brand-primary-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.open(ctaLink, '_blank')}
              >
                🛒 {ctaText}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                onClick={() => {
                  const element = document.getElementById('produtos-destaque');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                📦 Ver Produtos
              </Button>
            </HStack>
            
            {/* Features */}
            <HStack spacing="lg" className="flex-wrap justify-center text-sm text-white/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Frete Grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>Entrega Rápida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Compra Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Melhor Preço</span>
              </div>
            </HStack>
            
          </VStack>
        </Center>
      </Container>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-16 fill-white"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
          opacity=".25"
        ></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
          opacity=".5"
        ></path>
        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
        ></path>
        </svg>
      </div>
    </Section>
  );
}