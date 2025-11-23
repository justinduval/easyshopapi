Je veux créer un backoffice e-commerce pour pièces de rechange moto avec SvelteKit et PostgreSQL.

**CONTEXTE**
- ~160 produits répartis sur 3 catégories
- Pièces de rechange (pneus, batteries, etc.) - une référence = un article
- Pas de variantes, pas d'expédition (retrait sur RDV)
- Photos stockées sur Cloudflare R2 CDN
- API consommée par site Astro hébergé sur Cloudflare Pages
- Backoffice hébergé sur VPS OVH avec Docker

**STACK TECHNIQUE**
- SvelteKit (TypeScript strict)
- PostgreSQL
- Authentification sécurisée admin
- Upload images vers Cloudflare R2
- Validation avec Zod
- Design responsive et UX irréprochable

**SCHÉMA BASE DE DONNÉES**

Table `categories`:
- id (UUID, PK)
- name (VARCHAR, unique)
- slug (VARCHAR, unique)
- description (TEXT, nullable)
- created_at, updated_at (TIMESTAMP)

Table `products`:
- id (UUID, PK)
- category_id (UUID, FK -> categories)
- reference (VARCHAR, unique) - référence interne
- name (VARCHAR)
- slug (VARCHAR, unique)
- description (TEXT)
- price (DECIMAL 10,2)
- tva_rate (DECIMAL 5,2) - taux TVA variable selon article
- stock_quantity (INTEGER)
- stock_status (ENUM: 'available', 'out_of_stock') - géré automatiquement selon stock
- images (TEXT[]) - URLs Cloudflare R2
- meta_description (VARCHAR, nullable)
- status (ENUM: 'draft', 'published')
- created_at, updated_at (TIMESTAMP)

Table `orders`:
- id (UUID, PK)
- order_number (VARCHAR, unique) - numéro facture
- customer_email (VARCHAR)
- customer_name (VARCHAR)
- customer_phone (VARCHAR)
- pickup_location (VARCHAR) - lieu de retrait souhaité
- total_ht (DECIMAL 10,2)
- total_tva (DECIMAL 10,2)
- total_ttc (DECIMAL 10,2)
- payment_method (ENUM: 'stripe', 'oney')
- payment_status (ENUM: 'pending', 'paid', 'failed')
- order_status (ENUM: 'pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled')
- stripe_session_id (VARCHAR, nullable)
- oney_transaction_id (VARCHAR, nullable)
- created_at, updated_at (TIMESTAMP)

Table `order_items`:
- id (UUID, PK)
- order_id (UUID, FK -> orders)
- product_id (UUID, FK -> products)
- product_name (VARCHAR) - snapshot au moment de la commande
- product_reference (VARCHAR)
- quantity (INTEGER)
- unit_price_ht (DECIMAL 10,2)
- tva_rate (DECIMAL 5,2)
- total_ht (DECIMAL 10,2)
- total_tva (DECIMAL 10,2)
- total_ttc (DECIMAL 10,2)

Table `reviews`:
- id (UUID, PK)
- product_id (UUID, FK -> products)
- order_id (UUID, FK -> orders, nullable) - pour vérifier achat réel
- customer_name (VARCHAR)
- customer_email (VARCHAR)
- rating (INTEGER 1-5)
- comment (TEXT)
- status (ENUM: 'pending', 'approved', 'rejected')
- vendor_response (TEXT, nullable)
- vendor_response_date (TIMESTAMP, nullable)
- created_at (TIMESTAMP)

Table `admin_users`:
- id (UUID, PK)
- email (VARCHAR, unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)

**FONCTIONNALITÉS BACKOFFICE**

1. **Authentification Admin**
- Login/logout sécurisé
- Session persistante
- Protection toutes les routes admin

2. **Dashboard**
- Stats: CA total, commandes en attente, produits en rupture
- Graphique CA sur 30 derniers jours
- Dernières commandes
- Avis en attente de modération

3. **Gestion Produits**
- Liste avec filtres (catégorie, statut, stock)
- Recherche par nom/référence
- CRUD complet:
  * Nom, référence, description
  * Prix HT + taux TVA
  * Stock (quantité + calcul auto du statut)
  * Upload images multiples vers R2 (drag & drop)
  * Catégorie
  * SEO: slug auto-généré éditable, meta description
  * Statut draft/published
- Réorganisation ordre des images
- Suppression image
- Aperçu fiche produit
- Stock status automatique: out_of_stock si quantity = 0

4. **Gestion Catégories**
- CRUD simple
- Slug auto-généré
- Compteur produits par catégorie

5. **Gestion Commandes**
- Liste avec filtres (statut, paiement, date)
- Recherche par numéro/email
- Détail commande:
  * Infos client
  * Produits commandés
  * Montants HT/TVA/TTC détaillés
  * Statut paiement
  * Lieu de retrait
  * Changement statut avec confirmation
- Export CSV pour comptabilité
- Génération PDF facture conforme (numéro, mentions légales, TVA détaillée)

6. **Gestion Avis**
- Liste avis en attente de modération
- Validation/rejet avec feedback
- Ajout réponse vendeur
- Affichage par produit

**API REST (pour site Astro)**

Sécurisation API:
- API Key dans headers (X-API-Key)
- CORS configuré pour domaine Cloudflare Pages uniquement
- Rate limiting (100 req/min par IP)

Endpoints:
```
GET /api/products
  ?category=slug
  &status=published (par défaut)
  &page=1&limit=20
  -> Liste produits avec pagination

GET /api/products/:slug
  -> Détail produit + avis approuvés

GET /api/categories
  -> Liste catégories avec compteur produits

GET /api/reviews/:productId
  ?status=approved (par défaut)
  -> Avis approuvés d'un produit

POST /api/reviews
  Body: { productId, customerName, customerEmail, rating, comment, orderId? }
  -> Créer avis (status: pending)

POST /api/orders
  Body: { items[], customerEmail, customerName, customerPhone, pickupLocation, paymentMethod }
  -> Créer commande + retourner session Stripe/Oney

POST /api/webhooks/payment
  -> Webhook confirmation paiement (Stripe/Oney)
  -> Envoyer email confirmation avec lien facture PDF
```

**INTÉGRATION CLOUDFLARE R2**
- Bucket R2 pour images produits
- Génération URL signée pour upload depuis backoffice
- URL publiques CDN pour affichage
- Configuration CORS R2

**UX/UI BACKOFFICE**
- Design moderne et épuré
- Navigation sidebar fixe
- Feedbacks visuels clairs (toasts pour actions)
- Loading states sur toutes les actions
- Validation formulaires en temps réel
- Messages d'erreur explicites
- Confirmations actions destructives
- Responsive (mobile-friendly)
- Dark mode optionnel

**CONTRAINTES TECHNIQUES**
- TypeScript strict mode
- Validation Zod sur tous les endpoints
- Gestion erreurs complète (try/catch + logs)
- Sanitisation inputs (XSS prevention)
- Prepared statements PostgreSQL (SQL injection prevention)
- Hachage passwords avec bcrypt
- JWT ou session cookies sécurisés
- Variables d'environnement pour secrets
- Factures PDF conformes législation française

**STRUCTURE PROJET**
```
/src
  /lib
    /server
      /db - connexion PostgreSQL + queries
      /auth - logique authentification
      /api - logique métier API
      /email - templates emails
      /pdf - génération factures
      /r2 - intégration Cloudflare R2
    /components - composants Svelte réutilisables
    /stores - stores Svelte
    /utils - helpers
  /routes
    /admin - backoffice (protégé)
      /products
      /orders
      /reviews
      /categories
      /dashboard
    /api - endpoints REST
    /login - page login admin
```

**ORDRE D'IMPLÉMENTATION**
1. Setup projet SvelteKit + PostgreSQL + migrations
2. Schéma BDD + seed données test
3. Auth admin (login/logout/protection routes)
4. Intégration Cloudflare R2
5. CRUD Catégories
6. CRUD Produits avec upload images R2
7. API REST produits/catégories
8. Dashboard avec stats
9. Système commandes
10. Gestion avis + modération
11. Intégration paiement (Stripe/Oney)
12. Webhooks + emails
13. Génération factures PDF
14. Export CSV comptabilité

Commence par créer la structure du projet, les migrations PostgreSQL, et le système d'authentification admin.