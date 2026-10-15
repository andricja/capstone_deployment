#!/bin/bash

# Deploy Archive Feature Fix to Production
# Run this on the production server: bash deploy_archive_fix.sh

echo "🚀 Deploying Archive Feature Fix to ferms.net..."
echo ""

# Navigate to backend directory
cd /var/www/capstone_backend || {
    echo "❌ Error: Could not find /var/www/capstone_backend"
    exit 1
}

echo "📂 Current directory: $(pwd)"
echo ""

# Pull latest code
echo "📥 Pulling latest code from repository..."
git pull origin main || {
    echo "⚠️  Warning: Git pull failed or had conflicts"
    echo "   Trying to stash changes and pull again..."
    git stash
    git pull origin main
}
echo ""

# Clear all Laravel caches
echo "🧹 Clearing all Laravel caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
echo ""

# Rebuild optimized caches
echo "⚡ Rebuilding optimized caches..."
php artisan route:cache
php artisan config:cache
php artisan optimize
echo ""

# Fix permissions
echo "🔐 Fixing permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
echo ""

# Restart services
echo "🔄 Restarting PHP-FPM and Nginx..."
systemctl restart php8.2-fpm
systemctl restart nginx
echo ""

# Verify routes
echo "🔍 Verifying archived routes are registered..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
php artisan route:list | grep archived | head -20
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if ArchiveController exists
if [ -f "app/Http/Controllers/Api/ArchiveController.php" ]; then
    echo "✅ ArchiveController.php exists"
else
    echo "❌ ArchiveController.php NOT FOUND!"
    echo "   This is a critical issue - the controller file is missing."
    exit 1
fi
echo ""

# Final status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Test the fix at: https://ferms.net/admin/settings"
echo "📋 Click on the 'Archive' tab - it should load without 404 errors"
echo ""
echo "💡 If still not working, check:"
echo "   1. Browser console for any remaining errors"
echo "   2. Run: tail -f storage/logs/laravel.log"
echo "   3. Check nginx error log: tail -f /var/log/nginx/error.log"
echo ""
