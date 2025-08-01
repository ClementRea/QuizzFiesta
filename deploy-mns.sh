#A SERVIT DE TEST POUR LE DEPLOIEMENT SUR MNS
#   UNIQUEMENT DANS LE CADRE DE l'ÉVALUTATION DOCKER
set -e

echo "🚀 Déploiement QuizzFiesta - Registry MNS"

REGISTRY="adresse ip mns"
PROJECT="quizzfiesta"
VERSION=${1:-latest}

echo "📦 Build Frontend..."
docker build -t ${REGISTRY}/${PROJECT}/frontend:${VERSION} -f Frontend/Dockerfile.prod Frontend/

echo "📦 Build Backend..."
docker build -t ${REGISTRY}/${PROJECT}/backend:${VERSION} -f Backend/Dockerfile Backend/

echo "⬆️ Push vers registry MNS..."
docker push ${REGISTRY}/${PROJECT}/frontend:${VERSION}
docker push ${REGISTRY}/${PROJECT}/backend:${VERSION}

echo "✅ Images pushées avec succès!"
echo "👉 Pour déployer: docker-compose -f docker-compose.mns.yml up -d"nv