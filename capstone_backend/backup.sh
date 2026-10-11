#!/bin/bash

# FERMS Database Backup Script
# Runs daily to backup MySQL database

# Configuration
DB_NAME="u798459799_ferms"
DB_USER="u798459799_ferms"
DB_PASS=$(grep DB_PASSWORD .env | cut -d '=' -f2)  # Read from .env
BACKUP_DIR="/home/u798459799/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ferms_backup_$DATE.sql.gz"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup at $(date)"
mysqldump -u $DB_USER -p"$DB_PASS" $DB_NAME | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "ERROR: Backup failed!"
    exit 1
fi

# Delete backups older than retention period
echo "Removing backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "ferms_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List current backups
echo "Current backups:"
ls -lh $BACKUP_DIR/ferms_backup_*.sql.gz 2>/dev/null | tail -5

echo "Backup process completed at $(date)"
