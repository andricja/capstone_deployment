# Storage Files 403 Forbidden - Fixed

## Problem
Frontend was getting 403 Forbidden error when trying to access uploaded files:
```
GET http://localhost:5173/storage/gcash_qr/owner1_qr.png 403 (Forbidden)
```

## Root Cause
Laravel requires a symbolic link from `public/storage` to `storage/app/public` to serve uploaded files. The symlink was missing, and creating it requires administrator privileges on Windows.

## Solution
Added a route in `routes/web.php` to serve storage files directly through Laravel without requiring a symlink.

### Code Added
```php
// Serve storage files (for development when symlink can't be created)
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    
    if (!file_exists($filePath)) {
        abort(404);
    }
    
    return response()->file($filePath);
})->where('path', '.*');
```

## How It Works

1. **Frontend Request**: `http://localhost:5173/storage/gcash_qr/owner1_qr.png`
2. **Vite Proxy**: Forwards to `http://127.0.0.1:8000/storage/gcash_qr/owner1_qr.png`
3. **Laravel Route**: Catches `/storage/{path}` and serves file from `storage/app/public/`
4. **Response**: File is returned with correct MIME type

## Vite Proxy Configuration
Already configured in `frontend_capstone/vite.config.js`:
```javascript
proxy: {
  '/storage': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
}
```

## CORS Configuration
Already configured in `capstone_backend/config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
'allowed_origins' => [
    'http://localhost:5173',  // Vite dev server
    'http://127.0.0.1:5173',
],
```

## File Storage Structure
```
capstone_backend/
├── storage/
│   └── app/
│       └── public/
│           ├── gcash_qr/          # GCash QR codes
│           ├── equipment_images/  # Equipment photos
│           └── payment_proofs/    # Payment screenshots
└── public/
    └── storage/  ← Should be symlink (but route works without it)
```

## Alternative Solution (Production)
For production deployment, create the symlink properly:

### Linux/Mac:
```bash
php artisan storage:link
```

### Windows (as Administrator):
```powershell
php artisan storage:link
```

Or manually:
```powershell
New-Item -ItemType SymbolicLink -Path "public\storage" -Target "..\storage\app\public"
```

## Testing

1. **Start Laravel backend**:
   ```bash
   cd capstone_backend
   php artisan serve
   ```

2. **Start Vite frontend**:
   ```bash
   cd frontend_capstone
   npm run dev
   ```

3. **Test image access**:
   - Open browser to `http://localhost:5173`
   - Navigate to Browse Equipment
   - Click "Request Rental" on any equipment
   - GCash QR code should now display without 403 error

## Files Modified
- ✅ `capstone_backend/routes/web.php` - Added storage file serving route

## Status
✅ **FIXED** - Storage files now accessible without symlink
