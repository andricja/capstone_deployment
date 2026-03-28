# Quick Start: Auto-Reject Scheduler

## ✅ What's Already Done

1. ✅ Command created: `AutoRejectExpiredRentals`
2. ✅ Database migration added: `rejection_reason` field
3. ✅ Migration run successfully
4. ✅ Model updated: `RentalRequest` includes `rejection_reason`
5. ✅ Controller updated: Owner can reject with custom reason
6. ✅ Scheduler configured: Runs hourly
7. ✅ Tested: Successfully rejected 14 expired requests

## 🚀 How to Use

### Run Manually (Anytime)
```bash
cd capstone_backend
php artisan rentals:auto-reject
```

### Run Scheduler in Development
```bash
cd capstone_backend
php artisan schedule:work
```
Leave this running in a terminal. It will check every minute and run tasks as scheduled.

### Setup for Production (Server)

1. Add to crontab:
```bash
crontab -e
```

2. Add this line:
```
* * * * * cd /path/to/capstone_backend && php artisan schedule:run >> /dev/null 2>&1
```

3. Save and exit

## 📊 How It Works

```
Rental Request Created
         ↓
   Status: "forwarded"
         ↓
    [24 hours pass]
         ↓
   Scheduler runs hourly
         ↓
   Checks for expired requests
         ↓
   Status: "rejected"
   Reason: "Automatically rejected: Owner did not respond within 24 hours."
         ↓
   Equipment: "available" (if was rented)
```

## 🔍 Check Logs

```bash
# View recent logs
tail -f storage/logs/laravel.log

# Search for auto-reject logs
grep "Auto-reject" storage/logs/laravel.log
```

## 🧪 Test It

1. Create a test rental request (or use existing one)
2. Manually set its `created_at` to 25 hours ago:
```bash
php artisan tinker
```
```php
$rental = \App\Models\RentalRequest::find(1);
$rental->created_at = now()->subHours(25);
$rental->save();
exit
```

3. Run the command:
```bash
php artisan rentals:auto-reject
```

4. Check the result:
```bash
php artisan tinker
```
```php
\App\Models\RentalRequest::find(1)->status; // Should be "rejected"
\App\Models\RentalRequest::find(1)->rejection_reason; // Should show auto-reject message
```

## 📱 Frontend Integration

The rejection reason is now available in API responses:

```javascript
// When fetching rental requests
{
  "id": 123,
  "status": "rejected",
  "rejection_reason": "Automatically rejected: Owner did not respond within 24 hours.",
  // ... other fields
}
```

Display this in your frontend to show renters why their request was rejected.

## ⚙️ Configuration

**Change timeout period** (default: 24 hours):
- Edit: `app/Console/Commands/AutoRejectExpiredRentals.php`
- Line: `$twentyFourHoursAgo = now()->subHours(24);`
- Change `24` to desired hours

**Change schedule frequency** (default: hourly):
- Edit: `routes/console.php`
- Change `->hourly()` to:
  - `->everyThirtyMinutes()`
  - `->everyFifteenMinutes()`
  - `->daily()`
  - etc.

## 🎯 Current Status

✅ System is ready to use!
✅ Already rejected 14 expired requests in test run
✅ All components working correctly

## 📝 Next Steps (Optional)

1. Add email notifications before auto-rejection
2. Add dashboard widget showing expiring requests
3. Add configurable timeout per equipment type
4. Add SMS notifications for urgent requests

## 🆘 Troubleshooting

**Command not working?**
```bash
composer dump-autoload
php artisan list | grep rentals
```

**Scheduler not running?**
```bash
php artisan schedule:list  # See all scheduled tasks
php artisan schedule:run   # Run scheduler manually
```

**Check if cron is working (Linux)?**
```bash
crontab -l  # List cron jobs
grep CRON /var/log/syslog  # Check cron logs
```
