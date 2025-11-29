import https from 'https';
import fs from 'fs';

const cookie = 'coi_session=eyJpdiI6ImE2clo0VUp5S1dnWVovWXQ5NGhCRmc9PSIsInZhbHVlIjoiODk1NFdtbG1YK3hTU1FkMUhKcFFZU2UyK1paVElWeGw5RHFZcG5wWElvWmJvWUZ1cXljMWNRdCtTYU9wcXpXbU1xdURMdEx2eDN5Y2hSRUJXYjlPejdPQk5JdWNWT1cvdGM5UVhQN2JWc3ZqTUpoZU55bXpldDA5eGE2WEszNXQiLCJtYWMiOiIyMGExMTM0YjEzMTVhM2JlZGZkMTBmNWQ5NTg4MzY4NzU0ZWQzZWI4NGQ1NjA4Yzg3MzM1YzViMWQ3NTAwMzk3IiwidGFnIjoiIn0%3D';

const baseUrl = 'https://coi.re/catalogue/produits?is_active=1&in_stock=1&has_positive_price=1&category_id=5&page=';

async function fetchPage(pageNumber) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + pageNumber;
    console.log(`Fetching page ${pageNumber}...`);

    const options = {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`Page ${pageNumber} fetched successfully. Products count: ${jsonData.data?.length || 0}`);
          resolve(jsonData);
        } catch (error) {
          console.error(`Error parsing JSON for page ${pageNumber}:`, error.message);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error(`Error fetching page ${pageNumber}:`, error.message);
      reject(error);
    });
  });
}

async function fetchAllPages() {
  const allProducts = [];

  for (let page = 1; page <= 6; page++) {
    try {
      const result = await fetchPage(page);

      if (result.data && Array.isArray(result.data)) {
        allProducts.push(...result.data);
      }

      // Wait a bit between requests to be polite
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error.message);
    }
  }

  return allProducts;
}

async function main() {
  console.log('Starting to fetch products...\n');

  const products = await fetchAllPages();

  console.log(`\nTotal products fetched: ${products.length}`);

  // Save to file
  const outputFile = 'products-coire.json';
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
  console.log(`\nProducts saved to ${outputFile}`);

  // Save a summary
  const summary = {
    total_products: products.length,
    fetched_at: new Date().toISOString(),
    source: 'https://coi.re/catalogue/produits',
    category_id: 5,
    pages: 6
  };

  fs.writeFileSync('products-summary.json', JSON.stringify(summary, null, 2));
  console.log('Summary saved to products-summary.json');
}

main().catch(console.error);
