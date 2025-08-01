#A SERVIT DE TEST POUR LE DEPLOYEMENT LOCAL
#   UNIQUEMENT DANS LE CADRE DE l'ÉVALUTATION DOCKER
set -e

echo "🏠 Déploiement Local QuizzFiesta"

if [ ! -f "Backend/.env.prod" ]; then
    echo "❌ Fichier Backend/.env.prod manquant!"
    echo "Copiez .env.example vers .env.prod et configurez"
    exit 1
fi

echo "🛑 Arrêt des conteneurs existants..."
docker compose -f docker-compose.prod.yml down

echo "🔨 Build et démarrage..."
docker compose -f docker-compose.prod.yml up --build -d

echo "🔍 Vérification du déploiement..."
sleep 10

if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend OK"
else
    echo "❌ Backend KO"
fi

if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend OK"
    echo "🎉 Déploiement réussi! App disponible sur http://localhost:8080"
else
    echo "❌ Frontend KO"
fi