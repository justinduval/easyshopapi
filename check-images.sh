#!/bin/bash
echo "=== Produits avec images ==="
psql postgresql://justin:justin@localhost:5432/easyshop -c "SELECT name, images FROM products WHERE array_length(images, 1) > 0 LIMIT 5;"

echo ""
echo "=== Test d'accès à la première image ==="
IMAGE_URL=$(psql postgresql://justin:justin@localhost:5432/easyshop -t -c "SELECT images[1] FROM products WHERE array_length(images, 1) > 0 LIMIT 1;" | xargs)

if [ ! -z "$IMAGE_URL" ]; then
    echo "URL: $IMAGE_URL"
    echo ""
    echo "Test HTTP:"
    curl -I "$IMAGE_URL" 2>&1 | grep -E "HTTP|Content-Type"
else
    echo "Aucune image trouvée en base de données"
    echo "Uploadez un produit avec une image pour tester"
fi
