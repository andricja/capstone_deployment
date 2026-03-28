# Ad System Guide - FERMs

## Overview
The Ad System allows administrators to create and manage promotional advertisements that are displayed to renters on their dashboard. Ads can include images, descriptions, and external links.

## How It Works

### 1. Ad Display (Renter View)
**Location**: Renter Dashboard (top of page, above "Renter Dashboard" heading)

**Component**: `AdCarousel.jsx`
- Automatically fetches active ads from the backend
- Displays ads in a carousel/slideshow format
- Shows one ad at a time with navigation arrows
- Auto-advances every 5 seconds
- Renters can click on ads to visit external links (if provided)
- Can be dismissed with an X button

### 2. Ad Management (Admin View)
**Location**: Admin Panel → Manage Ads (when implemented)

**Features**:
- Create new ads
- Edit existing ads
- Delete ads
- Toggle ad status (active/inactive)
- Set display order
- Set start/end dates
- Upload ad images

### 3. Database Structure

**Table**: `ads`

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| title | string | Ad headline (required) |
| description | text | Ad description (optional) |
| image | string | Path to ad image (optional) |
| link_url | string | External link URL (optional) |
| status | enum | 'active' or 'inactive' |
| display_order | integer | Order of display (lower = first) |
| start_date | timestamp | When ad becomes active |
| end_date | timestamp | When ad expires |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |
| deleted_at | timestamp | Soft delete (archiving) |

### 4. API Endpoints

#### Get Active Ads (Public - for renters)
```
GET /api/ads/active
```
Returns only active ads, ordered by display_order and creation date.

#### Get All Ads (Admin only)
```
GET /api/ads
```
Returns all ads for management.

#### Create Ad (Admin only)
```
POST /api/ads
```
**Body**:
- title (required)
- description (optional)
- image (optional, file upload)
- link_url (optional)
- status (required: 'active' or 'inactive')
- display_order (optional, default: 0)
- start_date (optional)
- end_date (optional)

#### Update Ad (Admin only)
```
PUT /api/ads/{id}
```
Same fields as create.

#### Delete Ad (Admin only)
```
DELETE /api/ads/{id}
```
Permanently deletes the ad and its image.

#### Toggle Status (Admin only)
```
POST /api/ads/{id}/toggle-status
```
Switches between active/inactive.

## Mock Data Created

I've created 5 sample ads:

### 1. Premium Farm Equipment Sale - 20% Off!
- **Status**: Active
- **Description**: Get 20% discount on all premium tractors and tillers this month
- **Link**: https://example.com/sale
- **Duration**: 30 days

### 2. New Harvester Models Available
- **Status**: Active
- **Description**: Latest harvester models with improved efficiency
- **Link**: https://example.com/harvesters
- **Duration**: 60 days

### 3. Free Delivery Within 10km
- **Status**: Active
- **Description**: Rent any equipment and get FREE delivery within 10km radius
- **Duration**: 45 days

### 4. Agricultural Training Workshop
- **Status**: Active
- **Description**: Free workshop on modern farming techniques
- **Link**: https://example.com/workshop
- **Duration**: 15 days

### 5. Seasonal Maintenance Special
- **Status**: Inactive (won't display)
- **Description**: Equipment servicing special rates
- **Duration**: Expired

## How to View the Ads

1. **Login as a Renter**
2. **Go to Dashboard**
3. **Look at the top of the page** - you'll see the ad carousel
4. **Navigate through ads** using left/right arrows
5. **Click on an ad** to visit the external link (if available)
6. **Dismiss the carousel** by clicking the X button

## Ad Carousel Features

### Visual Elements:
- **Large banner** with title and description
- **Navigation arrows** (left/right) to browse ads
- **Dot indicators** showing current position
- **Auto-advance** every 5 seconds
- **External link icon** when ad has a URL
- **Close button** to dismiss the carousel

### Behavior:
- Only shows **active** ads
- Respects **display_order** (lower numbers first)
- Automatically **cycles** through ads
- **Pauses** on hover
- **Responsive** design for mobile/desktop

## Adding Images to Ads

To add images to ads:

1. Place images in `capstone_backend/storage/app/public/ads/`
2. Update the ad record with the image path
3. Images will be served via `/storage/ads/filename.jpg`

Example:
```php
Ad::find(1)->update([
    'image' => 'ads/promo-banner.jpg'
]);
```

## Best Practices

1. **Keep titles short** (under 60 characters)
2. **Descriptions should be concise** (under 200 characters)
3. **Use high-quality images** (recommended: 1200x400px)
4. **Set appropriate start/end dates** for time-sensitive promotions
5. **Use display_order** to prioritize important ads
6. **Test external links** before activating ads
7. **Regularly review and update** expired ads

## Future Enhancements

- Click tracking/analytics
- A/B testing different ad versions
- Targeting specific user groups
- Scheduled activation/deactivation
- Image optimization and resizing
- Video ad support
- Mobile-specific ad formats

## Troubleshooting

**Ads not showing?**
- Check if ads are set to 'active' status
- Verify start_date is in the past
- Verify end_date is in the future (or null)
- Check browser console for API errors

**Images not loading?**
- Ensure storage link is created: `php artisan storage:link`
- Check file permissions on storage directory
- Verify image path in database matches actual file location
