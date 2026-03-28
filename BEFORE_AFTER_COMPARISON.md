# Before & After: Pricing Model Change

## Visual Comparison

### Owner Equipment Form

#### BEFORE (Daily Rate)
```
┌─────────────────────────────────────┐
│ Add Equipment                       │
├─────────────────────────────────────┤
│ Equipment Name: [John's Harvester]  │
│ Category: [Harvester ▼]             │
│ Daily Rate (₱): [1500]              │
│ Description: [...]                  │
│ Location: [...]                     │
└─────────────────────────────────────┘

Display:
"₱1,500/day"
```

#### AFTER (Price Per Square Meter)
```
┌─────────────────────────────────────┐
│ Add Equipment                       │
├─────────────────────────────────────┤
│ Equipment Name: [John's Harvester]  │
│ Category: [Harvester ▼]             │
│ Price per sqm (₱): [0.50]           │
│ Coverage Rate (sqm/hr): [1500]      │
│ Description: [...]                  │
│ Location: [...]                     │
└─────────────────────────────────────┘

Display:
"₱0.50/sqm • 1,500 sqm/hr"
```

### Renter Browse Equipment

#### BEFORE (Daily Rate)
```
┌────────────────────────────────────┐
│ 🚜 John's Harvester                │
│ harvester • Calapan                │
│                                    │
│ ₱1,500/day                         │
│ + ₱250 delivery                    │
│                                    │
│ [Request Rental]                   │
└────────────────────────────────────┘
```

#### AFTER (Price Per Square Meter)
```
┌────────────────────────────────────┐
│ 🚜 John's Harvester                │
│ harvester • Calapan                │
│                                    │
│ ₱0.50/sqm                          │
│ 1,500 sqm/hr coverage              │
│                                    │
│ [Request Rental]                   │
└────────────────────────────────────┘
```

### Rental Request Modal

#### BEFORE (Daily Rate)
```
┌─────────────────────────────────────────────┐
│ Request Rental                              │
│ John's Harvester (harvester) — ₱1,500/day   │
├─────────────────────────────────────────────┤
│ Farm Size (sqm): [10000]                    │
│ Minimum 100 sqm. Coverage rate for          │
│ harvester: ~1,500 sqm/hr                    │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 6.7 Est. Hours                      │    │
│ │ 1 Rental Day(s)                     │    │
│ │ ₱1,500 Total Cost                   │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Cost Breakdown:                             │
│ Base Cost (₱1,500 × 1 day)    ₱1,500       │
│ Delivery Fee                  ₱250          │
│ Service Charge (5%)           ₱75           │
│ ─────────────────────────────────────       │
│ Estimated Total               ₱1,825        │
└─────────────────────────────────────────────┘
```

#### AFTER (Price Per Square Meter)
```
┌─────────────────────────────────────────────┐
│ Request Rental                              │
│ John's Harvester (harvester)                │
│ ₱0.50/sqm • 1,500 sqm/hr                    │
├─────────────────────────────────────────────┤
│ Farm Size (sqm): [10000]                    │
│ Minimum 100 sqm. Coverage rate: 1,500 sqm/hr│
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 6.7 Est. Hours                      │    │
│ │ 1 Rental Day(s)                     │    │
│ │ ₱5,250 Total Cost                   │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Cost Breakdown:                             │
│ Base Cost (₱0.50/sqm × 10,000 sqm) ₱5,000  │
│ Delivery Fee                        ₱250    │
│ Service Charge (5%)                 ₱250    │
│ ─────────────────────────────────────       │
│ Estimated Total                     ₱5,500  │
└─────────────────────────────────────────────┘
```

## Cost Calculation Comparison

### Scenario: 10,000 sqm farm

#### BEFORE (Daily Rate)
```
Equipment: Harvester
Daily Rate: ₱1,500/day
Fixed Coverage Rate: 1,500 sqm/hr (by category)

Calculation:
1. Estimated Hours = 10,000 ÷ 1,500 = 6.7 hours
2. Rental Days = ceil(6.7 ÷ 8) = 1 day
3. Base Cost = ₱1,500 × 1 day = ₱1,500
4. Service Charge = ₱1,500 × 5% = ₱75
5. Total = ₱1,500 + ₱250 + ₱75 = ₱1,825
```

#### AFTER (Price Per Square Meter)
```
Equipment: Harvester
Price per sqm: ₱0.50/sqm
Owner's Coverage Rate: 1,500 sqm/hr

Calculation:
1. Estimated Hours = 10,000 ÷ 1,500 = 6.7 hours
2. Rental Days = ceil(6.7 ÷ 8) = 1 day
3. Base Cost = ₱0.50 × 10,000 sqm = ₱5,000
4. Service Charge = ₱5,000 × 5% = ₱250
5. Total = ₱5,000 + ₱250 + ₱250 = ₱5,500
```

## Key Differences

### 1. Pricing Basis
| Before | After |
|--------|-------|
| Per day | Per square meter |
| Fixed by owner | Based on actual area |
| Same cost regardless of farm size | Scales with farm size |

### 2. Coverage Rate
| Before | After |
|--------|-------|
| Fixed by category | Set by owner |
| System-defined | Owner-defined |
| Cannot be changed | Flexible per equipment |

### 3. Cost Calculation
| Before | After |
|--------|-------|
| Daily Rate × Days | Price/sqm × Farm Size |
| Favors large farms | Fair for all sizes |
| Less transparent | More transparent |

### 4. Owner Control
| Before | After |
|--------|-------|
| Set daily rate only | Set price/sqm + coverage rate |
| Limited flexibility | Full control |
| Category-based rates | Equipment-specific rates |

### 5. Renter Understanding
| Before | After |
|--------|-------|
| "₱1,500 per day" | "₱0.50 per sqm" |
| Hard to estimate | Easy to calculate |
| Depends on days | Depends on farm size |

## Database Schema Changes

### equipment Table

#### BEFORE
```sql
CREATE TABLE equipment (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(255),
    daily_rate DECIMAL(10,2),  -- Old field
    location VARCHAR(255),
    ...
);
```

#### AFTER
```sql
CREATE TABLE equipment (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(255),
    price_per_sqm DECIMAL(10,2),  -- New field (renamed)
    coverage_rate DECIMAL(10,2),  -- New field
    location VARCHAR(255),
    ...
);
```

## API Response Changes

### Equipment Object

#### BEFORE
```json
{
  "id": 1,
  "name": "John's Harvester",
  "category": "harvester",
  "daily_rate": "1500.00",
  "status": "available"
}
```

#### AFTER
```json
{
  "id": 1,
  "name": "John's Harvester",
  "category": "harvester",
  "price_per_sqm": "0.50",
  "coverage_rate": "1500.00",
  "status": "available"
}
```

### Cost Breakdown

#### BEFORE
```json
{
  "cost_breakdown": {
    "daily_rate": "1500.00",
    "rental_days": 1,
    "base_cost": "1500.00",
    "delivery_fee": "250.00",
    "service_charge": "75.00",
    "total_cost": "1825.00"
  }
}
```

#### AFTER
```json
{
  "cost_breakdown": {
    "price_per_sqm": "0.50",
    "coverage_rate": "1500.00",
    "farm_size_sqm": 10000,
    "estimated_hours": 6.7,
    "rental_days": 1,
    "base_cost": "5000.00",
    "delivery_fee": "250.00",
    "service_charge": "250.00",
    "total_cost": "5500.00"
  }
}
```

## Benefits Summary

### For Owners
✅ More flexible pricing strategy
✅ Can set competitive rates per sqm
✅ Control over coverage rate
✅ Better reflects equipment capability
✅ Fair pricing for all farm sizes

### For Renters
✅ Transparent pricing (price × area)
✅ Easy to calculate costs
✅ Fair for small and large farms
✅ Can compare equipment easily
✅ Knows exact coverage rate

### For System
✅ More accurate cost calculations
✅ Better data for analytics
✅ Flexible pricing model
✅ Scalable for different equipment types
✅ Owner-defined rates instead of fixed

## Migration Impact

### Existing Equipment
- All existing equipment will have `price_per_sqm` = old `daily_rate`
- All existing equipment will have `coverage_rate` = 1500 (default)
- Owners can update their equipment to set proper rates

### Existing Rental Requests
- No impact on existing rental requests
- Historical data preserved
- New requests use new calculation

## Testing Scenarios

### Scenario 1: Small Farm (500 sqm)
```
Price per sqm: ₱0.50
Coverage rate: 1,500 sqm/hr

Estimated hours: 500 ÷ 1,500 = 0.33 hours
Rental days: 1 day (minimum)
Base cost: ₱0.50 × 500 = ₱250
Total: ₱250 + delivery + service charge
```

### Scenario 2: Medium Farm (5,000 sqm)
```
Price per sqm: ₱0.50
Coverage rate: 1,500 sqm/hr

Estimated hours: 5,000 ÷ 1,500 = 3.3 hours
Rental days: 1 day
Base cost: ₱0.50 × 5,000 = ₱2,500
Total: ₱2,500 + delivery + service charge
```

### Scenario 3: Large Farm (20,000 sqm)
```
Price per sqm: ₱0.50
Coverage rate: 1,500 sqm/hr

Estimated hours: 20,000 ÷ 1,500 = 13.3 hours
Rental days: 2 days
Base cost: ₱0.50 × 20,000 = ₱10,000
Total: ₱10,000 + delivery + service charge
```

## Conclusion

The pricing model change from "Daily Rate" to "Price Per Square Meter" provides:
- More transparent and fair pricing
- Better control for owners
- Easier understanding for renters
- Accurate cost calculations based on actual work
- Flexible coverage rates per equipment

**Status: ✅ Implementation Complete**
