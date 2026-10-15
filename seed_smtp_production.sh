#!/bin/bash
# Seed SMTP settings to production database
# Run this on your production server

cd ~/domains/ferms.net/public_html/capstone_backend && php artisan db:seed --class=SmtpSettingSeeder --force
