#!/bin/bash

# Deploy Message Conversation Feature to Production
# Run this script on the server

echo "========================================="
echo "Deploying Message Conversation Feature"
echo "========================================="

# Navigate to backend directory
cd /home/u798459799/domains/ferms.net/public_html/capstone_backend/

echo "✓ Changed to backend directory"

# Run migrations
php artisan migrate --force

echo "✓ Migrations completed"

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear

echo "✓ Caches cleared"

# Optimize
php artisan config:cache
php artisan route:cache

echo "✓ Application optimized"

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test the message conversation feature"
echo "2. Go to Admin > Message Requests"
echo "3. Click on a message to open conversation"
echo "4. Send a reply and verify it appears"
echo ""
