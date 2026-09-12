#!/bin/bash

# Safe deployment script - Uses environment variables
# This script can be committed to GitHub safely

echo "=== Environment Variable Deployment Script ==="
echo ""

# Check if required environment variables are set
if [ -z "$SERVER_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$BACKEND_PATH" ]; then
    echo "❌ Required environment variables not set!"
    echo ""
    echo "Usage:"
    echo "  export SERVER_HOST=ferms.net"
    echo "  export SSH_USER=your-username"
    echo "  export BACKEND_PATH=domains/ferms.net/public_html/capstone_backend"
    echo "  export GOOGLE_CLIENT_ID=your-client-id"
    echo "  export GOOGLE_CLIENT_SECRET=your-client-secret"
    echo "  ./deploy_env_to_server.sh"
    echo ""
    exit 1
fi

# Optional: Check for Google credentials
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  Warning: Google OAuth credentials not set"
    echo "Set them with:"
    echo "  export GOOGLE_CLIENT_ID=your-client-id"
    echo "  export GOOGLE_CLIENT_SECRET=your-client-secret"
    echo ""
    read -p "Continue without Google OAuth? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        exit 1
    fi
fi

echo "Deploying to: $SSH_USER@$SERVER_HOST"
echo "Backend path: $BACKEND_PATH"
echo ""

# Deploy via SSH
ssh $SSH_USER@$SERVER_HOST << 'ENDSSH'
cd $BACKEND_PATH

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update Google credentials if provided
if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" .env
fi

if [ ! -z "$GOOGLE_CLIENT_SECRET" ]; then
    sed -i "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET|" .env
fi

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear

echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "✅ Environment variables deployed successfully!"
