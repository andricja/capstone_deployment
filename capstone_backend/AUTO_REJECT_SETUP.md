# Auto-Reject Expired Rental Requests

## Overview

This feature automatically rejects rental requests that have been in "forwarded" status for more than 24 hours without owner approval.

## How It Works

1. **Scheduled Task**: Runs every hour to check for expired rental requests
2. **24-Hour Window**: Rental requests older than 24 hours are automatically rejected
3. **Status Update**: Changes status from "forwarded" to "rejected"
4. **Rejection Reason**: Adds automatic message: "Automatically rejected: Owner did not respond within 24 hours."
5. **Equipment Release**: If equipment was marked as "rented", it's set back to "available"

## Components

### 1. Command: `AutoRejectExpiredRentals`
**Location**: `app/Console/Commands/AutoRejectExpiredRentals.php`

**Run manually**:
```bash
php artisan rentals:auto-reject
```

**What it does**:
- Finds all rental requests with status "forwarded" created more than 24 hours ago
- Updates their status to "rejected"
- Adds rejection reason
- Releases equipment back to "available" status
- Logs all actions

### 2. Database Migration
**File**: `2026_03_25_172550_add_rejection_reason_to_rental_requests_table.php`

**Added field**:
- `rejection_reason` (text, nullable) - Stores why the request was rejected

### 3. Scheduler Configuration
**Location**: `routes/console.php`

**Schedule**: Runs hourly with the following settings:
- `hourly()` - Executes every hour
- `withoutOverlapping()` - Prevents multiple instances running simultaneously
- `runInBackground()` - Doesn't block other scheduled tasks

## Setting Up the Scheduler

### For Development (Windows)

**Option 1: Run manually when needed**
```bash
php artisan rentals:auto-reject
```

**Option 2: Keep scheduler running**
```bash
php artisan schedule:work
```
This will run the scheduler every minute (for testing).

### For Production (Linux/Server)

Add this cron entry to run Laravel's scheduler:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

**Steps**:
1. Open crontab editor:
   ```bash
   crontab -e
   ```

2. Add the line above (replace `/path-to-your-project` with actual path)

3. Save and exit

The cron job runs every minute, and Laravel's scheduler decides which tasks to execute based on their schedule.

## Manual Rejection by Owner

Owners can also manually reject rental requests with a custom reason:

**API Endpoint**: `PATCH /api/owner/rental-requests/{id}/reject`

**Request Body** (optional):
```json
{
  "rejection_reason": "Equipment is currently under maintenance"
}
```

If no reason is provided, defaults to: "Rejected by owner."

## Testing

### Test the command manually:
```bash
php artisan rentals:auto-reject
```

### Create test data (old rental request):
```php
// In tinker: php artisan tinker
$rental = \App\Models\RentalRequest::create([
    'renter_id' => 1,
    'equipment_id' => 1,
    'contact_number' => '09123456789',
    'farm_size_sqm' => 1000,
    'estimated_hours' => 1,
    'rental_days' => 1,
    'start_date' => now()->addDays(2),
    'end_date' => now()->addDays(3),
    'delivery_address' => 'Test Address',
    'total_cost' => 500,
    'base_cost' => 450,
    'delivery_fee' => 50,
    'service_charge' => 0,
    'status' => 'forwarded',
    'created_at' => now()->subHours(25), // 25 hours ago
]);
```

Then run:
```bash
php artisan rentals:auto-reject
```

## Logs

All auto-rejection activities are logged to `storage/logs/laravel.log`:

```
[2026-03-25 17:30:00] local.INFO: Auto-rejected rental request #123 for renter John Doe
[2026-03-25 17:30:00] local.INFO: Auto-reject completed: 5 rental request(s) rejected.
```

## Frontend Display

The rejection reason is included in the rental request response:

```json
{
  "id": 123,
  "status": "rejected",
  "rejection_reason": "Automatically rejected: Owner did not respond within 24 hours.",
  ...
}
```

Display this in the frontend to inform renters why their request was rejected.

## Configuration

To change the 24-hour timeout, edit `app/Console/Commands/AutoRejectExpiredRentals.php`:

```php
// Change from 24 hours to 48 hours
$twentyFourHoursAgo = now()->subHours(48);
```

To change the schedule frequency, edit `routes/console.php`:

```php
// Run every 30 minutes instead of hourly
Schedule::command('rentals:auto-reject')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->runInBackground();
```

## Troubleshooting

### Command not found
```bash
php artisan list
```
Look for `rentals:auto-reject` in the list. If not there, run:
```bash
composer dump-autoload
```

### Scheduler not running
Check if the cron job is active:
```bash
crontab -l
```

Check Laravel logs:
```bash
tail -f storage/logs/laravel.log
```

### Test scheduler manually
```bash
php artisan schedule:run
```

This runs all scheduled tasks immediately (useful for testing).

## Benefits

1. **Automatic Cleanup**: No manual intervention needed
2. **Fair to Renters**: Renters get timely responses (within 24 hours)
3. **Equipment Availability**: Equipment doesn't stay locked indefinitely
4. **Transparency**: Clear rejection reasons for renters
5. **Owner Accountability**: Encourages owners to respond promptly

## Future Enhancements

- Email notification to owner before auto-rejection (e.g., at 20 hours)
- Email notification to renter when auto-rejected
- Configurable timeout per equipment category
- Dashboard widget showing pending requests nearing expiration
- SMS notifications for urgent requests
