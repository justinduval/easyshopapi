# EasyShop Backoffice

Backoffice e-commerce pour pièces de rechange moto avec SvelteKit et PostgreSQL.

## Stack Technique

- **Frontend**: SvelteKit 5 + TypeScript
- **Base de données**: PostgreSQL
- **Authentification**: Bcrypt + Session cookies
- **Upload images**: Cloudflare R2 (S3-compatible)
- **Validation**: Zod
- **Adapter**: Node.js

## Prérequis

- Node.js 18+ (ou pnpm)
- PostgreSQL 14+
- Compte Cloudflare avec R2 activé

## Installation

1. **Cloner le projet** (si applicable)

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configurer les variables d'environnement**
Copier `.env.example` vers `.env` et remplir les valeurs :

```bash
cp .env.example .env
```

Variables requises :
- `DATABASE_URL`: URL de connexion PostgreSQL
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`: Credentials Cloudflare R2
- `R2_BUCKET_NAME`: Nom du bucket R2
- `R2_PUBLIC_URL`: URL publique du CDN R2
- `API_SECRET_KEY`: Clé secrète pour l'API (min 32 caractères)
- `SESSION_SECRET`: Secret pour les sessions (min 32 caractères)
- `ALLOWED_ORIGIN`: Domaine autorisé pour CORS (site Astro)

4. **Créer la base de données PostgreSQL**
```bash
createdb easyshop
```

5. **Exécuter les migrations**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/easyshop" node --loader ts-node/esm src/lib/server/db/migrate.ts
```

6. **Seed les données de test**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/easyshop" node --loader ts-node/esm src/lib/server/db/seed.ts
```

Cela créera :
- Un utilisateur admin : `admin@easyshop.com` / `admin123`
- 3 catégories de test
- 6 produits de test

## Démarrage

### Mode développement
```bash
pnpm dev
```

Le serveur démarre sur `http://localhost:5173`

### Mode production
```bash
pnpm build
pnpm preview
```

## Structure du projet

```
/src
  /lib
    /server
      /db          - Connexion PostgreSQL + migrations
      /auth        - Authentification admin
      /api         - Logique métier (categories, products, etc.)
      /r2          - Intégration Cloudflare R2
    /components    - Composants Svelte réutilisables
    /stores        - Stores Svelte
    /utils         - Utilitaires
  /routes
    /admin         - Backoffice (protégé par auth)
      /dashboard
      /categories
      /products
      /orders
      /reviews
    /api           - Endpoints REST pour le site Astro
    /login         - Page de connexion admin
```

## Fonctionnalités implémentées

### Phase 1 ✅ COMPLÈTE
- [x] Setup projet SvelteKit + TypeScript strict
- [x] Configuration PostgreSQL + migrations
- [x] Schéma BDD complet (7 tables avec triggers)
- [x] Seed données de test
- [x] Authentification admin (login/logout)
- [x] Protection routes admin avec hooks
- [x] Configuration Cloudflare R2
- [x] **CRUD Catégories complet**
  - Liste avec compteur produits
  - Création/édition/suppression
  - Auto-génération slugs
  - Validation Zod

### Phase 2 ✅ COMPLÈTE
- [x] **CRUD Produits avec upload images R2**
  - Liste avec filtres (catégorie, statut, stock, recherche)
  - Création/édition avec formulaires complets
  - Upload multiple d'images vers Cloudflare R2
  - Gestion automatique du stock status
  - Auto-génération slugs SEO
  - Calcul automatique prix TTC
- [x] **API REST sécurisée pour site Astro**
  - GET `/api/products` - Liste paginée avec filtres
  - GET `/api/products/:slug` - Détail produit + avis
  - GET `/api/categories` - Liste catégories
  - GET `/api/reviews/:productId` - Avis d'un produit
  - POST `/api/reviews` - Créer un avis
  - Authentification par API Key
  - CORS configuré
  - Rate limiting (100 req/min)

### Phase 3 (À venir)
- [ ] Dashboard avec statistiques avancées
- [ ] Système de commandes complet
- [ ] Gestion et modération des avis
- [ ] Intégration paiement (Stripe/Oney)
- [ ] Webhooks paiement
- [ ] Génération factures PDF
- [ ] Export CSV comptabilité
- [ ] Emails transactionnels

## Credentials par défaut

**Admin:**
- Email: `admin@easyshop.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Changer ces credentials en production !

## Déploiement

Le projet utilise `@sveltejs/adapter-node` et peut être déployé sur :
- VPS (recommandé pour ce projet)
- Docker
- Services compatibles Node.js

### Avec Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build"]
```

## Configuration Cloudflare R2

1. Créer un bucket R2 dans le dashboard Cloudflare
2. Générer des tokens API avec permissions :
   - Object Read & Write
3. Configurer un domaine public pour le bucket (R2.dev ou custom domain)
4. Ajouter les credentials dans `.env`

## API REST (pour site Astro)

L'API REST est **complète et opérationnelle**. Les endpoints sont disponibles sous `/api/*`.

**Sécurité :**
- Authentification par API Key (header `X-API-Key`)
- CORS configuré pour le domaine autorisé uniquement
- Rate limiting (100 requêtes/minute par IP)

**Endpoints disponibles :**
- `GET /api/products` - Liste des produits (pagination, filtres)
- `GET /api/products/:slug` - Détail d'un produit avec avis
- `GET /api/categories` - Liste des catégories
- `GET /api/reviews/:productId` - Avis d'un produit
- `POST /api/reviews` - Créer un nouvel avis

📖 **Documentation complète** : Voir [API.md](./API.md) pour tous les détails, exemples et intégration Astro.

## Licence

Privé - Tous droits réservés
