# Documentation API EasyShop

API REST sécurisée pour le site Astro e-commerce.

## Sécurité

### Authentification
Toutes les requêtes doivent inclure l'API Key dans le header :

```
X-API-Key: your_secret_api_key
```

### CORS
Le serveur n'accepte que les requêtes provenant du domaine configuré dans `ALLOWED_ORIGIN`.

### Rate Limiting
- **Limite** : 100 requêtes par minute par IP
- **Réponse si dépassé** : HTTP 429 Too Many Requests

## Endpoints

### 1. Liste des produits

```
GET /api/products
```

**Query Parameters:**
- `category` (optional) : Slug de la catégorie
- `status` (optional, default: "published") : Statut des produits ("published" ou "draft")
- `page` (optional, default: 1) : Numéro de page
- `limit` (optional, default: 20) : Nombre de produits par page

**Exemple de requête:**
```bash
curl -H "X-API-Key: your_key" \
  "https://api.example.com/api/products?category=pneus&page=1&limit=10"
```

**Réponse:**
```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "PN-MICH-001",
      "name": "Pneu Michelin Pilot Road 5 120/70 ZR17",
      "slug": "pneu-michelin-pilot-road-5-120-70-zr17",
      "description": "Pneu sport-touring haute performance...",
      "price_ht": 145.90,
      "tva_rate": 20.00,
      "price_ttc": 175.08,
      "stock_quantity": 12,
      "stock_status": "available",
      "images": [
        "https://cdn.r2.dev/products/image1.jpg"
      ],
      "category": {
        "id": "uuid",
        "name": "Pneus"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### 2. Détail d'un produit

```
GET /api/products/:slug
```

**Paramètres d'URL:**
- `slug` : Slug du produit

**Exemple de requête:**
```bash
curl -H "X-API-Key: your_key" \
  "https://api.example.com/api/products/pneu-michelin-pilot-road-5-120-70-zr17"
```

**Réponse:**
```json
{
  "id": "uuid",
  "reference": "PN-MICH-001",
  "name": "Pneu Michelin Pilot Road 5 120/70 ZR17",
  "slug": "pneu-michelin-pilot-road-5-120-70-zr17",
  "description": "Pneu sport-touring haute performance...",
  "price_ht": 145.90,
  "tva_rate": 20.00,
  "price_ttc": 175.08,
  "stock_quantity": 12,
  "stock_status": "available",
  "images": [
    "https://cdn.r2.dev/products/image1.jpg"
  ],
  "meta_description": "Pneu Michelin haute performance...",
  "category": {
    "id": "uuid",
    "name": "Pneus"
  },
  "reviews": [
    {
      "id": "uuid",
      "customer_name": "Jean Dupont",
      "rating": 5,
      "comment": "Excellent produit !",
      "vendor_response": "Merci pour votre retour !",
      "vendor_response_date": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-10T14:20:00Z"
    }
  ],
  "average_rating": 4.5,
  "reviews_count": 12
}
```

### 3. Liste des catégories

```
GET /api/categories
```

**Exemple de requête:**
```bash
curl -H "X-API-Key: your_key" \
  "https://api.example.com/api/categories"
```

**Réponse:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Pneus",
      "slug": "pneus",
      "description": "Pneus moto toutes marques et dimensions",
      "products_count": 24
    },
    {
      "id": "uuid",
      "name": "Batteries",
      "slug": "batteries",
      "description": "Batteries moto 12V haute performance",
      "products_count": 15
    }
  ]
}
```

### 4. Avis d'un produit

```
GET /api/reviews/:productId
```

**Paramètres d'URL:**
- `productId` : UUID du produit

**Query Parameters:**
- `status` (optional, default: "approved") : Statut des avis

**Exemple de requête:**
```bash
curl -H "X-API-Key: your_key" \
  "https://api.example.com/api/reviews/uuid-product"
```

**Réponse:**
```json
{
  "data": [
    {
      "id": "uuid",
      "customer_name": "Jean Dupont",
      "rating": 5,
      "comment": "Excellent produit !",
      "vendor_response": "Merci !",
      "vendor_response_date": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-10T14:20:00Z"
    }
  ],
  "average_rating": 4.5,
  "count": 12
}
```

### 5. Créer un avis

```
POST /api/reviews
```

**Body (JSON):**
```json
{
  "productId": "uuid",
  "customerName": "Jean Dupont",
  "customerEmail": "jean@example.com",
  "rating": 5,
  "comment": "Excellent produit, je recommande !",
  "orderId": "uuid-optional"
}
```

**Exemple de requête:**
```bash
curl -X POST \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "uuid",
    "customerName": "Jean Dupont",
    "customerEmail": "jean@example.com",
    "rating": 5,
    "comment": "Excellent produit !"
  }' \
  "https://api.example.com/api/reviews"
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Review submitted successfully. It will be published after moderation.",
  "review_id": "uuid"
}
```

## Codes de statut HTTP

| Code | Description |
|------|-------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 400  | Requête invalide |
| 401  | Non autorisé (API Key invalide) |
| 404  | Ressource non trouvée |
| 429  | Trop de requêtes (rate limit dépassé) |
| 500  | Erreur serveur |

## Exemple d'intégration Astro

```typescript
// src/lib/api.ts
const API_URL = 'https://api.example.com';
const API_KEY = import.meta.env.API_KEY;

async function fetchAPI(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getProducts(category?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  return fetchAPI(`/api/products?${params.toString()}`);
}

export async function getProduct(slug: string) {
  return fetchAPI(`/api/products/${slug}`);
}

export async function getCategories() {
  return fetchAPI('/api/categories');
}
```

## Notes importantes

- Les avis soumis via l'API sont créés avec le statut "pending" et nécessitent une modération manuelle dans le backoffice
- Seuls les produits avec `status = "published"` sont retournés par l'API
- Les images sont servies depuis Cloudflare R2 CDN
- Tous les prix sont en euros (€)
