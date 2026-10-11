-- ════════════════════════════════════════════════════════════════════════════
-- FIX EXISTING PAYMENTS: Update payment_status from 'pending' to 'paid'
-- ════════════════════════════════════════════════════════════════════════════
-- This script updates rental_requests where paid_amount > 0 but payment_status
-- is still 'pending'. After the submitPayment() fix, new payments will correctly
-- be marked as 'paid', but existing payments need to be updated manually.
-- ════════════════════════════════════════════════════════════════════════════

-- STEP 1: Check current state (run this first to see affected records)
SELECT 
    id,
    renter_id,
    equipment_id,
    paid_amount,
    total_cost,
    payment_status,
    payment_method,
    created_at,
    updated_at
FROM rental_requests
WHERE paid_amount > 0 
  AND payment_status = 'pending';

-- STEP 2: Update the payment_status to 'paid' and set paid_at timestamp
UPDATE rental_requests 
SET 
    payment_status = 'paid',
    paid_at = COALESCE(updated_at, created_at)  -- Use updated_at or created_at as paid_at
WHERE 
    paid_amount > 0 
    AND payment_status = 'pending';

-- STEP 3: Verify the fix (should return empty result set)
SELECT 
    id,
    renter_id,
    equipment_id,
    paid_amount,
    total_cost,
    payment_status,
    payment_method,
    paid_at,
    created_at,
    updated_at
FROM rental_requests
WHERE paid_amount > 0 
  AND payment_status = 'pending';

-- STEP 4: Check all payments with their correct status
SELECT 
    id,
    renter_id,
    equipment_id,
    paid_amount,
    total_cost,
    payment_status,
    payment_method,
    paid_at,
    created_at
FROM rental_requests
WHERE paid_amount > 0
ORDER BY id DESC;

-- ════════════════════════════════════════════════════════════════════════════
-- EXPECTED RESULTS:
-- - All rental_requests with paid_amount > 0 should have payment_status = 'paid'
-- - paid_at should be populated with a timestamp
-- - Payment Tracker will show green "Paid" badges for 100% paid rentals
-- ════════════════════════════════════════════════════════════════════════════
