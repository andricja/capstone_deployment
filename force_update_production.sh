#!/bin/bash
# Force update production server with latest code and seed SMTP

echo "🔄 Force updating production server..."
echo ""

# SSH command to pull latest code and seed
ssh your-server << 'ENDSSH'
cd ~/domains/ferms.net/public_html/capstone_backend

echo "📥 Pulling latest code from GitHub..."
git fetch --all
git reset --hard origin/master
git pull origin master

echo ""
echo "🔄 Updating composer..."
composer dump-autoload

echo ""
echo "📊 Seeding SMTP settings..."
php artisan db:seed --class=SmtpSettingSeeder --force

echo ""
echo "✅ Update complete!"
echo ""
echo "Verification:"
php artisan tinker --execute="echo SmtpSetting::first() ? '✅ SMTP configured' : '❌ SMTP not found'; echo PHP_EOL;"

ENDSSH

echo ""
echo "✅ Done! Check output above for results."
