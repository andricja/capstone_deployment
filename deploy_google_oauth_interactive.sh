#!/bin/bash

# Interactive Google OAuth Deployment Script
# This script safely deploys credentials without storing them in git

echo "=== Google OAuth Credential Deployment ==="
echo ""
echo "⚠️  This script will SSH into your server and update credentials"
echo "⚠️  Credentials are NOT stored in files - only in server .env"
echo ""

# Prompt for server details
read -p "Server hostname (e.g., ferms.net): " SERVER_HOST
read -p "SSH username: " SSH_USER
read -p "Backend path (e.g., domains/ferms.net/public_html/capstone_backend): " BACKEND_PATH

echo ""
echo "--- Enter Google OAuth Credentials ---"
read -p "Google Client ID: " CLIENT_ID
read -sp "Google Client Secret: " CLIENT_SECRET
echo ""
read -p "Redirect URI (default: https://ferms.net/api/auth/google/callback): " REDIRECT_URI
REDIRECT_URI=${REDIRECT_URI:-https://ferms.net/api/auth/google/callback}

echo ""
echo "--- Credentials Summary ---"
echo "Client ID: ${CLIENT_ID}"
echo "Client Secret: ${CLIENT_SECRET:0:10}..."
echo "Redirect URI: ${REDIRECT_URI}"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "=== Deploying to Server ==="

# Create remote script
REMOTE_SCRIPT=$(cat << 'REMOTE_EOF'
#!/bin/bash
cd ${BACKEND_PATH}

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backed up .env"

# Update credentials
sed -i "s|^GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=${CLIENT_ID}|" .env
sed -i "s|^GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}|" .env
sed -i "s|^GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=${REDIRECT_URI}|" .env
echo "✓ Updated .env file"

# Clear caches
php artisan config:clear 2>&1
php artisan cache:clear 2>&1
php artisan optimize:clear 2>&1
echo "✓ Cleared Laravel caches"

# Restart PHP
killall -9 lsphp 2>/dev/null || true
touch ~/.lsphp_restart.txt 2>/dev/null || true
echo "✓ Restarted PHP"

# Verify
echo ""
echo "=== Verification ==="
grep "GOOGLE_CLIENT_ID" .env | head -c 60
echo "..."
grep "GOOGLE_REDIRECT_URI" .env

echo ""
echo "✓ Deployment complete!"
REMOTE_EOF
)

# Execute on server
ssh ${SSH_USER}@${SERVER_HOST} "export BACKEND_PATH='${BACKEND_PATH}' CLIENT_ID='${CLIENT_ID}' CLIENT_SECRET='${CLIENT_SECRET}' REDIRECT_URI='${REDIRECT_URI}'; bash -s" << EOF
${REMOTE_SCRIPT}
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "=== ✅ SUCCESS ==="
    echo "Google OAuth credentials deployed successfully!"
    echo ""
    echo "Next Steps:"
    echo "1. Test OAuth at: https://${SERVER_HOST}"
    echo "2. Verify redirect URI in Google Cloud Console"
    echo "3. Check Laravel logs if issues occur"
else
    echo ""
    echo "=== ❌ ERROR ==="
    echo "Deployment failed. Check SSH connection and paths."
    exit 1
fi
