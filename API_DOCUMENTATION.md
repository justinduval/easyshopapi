# Documentation API EasyShop

Cette documentation décrit comment utiliser l'API du backoffice EasyShop depuis votre site distant.

## Configuration Requise

### 1. Variables d'environnement à configurer

Dans votre fichier `.env` du backoffice, assurez-vous d'avoir :

```env
# Clé secrète pour authentifier les requêtes API
API_SECRET_KEY=your_secret_api_key_min_32_chars

# L'origine de votre site distant autorisé à faire des requêtes
ALLOWED_ORIGIN=https://your-astro-site.pages.dev
```

### 2. Configuration de votre site distant

Dans votre site distant, ajoutez :

```env
# URL de base de votre API backoffice
VITE_API_URL=https://votre-backoffice.com
# La même clé API que dans le backoffice
VITE_API_KEY=your_secret_api_key_min_32_chars
```

## Sécurité

L'API utilise plusieurs mécanismes de sécurité :

- **Authentification par clé API** : Chaque requête doit inclure le header `X-API-Key`
- **CORS** : Seule l'origine configurée dans `ALLOWED_ORIGIN` peut faire des requêtes
- **Rate Limiting** : Maximum 100 requêtes par minute par IP

## Endpoints Disponibles

### Base URL

```
https://votre-backoffice.com/api
```

---

## 1. Produits

### Récupérer la liste des produits

**Endpoint :** `GET /api/products`

**Headers requis :**
```
X-API-Key: your_secret_api_key_min_32_chars
```

**Paramètres de requête (query params) :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `category` | string | - | Slug de la catégorie pour filtrer |
| `status` | string | `published` | Statut des produits (`published` ou `draft`) |
| `page` | number | `1` | Numéro de page |
| `limit` | number | `20` | Nombre de produits par page |

**Exemple de requête :**

```javascript
const response = await fetch(
  'https://votre-backoffice.com/api/products?category=batteries&page=1&limit=10',
  {
    headers: {
      'X-API-Key': 'your_secret_api_key_min_32_chars'
    }
  }
);

const data = await response.json();
```

**Réponse :**

```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "BAT-001",
      "name": "Batterie 12V",
      "slug": "batterie-12v",
      "description": "Description du produit",
      "price_ht": 99.99,
      "tva_rate": 20,
      "price_ttc": 119.99,
      "stock_quantity": 50,
      "stock_status": "in_stock",
      "images": ["url1", "url2"],
      "category": {
        "id": "uuid",
        "name": "Batteries"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### Récupérer les détails d'un produit

**Endpoint :** `GET /api/products/{slug}`

**Headers requis :**
```
X-API-Key: your_secret_api_key_min_32_chars
```

**Paramètres :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `slug` | string | Le slug du produit (ex: `batterie-12v`) |

**Exemple de requête :**

```javascript
const response = await fetch(
  'https://votre-backoffice.com/api/products/batterie-12v',
  {
    headers: {
      'X-API-Key': 'your_secret_api_key_min_32_chars'
    }
  }
);

const product = await response.json();
```

**Réponse :**

```json
{
  "id": "uuid",
  "reference": "BAT-001",
  "name": "Batterie 12V",
  "slug": "batterie-12v",
  "description": "Description complète",
  "price_ht": 99.99,
  "tva_rate": 20,
  "price_ttc": 119.99,
  "stock_quantity": 50,
  "stock_status": "in_stock",
  "images": ["url1", "url2"],
  "meta_description": "Meta description SEO",
  "category": {
    "id": "uuid",
    "name": "Batteries"
  },
  "reviews": [
    {
      "id": "uuid",
      "customer_name": "Jean Dupont",
      "rating": 5,
      "comment": "Excellent produit",
      "vendor_response": "Merci pour votre retour",
      "vendor_response_date": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-10T14:20:00Z"
    }
  ],
  "average_rating": 4.5,
  "reviews_count": 12
}
```

---

## 2. Catégories

### Récupérer la liste des catégories

**Endpoint :** `GET /api/categories`

**Headers requis :**
```
X-API-Key: your_secret_api_key_min_32_chars
```

**Exemple de requête :**

```javascript
const response = await fetch(
  'https://votre-backoffice.com/api/categories',
  {
    headers: {
      'X-API-Key': 'your_secret_api_key_min_32_chars'
    }
  }
);

const categories = await response.json();
```

**Réponse :**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Batteries",
      "slug": "batteries",
      "description": "Description de la catégorie",
      "products_count": 45
    },
    {
      "id": "uuid",
      "name": "Lubrifiants",
      "slug": "lubrifiants",
      "description": "Description de la catégorie",
      "products_count": 32
    }
  ]
}
```

---

## 3. Avis clients

### Récupérer les avis d'un produit

**Endpoint :** `GET /api/reviews/{productId}`

**Headers requis :**
```
X-API-Key: your_secret_api_key_min_32_chars
```

**Paramètres de requête (query params) :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `status` | string | `approved` | Statut des avis (`approved`, `pending`, `rejected`) |

**Exemple de requête :**

```javascript
const response = await fetch(
  'https://votre-backoffice.com/api/reviews/product-uuid?status=approved',
  {
    headers: {
      'X-API-Key': 'your_secret_api_key_min_32_chars'
    }
  }
);

const reviews = await response.json();
```

**Réponse :**

```json
{
  "data": [
    {
      "id": "uuid",
      "customer_name": "Jean Dupont",
      "rating": 5,
      "comment": "Excellent produit",
      "vendor_response": "Merci !",
      "vendor_response_date": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-10T14:20:00Z"
    }
  ],
  "average_rating": 4.5,
  "count": 12
}
```

---

### Créer un nouvel avis

**Endpoint :** `POST /api/reviews`

**Headers requis :**
```
X-API-Key: your_secret_api_key_min_32_chars
Content-Type: application/json
```

**Corps de la requête :**

```json
{
  "productId": "uuid-du-produit",
  "customerName": "Jean Dupont",
  "customerEmail": "jean.dupont@example.com",
  "rating": 5,
  "comment": "Excellent produit, je recommande !",
  "orderId": "uuid-de-commande" // Optionnel
}
```

**Exemple de requête :**

```javascript
const response = await fetch(
  'https://votre-backoffice.com/api/reviews',
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'your_secret_api_key_min_32_chars',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      productId: 'uuid-du-produit',
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@example.com',
      rating: 5,
      comment: 'Excellent produit !'
    })
  }
);

const result = await response.json();
```

**Réponse (201 Created) :**

```json
{
  "success": true,
  "message": "Review submitted successfully. It will be published after moderation.",
  "review_id": "uuid-de-lavis"
}
```

**Validation :**

- `productId` : UUID valide (requis)
- `customerName` : 1-255 caractères (requis)
- `customerEmail` : Email valide (requis)
- `rating` : Nombre entier entre 1 et 5 (requis)
- `comment` : Minimum 1 caractère (requis)
- `orderId` : UUID valide (optionnel)

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| `200` | Succès |
| `201` | Créé avec succès |
| `400` | Requête invalide (données manquantes ou incorrectes) |
| `401` | Non autorisé (clé API invalide) |
| `404` | Ressource non trouvée |
| `429` | Trop de requêtes (rate limit dépassé) |
| `500` | Erreur serveur |

**Format d'erreur :**

```json
{
  "error": "Message d'erreur",
  "details": [] // Optionnel : détails de validation
}
```

---

## Exemples d'intégration

### React / Next.js

```typescript
// lib/api.ts
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export async function getProducts(params?: {
  category?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(
    `${API_URL}/api/products?${searchParams}`,
    {
      headers: { 'X-API-Key': API_KEY }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function getProductBySlug(slug: string) {
  const response = await fetch(
    `${API_URL}/api/products/${slug}`,
    {
      headers: { 'X-API-Key': API_KEY }
    }
  );

  if (!response.ok) {
    throw new Error('Product not found');
  }

  return response.json();
}

export async function submitReview(data: {
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
}) {
  const response = await fetch(
    `${API_URL}/api/reviews`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit review');
  }

  return response.json();
}
```

### Astro

```typescript
// src/pages/products/[slug].astro
---
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const { slug } = Astro.params;

const response = await fetch(
  `${API_URL}/api/products/${slug}`,
  {
    headers: { 'X-API-Key': API_KEY }
  }
);

if (!response.ok) {
  return Astro.redirect('/404');
}

const product = await response.json();
---

<html>
  <head>
    <title>{product.name}</title>
    <meta name="description" content={product.meta_description} />
  </head>
  <body>
    <h1>{product.name}</h1>
    <p>Prix TTC : {product.price_ttc}€</p>
    <p>{product.description}</p>

    <h2>Avis ({product.reviews_count})</h2>
    <p>Note moyenne : {product.average_rating}/5</p>

    {product.reviews.map(review => (
      <div>
        <strong>{review.customer_name}</strong> - {review.rating}/5
        <p>{review.comment}</p>
      </div>
    ))}
  </body>
</html>
```

### Vue.js

```typescript
// composables/useProducts.ts
export function useProducts() {
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const products = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchProducts(category?: string) {
    loading.value = true;
    error.value = null;

    try {
      const url = new URL(`${API_URL}/api/products`);
      if (category) url.searchParams.set('category', category);

      const response = await fetch(url, {
        headers: { 'X-API-Key': API_KEY }
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      products.value = data.data;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { products, loading, error, fetchProducts };
}
```

---

## Notes importantes

1. **Sécurité de la clé API** : Ne jamais exposer votre clé API dans le code frontend public. Utilisez des variables d'environnement et considérez l'utilisation d'un proxy backend pour vos requêtes API.

2. **Cache** : Pour améliorer les performances, considérez la mise en cache des réponses côté client avec des outils comme React Query, SWR ou le système de cache d'Astro.

3. **Rate Limiting** : L'API limite à 100 requêtes par minute par IP. Assurez-vous de gérer correctement les erreurs 429.

4. **CORS** : Assurez-vous que l'URL de votre site distant est correctement configurée dans `ALLOWED_ORIGIN`.

5. **Images** : Les URLs des images proviennent de votre bucket Cloudflare R2 configuré dans le backoffice.

---

## Support

Pour toute question ou problème concernant l'API, consultez les logs du backoffice ou contactez votre administrateur système.
