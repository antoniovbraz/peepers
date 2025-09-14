#!/usr/bin/env node

/**
 * Link Crawler - Detecta links quebrados no projeto Peepers
 * Uso: node scripts/crawl-links.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configurações
const BASE_URL = 'http://localhost:3000';
const START_URLS = [
  'http://localhost:3000',
  'http://localhost:3000/produtos',
  'http://localhost:3000/admin'
];

const visited = new Set();
const brokenLinks = [];
const allLinks = new Set();

// Função para extrair links de uma página HTML
function extractLinks(html, baseUrl) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const links = [];

  // Extrair links de <a> tags
  const anchorTags = document.querySelectorAll('a[href]');
  anchorTags.forEach(tag => {
    const href = tag.getAttribute('href');
    if (href) {
      links.push(href);
    }
  });

  // Extrair links de Next.js Link components (se renderizados)
  // Nota: Isso é limitado pois o Link do Next.js renderiza como <a>

  return links;
}

// Função para resolver URLs relativas
function resolveUrl(url, baseUrl) {
  if (url.startsWith('http')) {
    return url;
  }

  if (url.startsWith('/')) {
    const urlObj = new URL(baseUrl);
    return `${urlObj.protocol}//${urlObj.host}${url}`;
  }

  if (url.startsWith('#')) {
    return `${baseUrl}${url}`;
  }

  // URLs relativas
  const baseUrlObj = new URL(baseUrl);
  const resolved = new URL(url, baseUrl);
  return resolved.href;
}

// Função para verificar se URL é interna
function isInternalUrl(url) {
  return url.includes('localhost:3000') || url.startsWith('/');
}

// Função para testar uma URL
async function testUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      timeout: 5000
    });

    return {
      url,
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    return {
      url,
      status: 0,
      error: error.message,
      ok: false
    };
  }
}

// Função principal de crawling
async function crawl(url, depth = 0, maxDepth = 2) {
  if (visited.has(url) || depth > maxDepth) {
    return;
  }

  visited.add(url);
  console.log(`🔍 Crawling: ${url} (depth: ${depth})`);

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extrair links
    const links = extractLinks(html, url);

    // Processar cada link
    for (const link of links) {
      const resolvedUrl = resolveUrl(link, url);

      if (!allLinks.has(resolvedUrl)) {
        allLinks.add(resolvedUrl);

        // Testar apenas URLs internas
        if (isInternalUrl(resolvedUrl)) {
          const result = await testUrl(resolvedUrl);

          if (!result.ok) {
            brokenLinks.push({
              source: url,
              destination: resolvedUrl,
              status: result.status,
              error: result.error
            });
            console.log(`❌ Broken: ${resolvedUrl} (${result.status})`);
          } else {
            console.log(`✅ OK: ${resolvedUrl} (${result.status})`);

            // Crawl recursivo (limitado)
            if (depth < maxDepth && !resolvedUrl.includes('#')) {
              await crawl(resolvedUrl, depth + 1, maxDepth);
            }
          }
        }
      }
    }

  } catch (error) {
    console.log(`🚫 Error crawling ${url}: ${error.message}`);
    brokenLinks.push({
      source: url,
      destination: url,
      status: 0,
      error: error.message
    });
  }
}

// Função principal
async function main() {
  console.log('🚀 Starting link crawler...\n');

  // Verificar se o servidor está rodando
  try {
    await fetch(BASE_URL);
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start with: npm run dev\n');
    process.exit(1);
  }

  // Crawl das URLs iniciais
  for (const url of START_URLS) {
    await crawl(url);
  }

  // Resultados
  console.log('\n📊 Results:');
  console.log(`Total URLs found: ${allLinks.size}`);
  console.log(`Broken links: ${brokenLinks.length}`);

  if (brokenLinks.length > 0) {
    console.log('\n❌ Broken Links:');
    brokenLinks.forEach(link => {
      console.log(`  ${link.source} → ${link.destination} (${link.status})`);
    });
  } else {
    console.log('\n✅ No broken links found!');
  }

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    totalUrls: allLinks.size,
    brokenLinks: brokenLinks.length,
    details: brokenLinks,
    allLinks: Array.from(allLinks)
  };

  const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'link-crawler-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n💾 Report saved to: ${reportPath}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { crawl, testUrl, extractLinks };