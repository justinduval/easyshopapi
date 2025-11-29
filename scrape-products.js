import fs from 'fs';

const cookie = 'tarteaucitron=!gtag=true; _ga_5JC9XMG919=GS1.1.1763918845.3.1.1763920497.59.0.0; _ga=GA1.1.238665400.1763562021; coi_session=eyJpdiI6Iktyd3ZkbFZMLzhFdkpxdXgrM2ljRVE9PSIsInZhbHVlIjoiYUVsbTJ5c1lMNEdRejNoRlVqM3d4WjgzQ0ZTSDRUdWphUXJ0Zjl3TzNlZm5YSzhOMys2WUZMamg3Z0JCeHVGOWxFb3lTVTl4UFRtdHlmWlVBUHNlb1dLNWVkVnVDTGpMOVE2OEdjTjBYRlFQaFhkc3IzakJ4a2hhSEw1dnozc0kiLCJtYWMiOiJjMzcwOGMxNDcxODdkYTkyZmYwNmY1YWQ0YzEwMTM2Yzg1Zjk1ZmExNGYyZTkyMzNjNGFlOTZkOWVhOTVlOWRhIiwidGFnIjoiIn0%3D';

const baseUrl = 'https://coi.re/catalogue/produits?is_active=1&in_stock=1&has_positive_price=1&category_id=5&page=';

async function fetchPage(pageNumber) {
  try {
    const url = baseUrl + pageNumber;
    console.log(`Fetching page ${pageNumber}...`);

    const response = await fetch(url, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
        'Referer': pageNumber > 1 ? `https://coi.re/catalogue/produits?is_active=1&in_stock=1&has_positive_price=1&category_id=5&page=${pageNumber - 1}` : 'https://coi.re/',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    const html = await response.text();
    return html;
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error.message);
    throw error;
  }
}

function parseProductsFromHTML(html) {
  const products = [];

  // Split by product cards
  const productCardRegex = /<div class="card product-card">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;

  let match;
  while ((match = productCardRegex.exec(html)) !== null) {
    const block = match[0];

    try {
      // Extract product name and URL
      const nameMatch = block.match(/<a href="(https:\/\/coi\.re\/produits\/[^"]+)" class="product-name[^"]*">\s*([\s\S]*?)\s*<\/a>/i);
      const name = nameMatch ? nameMatch[2].trim().replace(/\s+/g, ' ') : null;
      const url = nameMatch ? nameMatch[1] : null;

      // Extract product ID from URL
      const idMatch = url ? url.match(/\/produits\/([^\/]+)/) : null;
      const slug = idMatch ? idMatch[1] : null;

      // Extract internal reference
      const refMatch = block.match(/<span class="product-ref">\s*Réf\.\s*:\s*([^<]+)/i);
      const reference = refMatch ? refMatch[1].trim() : null;

      // Extract supplier reference
      const supplierRefMatch = block.match(/<span class="product-ref">\s*Réf\. fourn\.\s*:\s*([^<]+)/i);
      const supplier_reference = supplierRefMatch ? supplierRefMatch[1].trim() : null;

      // Extract price
      const priceMatch = block.match(/<span class="effective-price">([\d\s,]+)\s*€/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.')) : null;

      // Extract image
      const imageMatch = block.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
      const image = imageMatch ? imageMatch[1] : null;

      // Extract stock
      const stockMatch = block.match(/<span class="product-stock">\s*([\d]+)\s*unités en stock/i);
      const stock = stockMatch ? parseInt(stockMatch[1]) : null;

      if (name && slug) {
        products.push({
          slug,
          name,
          reference,
          supplier_reference,
          price,
          stock,
          image,
          source_url: url
        });
      }
    } catch (error) {
      console.error('Error parsing product block:', error.message);
    }
  }

  return products;
}

async function fetchAllPages() {
  const allProducts = [];

  for (let page = 1; page <= 6; page++) {
    try {
      const html = await fetchPage(page);
      const products = parseProductsFromHTML(html);

      console.log(`Page ${page}: Found ${products.length} products`);
      allProducts.push(...products);

      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error.message);
    }
  }

  return allProducts;
}

async function main() {
  console.log('Starting to scrape products...\n');

  const products = await fetchAllPages();

  console.log(`\nTotal products scraped: ${products.length}`);

  // Save to file
  const outputFile = 'products-coire.json';
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
  console.log(`\nProducts saved to ${outputFile}`);

  // Save a summary
  const summary = {
    total_products: products.length,
    scraped_at: new Date().toISOString(),
    source: 'https://coi.re/catalogue/produits',
    category_id: 5,
    pages: 6,
    sample_product: products[0] || null
  };

  fs.writeFileSync('products-summary.json', JSON.stringify(summary, null, 2));
  console.log('Summary saved to products-summary.json');
}

main().catch(console.error);
