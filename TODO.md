# TODO - Fonctionnalités à implémenter

## Phase 3 - Dashboard & Statistiques

### Dashboard avancé
- [ ] Créer composant de statistiques CA
  - Total CA (tous les temps)
  - CA du mois en cours
  - Évolution vs mois précédent
- [ ] Graphique CA sur 30 derniers jours
  - Utiliser une librairie de charts (Chart.js, ApexCharts)
  - Données groupées par jour
- [ ] Widget "Produits en rupture de stock"
  - Liste des 5 premiers produits en rupture
  - Lien direct vers l'édition
- [ ] Widget "Dernières commandes"
  - 5 dernières commandes
  - Statut et montant
- [ ] Widget "Avis en attente"
  - Nombre d'avis à modérer
  - Lien vers la gestion des avis

### API Dashboard
- [ ] Créer `src/lib/server/api/stats.ts`
  - `getRevenueStats()` - CA par période
  - `getOrdersStats()` - Stats commandes
  - `getProductsStats()` - Stats produits (déjà fait partiellement)
  - `getReviewsStats()` - Stats avis

---

## Phase 4 - Système de commandes

### Backend
- [ ] Créer `src/lib/server/api/orders.ts`
  - `getAllOrders()` avec filtres
  - `getOrderById()`
  - `createOrder()`
  - `updateOrderStatus()`
  - `cancelOrder()`
- [ ] Endpoint API `POST /api/orders`
  - Créer commande depuis le site
  - Vérifier stock disponible
  - Déduire stock automatiquement
  - Générer numéro de commande unique
  - Calculer totaux HT/TVA/TTC

### Frontend Admin
- [ ] Page liste commandes `/admin/orders`
  - Filtres : statut paiement, statut commande, date
  - Recherche par numéro/email
  - Pagination
- [ ] Page détail commande `/admin/orders/[id]`
  - Infos client
  - Liste des produits
  - Calculs détaillés (HT/TVA/TTC par ligne et total)
  - Changement de statut avec confirmation
  - Historique des changements de statut
- [ ] Export CSV
  - Export toutes les commandes
  - Export avec filtres
  - Format comptabilité

---

## Phase 5 - Gestion des avis

### Backend
- [ ] Créer `src/lib/server/api/reviews.ts`
  - `getAllReviews()` avec filtres (statut, produit, date)
  - `getReviewById()`
  - `approveReview()`
  - `rejectReview()`
  - `addVendorResponse()`

### Frontend Admin
- [ ] Page liste avis `/admin/reviews`
  - Onglets par statut (pending, approved, rejected)
  - Affichage note + commentaire + produit
  - Actions rapides (approuver/rejeter)
- [ ] Modal détail avis
  - Voir avis complet
  - Voir produit associé
  - Ajouter/modifier réponse vendeur
  - Historique (approuvé par, quand)

---

## Phase 6 - Paiements

### Stripe
- [ ] Installer `@stripe/stripe-js` et `stripe`
- [ ] Créer `src/lib/server/api/stripe.ts`
  - `createPaymentIntent()`
  - `createCheckoutSession()`
- [ ] Endpoint `POST /api/webhooks/stripe`
  - Vérifier signature webhook
  - Gérer `checkout.session.completed`
  - Mettre à jour statut paiement
  - Envoyer email confirmation

### Oney
- [ ] Intégration SDK Oney
- [ ] Créer `src/lib/server/api/oney.ts`
  - `createOneyPayment()`
  - `checkOneyEligibility()`
- [ ] Endpoint `POST /api/webhooks/oney`
  - Gérer callback Oney
  - Mettre à jour statut paiement

### Gestion paiements admin
- [ ] Afficher statut paiement dans détail commande
- [ ] Actions manuelles (marquer comme payé, remboursement)
- [ ] Logs des transactions

---

## Phase 7 - Emails

### Configuration
- [ ] Choisir service email (SendGrid, Resend, AWS SES)
- [ ] Créer `src/lib/server/email/index.ts`
- [ ] Templates HTML emails :
  - Confirmation commande
  - Expédition (prête pour retrait)
  - Annulation

### Intégration
- [ ] Email après paiement réussi
  - Récapitulatif commande
  - Lien vers facture PDF
  - Infos retrait
- [ ] Email changement statut commande
- [ ] Email d'avis approuvé (pour client)

---

## Phase 8 - Factures PDF

### Backend
- [ ] Installer `pdfkit` ou `puppeteer`
- [ ] Créer `src/lib/server/pdf/invoice.ts`
  - Générer PDF conforme législation FR
  - Numéro facture auto-incrémenté
  - Mentions légales
  - Détail TVA
  - QR code (optionnel)
- [ ] Endpoint `GET /api/invoices/:orderId`
  - Télécharger facture PDF
  - Nécessite authentification ou token unique

### Frontend Admin
- [ ] Bouton "Télécharger facture" dans détail commande
- [ ] Bouton "Envoyer facture par email"
- [ ] Prévisualisation facture

---

## Phase 9 - Améliorations UX

### Backoffice
- [ ] Dark mode
  - Toggle dans header
  - Sauvegarde préférence utilisateur
  - CSS variables pour thèmes
- [ ] Notifications toast
  - Succès/erreur/info
  - Auto-dismiss
  - Position configurable
- [ ] Drag & drop pour images
  - Réorganiser ordre des images produit
  - Upload par drag & drop
- [ ] Aperçu produit en temps réel
  - Dans formulaire création/édition
  - Simuler affichage site

### Performance
- [ ] Optimisation images
  - Resize automatique lors de l'upload
  - WebP conversion
  - Thumbnails
- [ ] Lazy loading images
- [ ] Infinite scroll pour listes longues

---

## Phase 10 - Sécurité & Monitoring

### Sécurité
- [ ] Rate limiting plus granulaire
  - Par endpoint
  - Par utilisateur admin
- [ ] Logs d'audit admin
  - Qui a modifié quoi et quand
  - Table `audit_logs`
- [ ] 2FA pour admin (optionnel)
  - TOTP avec QR code
  - Backup codes
- [ ] Rotation API keys
  - Générer nouvelles clés
  - Révoquer anciennes

### Monitoring
- [ ] Logs structurés (Winston, Pino)
- [ ] Healthcheck endpoint `/health`
- [ ] Metrics (Prometheus compatible)
- [ ] Error tracking (Sentry)

---

## Phase 11 - Tests

### Tests unitaires
- [ ] Tests API functions
  - `categories.ts`
  - `products.ts`
  - `orders.ts`
- [ ] Tests auth
  - Login
  - Session
- [ ] Tests validation Zod

### Tests E2E
- [ ] Tests Playwright
  - Login flow
  - CRUD catégories
  - CRUD produits
  - Création commande

---

## Backlog - Nice to have

- [ ] Multi-langue (i18n)
- [ ] Export données (backup)
- [ ] Import produits par CSV
- [ ] Gestion multi-admin avec rôles
- [ ] Historique modifications produit
- [ ] Produits en promotion/soldes
- [ ] Codes promo
- [ ] Gestion stock avec alertes
- [ ] Intégration comptabilité (export)
- [ ] Statistiques avancées (Google Analytics)
- [ ] SEO checker automatique
- [ ] Preview mobile/desktop du site
- [ ] Mode maintenance

---

## Notes

- Priorité : Phases 3-5 pour avoir un backoffice complet
- Phase 6 (paiements) nécessite configuration comptes Stripe/Oney
- Phase 7-8 peuvent être faites en parallèle
- Phase 9-11 sont des améliorations (pas bloquantes)

**Estimation temps :**
- Phases 3-5 : ~1-2 jours
- Phase 6 : ~1 jour
- Phases 7-8 : ~1 jour
- Total MVP complet : ~3-4 jours
