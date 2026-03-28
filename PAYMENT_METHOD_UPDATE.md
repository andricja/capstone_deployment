# Payment Method Update - Down Payment / Full Payment

## Changes Made

### Frontend Changes ✅

**File**: `frontend_capstone/src/pages/renter/BrowseEquipment.jsx`

#### 1. Payment Method Options Changed
- **Before**: COD (Cash on Delivery) and GCash
- **After**: Down Payment and Full Payment

#### 2. Payment Options
- **Down Payment**: Renter pays 50% of total cost upfront via GCash
- **Full Payment**: Renter pays 100% of total cost upfront via GCash

#### 3. Payment Proof Required
- Payment proof via GCash is now **REQUIRED** for both payment methods
- File upload field is marked as required
- Submit button is disabled until payment proof is uploaded
- This ensures the equipment owner knows the buyer is serious

#### 4. Dynamic Amount Display
- Shows the amount to pay based on selected payment method:
  - **Down Payment**: Displays "Down Payment (50%): ₱X,XXX.XX"
  - **Full Payment**: Displays "Full Payment: ₱X,XXX.XX"
- Amount is calculated from the total cost breakdown

#### 5. UI Updates
- Removed conditional rendering - payment section always shows
- Added helpful text: "💡 Payment proof required via GCash to confirm your booking"
- Payment method defaults to "downpayment"
- Dark mode support added for all new elements

## Benefits

### For Equipment Owners
1. ✅ **Guaranteed Commitment**: Payment proof ensures serious buyers only
2. ✅ **Reduced No-Shows**: Upfront payment reduces cancellations
3. ✅ **Cash Flow**: Receive payment before delivery
4. ✅ **Verification**: Can verify GCash payment before accepting rental

### For Renters
1. ✅ **Flexibility**: Choose between down payment (50%) or full payment
2. ✅ **Secure Booking**: Payment confirms reservation
3. ✅ **Clear Pricing**: See exact amount to pay before submitting

## How It Works

### Renter Flow:
1. Browse equipment and click "Request Rental"
2. Fill in farm size, contact, dates, and delivery address
3. Select payment method:
   - **Down Payment**: Pay 50% now, rest later
   - **Full Payment**: Pay 100% now
4. View owner's GCash QR code or account details
5. Make payment via GCash
6. Upload screenshot of payment proof (REQUIRED)
7. Submit rental request

### Owner Flow:
1. Receive rental request with payment proof
2. Verify GCash payment received
3. Approve or reject rental request
4. If down payment: Collect remaining 50% on delivery
5. If full payment: Deliver equipment (already paid)

## Technical Details

### State Changes
```javascript
// Default payment method
payment_method: 'downpayment'  // was 'cod'
```

### Payment Options
```javascript
[
  { value: 'downpayment', label: 'Down Payment' },
  { value: 'fullpayment', label: 'Full Payment' }
]
```

### Amount Calculation
```javascript
// Down Payment (50%)
downPaymentAmount = costBreakdown.totalCost * 0.5

// Full Payment (100%)
fullPaymentAmount = costBreakdown.totalCost
```

### Validation
```javascript
// Submit button disabled if:
- submitting (in progress)
- !costBreakdown (no cost calculated)
- !paymentProofFile (no payment proof uploaded)
```

## Database Considerations

The `payment_method` field in the `rental_requests` table will now store:
- `'downpayment'` - Renter paid 50% upfront
- `'fullpayment'` - Renter paid 100% upfront

**Note**: The backend validation may need to be updated to accept these new values. Check:
- `capstone_backend/app/Http/Requests/StoreRentalRequestRequest.php`
- `capstone_backend/app/Models/RentalRequest.php`

## Testing Checklist

- [x] Payment method options show "Down Payment" and "Full Payment"
- [x] Default selection is "Down Payment"
- [x] GCash section always visible (not conditional)
- [x] Amount to pay displays correctly for both options
- [x] Payment proof upload is required
- [x] Submit button disabled without payment proof
- [x] Dark mode styling works correctly
- [x] No console errors
- [x] No TypeScript/linting errors

## Screenshots

### Before (COD / GCash)
- COD option allowed booking without payment
- GCash was optional

### After (Down Payment / Full Payment)
- Both options require GCash payment proof
- Shows exact amount to pay
- Ensures serious buyers only

## Summary

The payment system has been updated to require upfront payment via GCash for all rental requests. This change ensures equipment owners receive payment confirmation before accepting rentals, reducing no-shows and ensuring serious buyers. Renters can choose between paying 50% down payment or 100% full payment upfront.
