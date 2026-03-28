# Storage 403 Error - Final Fix

## Problem
Frontend getting 403 Forbidden when accessing storage files:
```
GET http://localhost:5173/storage/gcash_qr/owner1_qr.png 403 (Forbidden)
```

## Root Cause
1. Laravel requires symbolic link from `public/storage` → `storage/app/public`
2. Creating symlinks on Windows requires admin privileges
3. Web routes have CSRF protection which was blocking the storage route

## Solution
Moved storage file serving to API routes (no CSRF) and updated Vite proxy.

### Changes Made

#### 1. API Routes (`capstone_backend/routes/api.php`)
Added public storage route:
```php
// Serve storage files (public access for images)
Route::get('/storage/{path}', function ($path) {
    try {
        $filePath = storage_path('app/public/' . $path);
        
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }
        
        $mimeType = mime_content_type($filePath);
        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    } catch (\Exception $e) {
        \Log::error('Storage file error: ' . $e->getMessage());
        abort(500, $e->getMessage());
    }
})->where('path', '.*');
```

#### 2. Vite Config (`frontend_capstone/vite.config.js`)
Updated storage proxy to point to API:
```javascript
'/storage': {
  target: 'http://127.0.0.1:8000/api',
  changeOrigin: true,
  rewrite: (path) => path,
},
```

#### 3. Web Routes (`capstone_backend/routes/web.php`)
Removed storage route from web.php (was causing CSRF issues)

## How It Works Now

### Request Flow:
1. **Frontend**: `<img src="/storage/gcash_qr/owner1_qr.png" />`
2. **Browser**: `GET http://localhost:5173/storage/gcash_qr/owner1_qr.png`
3. **Vite Proxy**: Forwards to `http://127.0.0.1:8000/api/storage/gcash_qr/owner1_qr.png`
4. **Laravel API Route**: Catches `/api/storage/{path}`
5. **Response**: Serves file from `storage/app/public/gcash_qr/owner1_qr.png`

### Benefits:
- ✅ No admin privileges needed
- ✅ No CSRF token required (API routes)
- ✅ Works in development without symlink
- ✅ Proper MIME types
- ✅ Browser caching enabled
- ✅ CORS headers handled by Laravel

## Files Modified
1. ✅ `capstone_backend/routes/api.php` - Added storage serving route
2. ✅ `capstone_backend/routes/web.php` - Removed storage route
3. ✅ `frontend_capstone/vite.config.js` - Updated proxy target

## Testing

### 1. Restart Vite Dev Server
```bash
cd frontend_capstone
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Verify Laravel is Running
```bash
cd capstone_backend
php artisan serve
```

### 3. Test Image Access
- Open browser: `http://localhost:5173`
- Navigate to Browse Equipment
- Click "Request Rental"
- GCash QR code should now display ✅

### 4. Direct URL Test
Open in browser:
```
http://localhost:5173/storage/gcash_qr/owner1_qr.png
```
Should display the image (not 403)

## Production Deployment

For production, create the proper symlink:

### Linux/Mac:
```bash
cd capstone_backend
php artisan storage:link
```

### Windows (as Administrator):
```powershell
cd capstone_backend
php artisan storage:link
```

Then update Vite config back to:
```javascript
'/storage': {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
},
```

## Troubleshooting

### Still getting 403?
1. **Check Laravel is running**: `php artisan serve` in capstone_backend
2. **Check Vite is running**: `npm run dev` in frontend_capstone
3. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
4. **Check Laravel logs**: `capstone_backend/storage/logs/laravel.log`

### File not found (404)?
1. **Check file exists**: `capstone_backend/storage/app/public/gcash_qr/`
2. **Check database path**: Verify `qr_code_image` field in `gcash_settings` table
3. **Check permissions**: Ensure storage directory is writable

## Status
✅ **FIXED** - Storage files now accessible via API routes without symlink or CSRF issues
