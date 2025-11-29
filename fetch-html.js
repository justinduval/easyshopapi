import https from 'https';
import fs from 'fs';

const cookie = 'tarteaucitron=!gtag=true; _ga_5JC9XMG919=GS1.1.1763918845.3.1.1763920497.59.0.0; _ga=GA1.1.238665400.1763562021; coi_session=eyJpdiI6Iktyd3ZkbFZMLzhFdkpxdXgrM2ljRVE9PSIsInZhbHVlIjoiYUVsbTJ5c1lMNEdRejNoRlVqM3d4WjgzQ0ZTSDRUdWphUXJ0Zjl3TzNlZm5YSzhOMys2WUZMamg3Z0JCeHVGOWxFb3lTVTl4UFRtdHlmWlVBUHNlb1dLNWVkVnVDTGpMOVE2OEdjTjBYRlFQaFhkc3IzakJ4a2hhSEw1dnozc0kiLCJtYWMiOiJjMzcwOGMxNDcxODdkYTkyZmYwNmY1YWQ0YzEwMTM2Yzg1Zjk1ZmExNGYyZTkyMzNjNGFlOTZkOWVhOTVlOWRhIiwidGFnIjoiIn0%3D';

const url = 'https://coi.re/catalogue/produits?is_active=1&in_stock=1&has_positive_price=1&category_id=5&page=1';

const options = {
  headers: {
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
};

https.get(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    fs.writeFileSync('page-sample.html', data);
    console.log('HTML saved to page-sample.html');
    console.log('HTML length:', data.length);
  });
}).on('error', (error) => {
  console.error('Error:', error.message);
});
