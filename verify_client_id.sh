#!/bin/bash
# Run this on your server to verify the Client ID

echo "=== Checking .env file ==="
grep "GOOGLE_CLIENT_ID" .env

echo ""
echo "=== Checking what Laravel sees ==="
php artisan tinker --execute="echo config('services.google.client_id');"

echo ""
echo "=== Checking actual OAuth URL being generated ==="
curl -s https://ferms.net/api/auth/google | grep -o 'client_id=[^&"]*'

echo ""
echo "=== All done ==="
