#A SERVI DE TEST POUR LE BACKUP MONGO
#   UNIQUEMENT DANS LE CADRE DE l'ÉVALUTATION DOCKER
set -e
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/backup/$DATE"
mkdir -p "$BACKUP_DIR"

echo "[Backup] Dumping MongoDB..."
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR"
echo "[Backup] Done. Backup stored in $BACKUP_DIR"
