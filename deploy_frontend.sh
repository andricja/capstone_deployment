#!/bin/bash

# FERMS Frontend Deployment Script
# This script deploys the built frontend to the production server

echo "======================================"
echo "FERMS Frontend Deployment"
echo "======================================"
echo ""

# Server details
SERVER="u798459799@151.106.124.153"
PORT="65002"
REMOTE_PATH="/home/u798459799/domains/ferms.net/public_html/"
LOCAL_BUILD="frontend_capstone/dist/"

echo "Checking if build exists..."
if [ ! -d "$LOCAL_BUILD" ]; then
    echo "❌ Build directory not found!"
    echo "Please run 'npm run build' in frontend_capstone first"
    exit 1
fi

echo "✅ Build directory found"
echo ""
echo "Deploying to: $SERVER:$REMOTE_PATH"
echo "This will upload all files from $LOCAL_BUILD"
echo ""

# Deploy
echo "Starting upload..."
scp -P $PORT -r $LOCAL_BUILD* $SERVER:$REMOTE_PATH

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Deployment completed successfully!"
    echo "======================================"
    echo ""
    echo "Your changes are now live at: https://ferms.net"
    echo ""
    echo "IMPORTANT: Clear your browser cache (Ctrl+Shift+Del) to see the changes!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check your SSH connection and try again."
    exit 1
fi
