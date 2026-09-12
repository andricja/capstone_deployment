#!/bin/bash

echo "=== Google OAuth Comprehensive Fix Script ==="
echo ""

# Navigate to backend directory
cd domains/ferms.net/public_html/capstone_backend

echo "1. Checking current configuration..."
echo ""
cat .env | grep GOOGLE
echo ""

echo "2. Checking for cached config files..."
if [ -f "bootstrap/cache/config.php" ]; then
    echo "Found cached config file - REMOVING..."
    rm -f bootstrap/cache/config.php
    echo "✓ Removed bootstrap/cache/config.php"
else
    echo "✓ No cached config file found"
fi
echo ""

echo "3. Clearing all Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
echo "✓ All caches cleared"
echo ""

echo "4. Rebuilding configuration cache..."
php artisan config:cache
echo "✓ Configuration cached"
echo ""

echo "5. Attempting to restart PHP processes..."
# Try different restart methods based on hosting environment
if command -v killall &> /dev/null; then
    killall -9 lsphp 2>/dev/null && echo "✓ Killed lsphp processes" || echo "- lsphp not running or already killed"
fi

# Create restart trigger file for LiteSpeed
touch /home/u798459799/.lsphp_restart.txt 2>/dev/null && echo "✓ Created LiteSpeed restart trigger" || echo "- Could not create restart trigger"

echo ""
echo "6. Testing configuration loading..."
php -r "
require 'vendor/autoload.php';
\$app = require_once 'bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
echo 'Client ID from Laravel: ' . config('services.google.client_id') . PHP_EOL;
echo 'Expected Client ID: 639221514224-0ofvgbhe2ka6n38k2n51pdsbi4v4aarp.apps.googleusercontent.com' . PHP_EOL;
if (config('services.google.client_id') === '639221514224-0ofvgbhe2ka6n38k2n51pdsbi4v4aarp.apps.googleusercontent.com') {
    echo '✓ Configuration matches!' . PHP_EOL;
} else {
    echo '✗ Configuration MISMATCH!' . PHP_EOL;
}
"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Wait 30 seconds for PHP processes to fully restart"
echo "2. Test Google Login at https://ferms.net in Incognito mode"
echo "3. If still failing, run: curl https://ferms.net/capstone_backend/check_google_config.php"
echo ""
