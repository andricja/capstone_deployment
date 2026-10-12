#!/bin/bash

# Clear Database - Keep Admin Only
# This script clears all mock data but keeps admin@ferms.com

echo "================================"
echo "🗑️  Clear Database Script"
echo "================================"
echo ""
echo "⚠️  WARNING: This will delete all data except admin account!"
echo "   Admin: admin@ferms.com"
echo "   Password: password"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled. No changes made."
    exit 1
fi

echo ""
echo "🔄 Navigating to backend directory..."
cd capstone_backend || exit 1

echo "🔄 Clearing database..."
php artisan db:seed --class=FreshDatabaseSeeder

echo ""
echo "================================"
echo "✅ Done!"
echo "================================"
echo ""
echo "You can now login with:"
echo "  Email: admin@ferms.com"
echo "  Password: password"
echo ""
