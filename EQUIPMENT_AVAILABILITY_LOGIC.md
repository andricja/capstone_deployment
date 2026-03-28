# Equipment Availability Logic

## Overview
Equipment availability is now automatically managed based on rental request status to prevent double-booking.

## How It Works

### 1. When Renter Submits Rental Request
**Action**: Equipment status changes from `available` → `rented`

**Why**: This immediately reserves the equipment and prevents other renters from booking it while the owner reviews the request.

**Code Location**: `RentalRequestController@store`
```php
// Make equipment unavailable when rental request is created
$equipment->status = 'rented';
$equipment->save();
```

### 2. When Owner Approves Request
**Action**: Equipment status remains `rented`

**Why**: The equipment is confirmed for rental and should stay unavailable until the rental period ends.

**Code Location**: `RentalRequestController@approve`
```php
// Equipment is already "rented" from when request was created
// Just confirm the rental request status
$rentalRequest->update(['status' => 'approved']);
```

### 3. When Owner Rejects Request
**Action**: Equipment status changes from `rented` → `available`

**Why**: The rental is cancelled, so the equipment becomes available for other renters to book.

**Code Location**: `RentalRequestController@reject`
```php
// Set equipment back to "available" when rejected
$equipment->update(['status' => 'available']);
```

## Equipment Status Flow

```
Initial State: available
       ↓
Renter submits request → rented (unavailable to others)
       ↓
       ├─→ Owner approves → stays rented (unavailable until rental ends)
       │
       └─→ Owner rejects → available (can be rented again)
```

## Benefits

1. **Prevents Double-Booking**: Equipment can't be requested by multiple renters simultaneously
2. **Fair Queue System**: First renter to submit gets priority
3. **Automatic Management**: No manual status updates needed
4. **Clear Workflow**: Status always reflects current availability

## Edge Cases Handled

### Multiple Pending Requests
- Only the first request can be submitted (equipment becomes rented)
- Other renters see equipment as unavailable
- If rejected, equipment becomes available for new requests

### Owner Takes Too Long
- Equipment stays rented while request is pending
- Auto-reject system (if implemented) will free up equipment after timeout
- Prevents indefinite holds

### Renter Cancels
- If cancellation feature is added, equipment should return to `available`
- Similar logic to rejection

## Database Changes

No migration needed - uses existing `status` column on `equipment` table with values:
- `available` - Can be rented
- `rented` - Currently unavailable (pending or approved rental)
- `maintenance` - Owner-set unavailable status

## Testing Scenarios

1. **Happy Path**:
   - Renter requests → Equipment unavailable
   - Owner approves → Equipment stays unavailable
   - ✅ Works as expected

2. **Rejection Path**:
   - Renter requests → Equipment unavailable
   - Owner rejects → Equipment available again
   - ✅ Works as expected

3. **Multiple Renters**:
   - Renter A requests → Equipment unavailable
   - Renter B tries to request → Blocked (equipment not available)
   - Owner rejects A → Equipment available
   - Renter B can now request
   - ✅ Works as expected

## Future Enhancements

1. **Auto-Release After Rental Period**:
   - Schedule job to check `end_date`
   - Automatically set equipment to `available` when rental period ends

2. **Booking Calendar**:
   - Show future availability
   - Allow advance bookings
   - Prevent overlapping rentals

3. **Waitlist System**:
   - Queue renters when equipment is unavailable
   - Notify when equipment becomes available

## Files Modified

- `capstone_backend/app/Http/Controllers/Api/RentalRequestController.php`
  - `store()` method - Sets equipment to rented
  - `approve()` method - Keeps equipment rented
  - `reject()` method - Returns equipment to available
