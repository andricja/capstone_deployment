# AdCarousel Import Path Fix

## Problem
Vite build error:
```
Failed to resolve import "../api/axios" from "src/components/AdCarousel.jsx". Does the file exist?
```

## Root Cause
`AdCarousel.jsx` was trying to import from `../api/axios`, but the actual API configuration file is located at `../lib/api.js`.

## Solution
Updated the import path in `AdCarousel.jsx`:

**Before:**
```javascript
import api from '../api/axios';
```

**After:**
```javascript
import api from '../lib/api';
```

## File Updated
- `frontend_capstone/src/components/AdCarousel.jsx`

## Result
✅ Import error resolved
✅ AdCarousel component can now properly import the API configuration
✅ Vite build no longer fails

## Note
The `ManageAds.jsx` file appears to be incomplete/corrupted and may need to be recreated if the ads management feature is needed. However, the AdCarousel component (which displays ads to users) is now working correctly.
