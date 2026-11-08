#!/bin/bash
# Check if files are updated on production server
# Run this on your SSH terminal

echo "=================================="
echo "  Checking Production Server Files"
echo "=================================="
echo ""

# Check if SmtpSettingSeeder exists
echo "1. Checking SmtpSettingSeeder.php..."
if [ -f ~/domains/ferms.net/public_html/capstone_backend/database/seeders/SmtpSettingSeeder.php ]; then
    echo "   ✅ File exists"
    echo "   First 15 lines:"
    head -15 ~/domains/ferms.net/public_html/capstone_backend/database/seeders/SmtpSettingSeeder.php
else
    echo "   ❌ File NOT found!"
fi

echo ""
echo "=================================="
echo ""

# Check deploy.yml
echo "2. Checking deploy.yml..."
if [ -f ~/domains/ferms.net/public_html/.github/workflows/deploy.yml ]; then
    echo "   ✅ File exists"
    echo "   Checking for 'SmtpSettingSeeder':"
    grep -n "SmtpSettingSeeder" ~/domains/ferms.net/public_html/.github/workflows/deploy.yml
else
    echo "   ❌ File NOT found!"
fi

echo ""
echo "=================================="
echo ""

# Check git status
echo "3. Git status (root):"
cd ~/domains/ferms.net/public_html
git log -1 --oneline
echo ""

echo "4. Git status (backend):"
cd ~/domains/ferms.net/public_html/capstone_backend
git log -1 --oneline

echo ""
echo "=================================="
echo ""

# Check if SMTP is already seeded
echo "5. Checking database for SMTP settings:"
cd ~/domains/ferms.net/public_html/capstone_backend
php artisan tinker --execute="echo '   Records: ' . SmtpSetting::count(); echo PHP_EOL; if (SmtpSetting::count() > 0) { echo '   ✅ SMTP configured'; } else { echo '   ❌ SMTP not configured'; } echo PHP_EOL;"

echo ""
echo "=================================="
echo "  Check Complete"
echo "=================================="
