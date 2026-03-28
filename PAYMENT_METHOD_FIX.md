# Payment Method Validation Fix

## Problem
When submitting a rental request, the modal showed an error: "Selected payment method is invalid"

## Root Cause
- **Frontend** was sending: `'downpayment'` or `'fullpayment'`
- **Backend validation** only accepted: `'cod'` or `'gcash'`
- This mismatch caused the validation error

## Solution Implemented

### 1. Updated Backend Validation Rules
**File**: `capstone_backend/app/Http/Requests/StoreRentalRequestRequest.php`

Changed validation from:
```php
'payment_method' => ['required', 'in:cod,gcash'],
'payment_proof'  => ['required_if:payment_method,gcash', 'nullable', 'image', 'max:5120'],
```

To:
```php
'payment_method' => ['required', 'in:downpayment,fullpayment'],
'payment_proof'  => ['required', 'image', 'max:5120'],
```

**Key changes:**
- Accepts `downpayment` and `fullpayment` instead of `cod` and `gcash`
- Payment proof is now ALWAYS required (not conditional)
- Updated error message to reflect that GCash payment proof is required for all rentals

### 2. Created Database Migration
**File**: `capstone_backend/database/migrations/2026_03_27_100000_update_payment_method_for_rental_requests.php`

- Increased `payment_method` column size from 10 to 20 characters
- Changed default value from `'cod'` to `'downpayment'`
- Migrated existing records: converted old `'cod'` and `'gcash'` values to `'downpayment'`

### 3. Migration Executed Successfully
```bash
php artisan migrate
# ✓ 2026_03_27_100000_update_payment_method_for_rental_requests ... DONE
```

## Payment Method Options

### Down Payment (50%)
- Renter pays 50% of total cost upfront via GCash
- Remaining 50% paid upon delivery/completion
- Payment proof required

### Full Payment (100%)
- Renter pays 100% of total cost upfront via GCash
- No additional payment needed
- Payment proof required

## Result
✅ Rental requests can now be submitted successfully with the new payment methods
✅ Backend properly validates `downpayment` and `fullpayment`
✅ Payment proof is required for all rental requests
✅ Database schema updated to support new payment method values
