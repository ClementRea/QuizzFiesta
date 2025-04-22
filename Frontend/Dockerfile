FROM node:22-alpine

WORKDIR /app

# Installer les dépendances globales
RUN npm install -g @quasar/cli

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances sans exécuter les scripts
RUN npm install --no-audit --no-fund

# Copier les fichiers du projet
COPY . .

# Exposer le port
EXPOSE 8080

# Démarrer le serveur de développement
CMD ["quasar", "dev", "--host", "0.0.0.0"]