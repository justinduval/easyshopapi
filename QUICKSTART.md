# Guide de démarrage rapide

Ce guide vous permet de démarrer le projet en 5 minutes pour tester le backoffice.

## Étape 1 : Configuration de la base de données

1. **Créer une base de données PostgreSQL**
```bash
createdb easyshop
```

2. **Créer le fichier .env**
```bash
cp .env.example .env
```

3. **Éditer .env et configurer au minimum DATABASE_URL**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/easyshop
```

> Pour tester sans Cloudflare R2, vous pouvez mettre des valeurs factices pour R2_*, API_SECRET_KEY et SESSION_SECRET.
> Exemple : `API_SECRET_KEY=test_key_minimum_32_characters_long`

4. **Exécuter les migrations**
```bash
pnpm install
DATABASE_URL="postgresql://user:password@localhost:5432/easyshop" node --loader ts-node/esm src/lib/server/db/migrate.ts
```

5. **Créer les données de test**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/easyshop" node --loader ts-node/esm src/lib/server/db/seed.ts
```

## Étape 2 : Démarrer le serveur

```bash
pnpm dev
```

Le serveur démarre sur **http://localhost:5173**

## Étape 3 : Se connecter au backoffice

1. Ouvrir **http://localhost:5173** dans votre navigateur
2. Vous serez automatiquement redirigé vers `/login`
3. Se connecter avec :
   - **Email** : `admin@easyshop.com`
   - **Password** : `admin123`

## Que pouvez-vous tester ?

### ✅ Fonctionnalités complètes et opérationnelles

1. **Dashboard**
   - Accessible après connexion
   - Affiche l'utilisateur connecté

2. **Catégories** (`/admin/categories`)
   - Voir les 3 catégories de test
   - Créer une nouvelle catégorie
   - Modifier une catégorie existante
   - Supprimer une catégorie (si aucun produit associé)
   - Auto-génération de slug

3. **Produits** (`/admin/products`)
   - Voir les 6 produits de test
   - Filtrer par catégorie, statut, stock
   - Rechercher par nom ou référence
   - Créer un nouveau produit
   - Modifier un produit
   - Supprimer un produit
   - **Upload d'images** (nécessite configuration R2)

4. **API REST**
   - Tous les endpoints sont fonctionnels
   - Tester avec curl ou Postman (voir API.md)
   - Nécessite une API Key dans le header `X-API-Key`

### ⚠️ Limitations en mode test

Sans configuration Cloudflare R2 :
- L'upload d'images ne fonctionnera pas
- Vous pouvez toujours créer des produits sans images

Sans configuration CORS/API :
- L'API REST retournera des erreurs 401 sans API Key valide
- Configurez `API_SECRET_KEY` et `ALLOWED_ORIGIN` dans `.env` pour tester

## Données de test créées

### Catégories (3)
- Pneus
- Batteries
- Accessoires

### Produits (6)
- 2 pneus Michelin (1 en stock, 1 en rupture)
- 1 pneu Dunlop (rupture de stock)
- 2 batteries Yuasa (en stock)
- 1 huile Motul (en stock)

Tous les produits sont **publiés** et visibles via l'API.

## Prochaines étapes

Une fois le backoffice testé, vous pouvez :

1. **Configurer Cloudflare R2** pour l'upload d'images
   - Voir la section "Configuration Cloudflare R2" dans README.md

2. **Tester l'API REST** depuis votre site Astro
   - Voir API.md pour les exemples d'intégration

3. **Personnaliser les données**
   - Modifier `src/lib/server/db/seed.ts`
   - Relancer le seed

4. **Déployer en production**
   - Voir la section "Déploiement" dans README.md

## Problèmes courants

### Erreur de connexion à PostgreSQL
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
→ Vérifiez que PostgreSQL est démarré : `pg_ctl status`

### Erreur lors des migrations
```
Error: relation "uuid-ossp" does not exist
```
→ Installez l'extension : `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Page blanche après login
→ Vérifiez les logs du serveur dans le terminal
→ Vérifiez que les variables d'environnement sont chargées

## Support

Pour plus de détails :
- **README.md** : Documentation complète
- **API.md** : Documentation de l'API REST
- **prompt.md** : Spécifications du projet
