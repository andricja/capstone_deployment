# Payment Method Labels Update

## Changes Made

Updated all payment method labels throughout the application to clearly indicate GCash payment and payment proof viewing.

### 1. Payment Method Selection (BrowseEquipment.jsx)
**Changed from:**
- "Down Payment"
- "Full Payment"

**Changed to:**
- "GCash Down Payment"
- "GCash Full Payment"

### 2. Payment Method Display Labels
Updated all rental views to show descriptive payment method labels:

**New Labels:**
- `downpayment` → "GCash Down Payment (50%)"
- `fullpayment` → "GCash Full Payment (100%)"
- `gcash` → "GCash" (legacy support)
- `cod` → "COD" (legacy support)

### 3. Payment Proof Viewing
**Changed condition from:**
```javascript
{r.payment_method === 'gcash' && r.payment_proof && (
  <button>View Proof</button>
)}
```

**Changed to:**
```javascript
{r.payment_proof && (
  <button>View Proof</button>
)}
```

Now payment proof is viewable for ALL payment methods (not just GCash), since all new rentals require payment proof.

### 4. Color Coding
Added distinct colors for different payment methods:
- **Down Payment**: Blue badge
- **Full Payment**: Green badge
- **Legacy GCash/COD**: Yellow badge

### 5. Files Updated

#### Frontend Components:
1. `frontend_capstone/src/pages/renter/BrowseEquipment.jsx`
   - Updated payment method radio button labels

2. `frontend_capstone/src/pages/owner/OwnerRentals.jsx`
   - Updated card view payment display
   - Updated detail modal payment display
   - Removed conditional check for payment proof viewing

3. `frontend_capstone/src/components/RentalReceiptModal.jsx`
   - Updated payment method label display
   - Removed conditional check for payment proof viewing

4. `frontend_capstone/src/pages/renter/MyRentals.jsx`
   - Updated payment method display
   - Removed conditional check for payment proof viewing

5. `frontend_capstone/src/pages/renter/RenterDashboard.jsx`
   - Updated payment method chart labels

## Visual Changes

### Before:
- Payment: "Down Payment" or "Full Payment"
- View Proof button only shown for GCash payments

### After:
- Payment: "GCash Down Payment (50%)" or "GCash Full Payment (100%)"
- View Proof button shown for ALL payments with proof uploaded
- Color-coded badges for easy identification

## Benefits

1. **Clarity**: Users immediately know payment is via GCash
2. **Transparency**: Shows exact percentage (50% or 100%)
3. **Accessibility**: Payment proof always viewable when available
4. **Consistency**: Same labels across all pages
5. **Legacy Support**: Still handles old 'gcash' and 'cod' values
