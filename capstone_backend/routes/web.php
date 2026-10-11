<?php

use Illuminate\Support\Facades\Route;

// Disabled Inertia routes - Using separate React frontend
// All routes are in routes/api.php

Route::get('/', function () {
    return response()->json([
        'name' => 'FERMs API',
        'version' => '1.0.0',
        'status' => 'running',
        'message' => 'Backend API is running. Frontend is at http://localhost:5173',
    ]);
});

require __DIR__.'/settings.php';
