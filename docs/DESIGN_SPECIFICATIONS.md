# 🎨 Peepers Redesign - Especificações de Design

## 📋 Visão Geral

Este documento detalha as especificações completas para o redesign da aplicação Peepers, transformando-a em uma vitrine profissional de produtos que direciona para o Mercado Livre. O design é inspirado no template TechShed e harmonizado com as cores do logo Peepers.

## 🎯 Objetivos do Redesign

- **Vitrine de Produtos**: Exibir produtos de forma atrativa com redirecionamento para o Mercado Livre
- **Identidade Visual**: Usar as cores do logo Peepers (verde e dourado) para criar coesão visual
- **Experiência do Usuário**: Interface moderna, responsiva e intuitiva
- **Conversão**: Facilitar o direcionamento dos usuários para a loja no Mercado Livre

## 🎨 Paleta de Cores

### Cores Primárias (do Logo Peepers)
```css
:root {
  /* Verde Sapo (cores primárias) */
  --primary: #0D6832;           /* Verde principal */
  --primary-light: #15884A;     /* Verde claro */
  --primary-dark: #074D20;      /* Verde escuro */
  
  /* Amarelo/Dourado Coroa (cores secundárias) */
  --secondary: #E0C81A;         /* Dourado principal */
  --secondary-light: #F7DB32;   /* Dourado claro */
  --secondary-dark: #C4AF10;    /* Dourado escuro */
  
  /* Cores de apoio */
  --accent: #DC2626;            /* Vermelho para promoções */
  --background: #ffffff;        /* Fundo principal */
  --foreground: #111827;        /* Texto principal */
  --muted: #f3f4f6;            /* Áreas secundárias */
  --muted-foreground: #6b7280;  /* Texto secundário */
}
```

### Uso das Cores
- **Verde**: Buttons primários, links, elementos de navegação
- **Dourado**: Buttons secundários, destaques especiais, badges premium
- **Vermelho**: Tags de promoção, alertas, descontos
- **Neutros**: Textos, fundos, bordas

## 🏗️ Arquitetura de Componentes

### 1. Header Redesenhado
```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO]  [Busca.............]  [Menu] [Loja ML] [Carrinho]   │
└─────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Logo Peepers (140x40px)
- Barra de pesquisa centralizada
- Menu de navegação (Produtos, Categorias)
- Link destacado "Nossa Loja ML" (verde)
- Ícones de usuário e carrinho

### 2. Hero Section
```
┌─────────────────────────────────────────────────────────────┐
│  [BADGE OFERTA]                           [IMAGEM]          │
│  Título Principal                         PRODUTO           │
│  Subtítulo explicativo                    DESTAQUE          │
│  [BOTÃO VER PRODUTOS]                                       │
└─────────────────────────────────────────────────────────────┘
```

**Características:**
- Fundo gradiente verde claro
- Badge vermelha "MELHORES PREÇOS"
- Título impactante
- CTA verde proeminente
- Imagem de produto em destaque

### 3. Grid de Categorias
```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ 💻  │ │ 📱  │ │ 📱  │ │ 🎧  │ │ ⌚  │ │ 🔍  │
│Elet.│ │Cel. │ │Tab. │ │Áud. │ │Ace. │ │Tod. │
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

**Layout:**
- 3 colunas mobile, 6 colunas desktop
- Círculos com ícones (verde claro)
- Hover effect (verde mais escuro)
- Texto centralizado abaixo

### 4. Card de Produto
```
┌─────────────────────────────┐
│ [PROMO]      [♡]           │
│                             │
│      IMAGEM PRODUTO         │
│                             │
├─────────────────────────────┤
│ Título do Produto (2 linhas)│
│ R$ 99,90  ̶R̶$̶ ̶1̶2̶9̶,̶9̶0̶      │
│ [Ver no Mercado Livre]      │
└─────────────────────────────┘
```

**Especificações:**
- Proporção 3:4 (aspecto de card)
- Tag vermelha "PROMOÇÃO" (quando aplicável)
- Imagem quadrada centralizada
- Título limitado a 2 linhas
- Preço em destaque com riscado opcional
- Botão dourado "Ver no Mercado Livre"
- Hover: sombra sutil

### 5. Banners Promocionais
```
┌─────────────────┐ ┌─────────────────┐
│     BANNER      │ │     BANNER      │
│     VERDE       │ │    DOURADO      │
│  Até 30% off    │ │  Frete Grátis   │
│ [Ver ofertas]   │ │ [Ver produtos]  │
└─────────────────┘ └─────────────────┘
```

**Layouts:**
- Banner 1: Gradiente verde, texto branco, CTA branco
- Banner 2: Gradiente dourado, texto preto, CTA branco
- Responsivo: empilhados no mobile

## 📱 Breakpoints Responsivos

### Mobile (< 768px)
- Header compacto com menu hambúrguer
- Hero section empilhado
- Categorias 3 colunas
- Produtos 2 colunas
- Banners empilhados

### Tablet (768px - 1024px)
- Header com todos elementos
- Hero section lado a lado
- Categorias 6 colunas
- Produtos 3 colunas
- Banners lado a lado

### Desktop (> 1024px)
- Layout completo expandido
- Produtos 4-5 colunas
- Espaçamentos maiores
- Hover effects completos

## 🛍️ Adaptações para Mercado Livre

### 1. Links e Redirecionamentos
- Todos os produtos redirecionam para ML via `product.permalink`
- Botão principal "Ver no Mercado Livre" em destaque
- Links abrem em nova aba (`target="_blank"`)
- UTM tracking para análise

### 2. Informações de Compra
- Badge "Vendedor Oficial ML"
- Informações de frete pelo ML
- Opções de parcelamento
- Garantia do Mercado Livre

### 3. Seção Mercado Livre
```
┌─────────────────────────────────────────────────────────────┐
│               [LOGO MERCADO LIVRE]                          │
│          Somos vendedor oficial no Mercado Livre           │
│     Descrição sobre segurança e facilidade de compra       │
│          [Visitar nossa loja no Mercado Livre]             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configurações Técnicas

### Tailwind CSS
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#0D6832',
        light: '#15884A',
        dark: '#074D20',
      },
      secondary: {
        DEFAULT: '#E0C81A',
        light: '#F7DB32',
        dark: '#C4AF10',
      },
      accent: '#DC2626',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
  },
}
```

### Fontes
- **Primária**: Inter (Google Fonts)
- **Tamanhos**: Base 16px, escala modular
- **Pesos**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

## 📄 Estrutura de Páginas

### 1. Homepage
- Header
- Hero Section
- Grid de Categorias
- Produtos em Destaque
- Banners Promocionais
- Novidades
- Seção Mercado Livre
- Newsletter
- Footer

### 2. Página de Produtos
- Header
- Breadcrumbs
- Filtros (lateral)
- Grid de produtos
- Paginação
- Footer

### 3. Detalhes do Produto (futura)
- Header
- Galeria de imagens
- Informações detalhadas
- Botão ML em destaque
- Produtos relacionados
- Footer

## 🎭 Estados e Interações

### Hover Effects
- Cards: sombra sutil (`shadow-md`)
- Botões: mudança de cor suave
- Links: sublinhado animado
- Categorias: background mais escuro

### Loading States
- Skeleton screens para produtos
- Spinners para ações
- Placeholders para imagens

### Empty States
- Ilustrações amigáveis
- Mensagens claras
- CTAs para navegação

## 🚀 Performance

### Otimizações
- Lazy loading para imagens
- WebP com fallback
- Compressão de assets
- Bundle splitting

### SEO
- Meta tags dinâmicas
- Structured data para produtos
- Sitemap automático
- Open Graph tags

## 📊 Métricas de Sucesso

### KPIs
- Click-through rate para ML
- Tempo na página
- Taxa de rejeição
- Conversões para ML

### Analytics
- Google Analytics 4
- Eventos customizados
- Funnels de conversão
- Heatmaps (futura)

## 🔄 Fases de Implementação

### ✅ Fase 1: Fundação (COMPLETA)

1. ✅ Configurar Tailwind CSS v4 com design system
2. ✅ Implementar Header responsivo
3. ✅ Criar componentes base (ProductCard, LoadingStates)
4. ✅ Sistema de navegação e roteamento

### ✅ Fase 2: Performance (COMPLETA)

1. ✅ Lazy loading de componentes (React.lazy)
2. ✅ Code splitting por rotas
3. ✅ Otimização de imagens (Next.js Image)
4. ✅ Cache inteligente (Redis + TTL)
5. ✅ Bundle optimization (webpack splitChunks)

### 🚧 Fase 3: Design System (EM ANDAMENTO)

1. 🔄 Implementar Design System completo
2. 🔄 Padronizar componentes UI
3. 🔄 Sistema de tokens de design
4. 🔄 Documentação de componentes (Storybook)

### 📋 Fase 4: Admin Panel (FUTURO)

1. ⏳ Dashboard administrativo
2. ⏳ Gestão de produtos
3. ⏳ Analytics e métricas
4. ⏳ Sistema de notificações

---

**Última atualização**: 17 de setembro de 2025  
**Versão**: 2.0  
**Status**: Fases 1-2 completas, Fase 3 iniciando
