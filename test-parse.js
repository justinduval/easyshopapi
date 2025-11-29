import fs from 'fs';

const html = fs.readFileSync('page-sample.html', 'utf8');

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

const products = parseProductsFromHTML(html);
console.log('Products found:', products.length);
console.log('\nFirst 3 products:');
products.slice(0, 3).forEach((p, i) => {
  console.log(`\n${i + 1}. ${p.name}`);
  console.log(`   Ref: ${p.reference}`);
  console.log(`   Price: ${p.price}€`);
  console.log(`   Stock: ${p.stock}`);
});
