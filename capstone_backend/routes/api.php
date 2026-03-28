<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AdController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\ArchiveController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\GcashSettingController;
use App\Http\Controllers\Api\MessageRequestController;
use App\Http\Controllers\Api\RentalRequestController;
use App\Http\Controllers\Api\SmtpSettingController;
use Illuminate\Support\Facades\Route;

/* ====================================================================== */
/*  PUBLIC (no auth)                                                       */
/* ====================================================================== */

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerificationCode']);

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

// Address data (public)
Route::get('/addresses/municipalities', [AddressController::class, 'getMunicipalities']);
Route::get('/addresses/municipalities/{municipality}/barangays', [AddressController::class, 'getBarangays']);
Route::get('/addresses/municipalities/{municipality}/coordinates', [AddressController::class, 'getCoordinates']);
Route::get('/addresses/municipalities/{municipality}/barangays/{barangay}/coordinates', [AddressController::class, 'getBarangayCoordinates']);
Route::get('/addresses/coordinates', [AddressController::class, 'getAllCoordinates']);

// Active ads (public - for renter pages)
Route::get('/ads/active', [AdController::class, 'getActiveAds']);
Route::get('/addresses/complete', [AddressController::class, 'getCompleteAddressData']);

// Routing service (public)
Route::post('/routing/get-route', [AddressController::class, 'getRoute']);

/* ====================================================================== */
/*  AUTHENTICATED (any role)                                               */
/* ====================================================================== */

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'user']);

    // Profile / Account settings (any role)
    Route::put('/profile',  [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'updatePassword']);

    // Dashboard (role-aware)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Browse equipment (all authenticated users)
    Route::get('/equipment',      [EquipmentController::class, 'index']);
    Route::get('/equipment/{equipment}', [EquipmentController::class, 'show']);

    // Get owner GCash info (for renters making payments)
    Route::get('/gcash/{ownerId}', [GcashSettingController::class, 'ownerGcash']);

    /* ------------------------------------------------------------------ */
    /*  RENTER routes                                                      */
    /* ------------------------------------------------------------------ */
    Route::middleware('role:renter')->prefix('renter')->group(function () {

        // Rental requests
        Route::get('/rental-requests',  [RentalRequestController::class, 'myRequests']);
        Route::post('/rental-requests', [RentalRequestController::class, 'store']);
        Route::post('/rental-requests/calculate-fee', [RentalRequestController::class, 'calculateTransportationFee']);

        // Message / inquiries
        Route::get('/messages',  [MessageRequestController::class, 'myMessages']);
        Route::post('/messages', [MessageRequestController::class, 'store']);

        // Archive
        Route::get('/archived/rentals',             [ArchiveController::class, 'renterArchivedRentals']);
        Route::patch('/archived/rentals/{id}',      [ArchiveController::class, 'renterToggleRental']);
        Route::delete('/archived/rentals/{id}',     [ArchiveController::class, 'renterDeleteRental']);
        Route::get('/archived/messages',            [ArchiveController::class, 'renterArchivedMessages']);
        Route::patch('/archived/messages/{id}',     [ArchiveController::class, 'renterToggleMessage']);
        Route::delete('/archived/messages/{id}',    [ArchiveController::class, 'renterDeleteMessage']);
    });

    /* ------------------------------------------------------------------ */
    /*  OWNER routes                                                       */
    /* ------------------------------------------------------------------ */
    Route::middleware('role:owner')->prefix('owner')->group(function () {

        // Equipment management
        Route::get('/equipment',               [EquipmentController::class, 'myEquipment']);
        Route::post('/equipment',              [EquipmentController::class, 'store']);
        Route::put('/equipment/{equipment}',   [EquipmentController::class, 'update']);
        Route::delete('/equipment/{equipment}',[EquipmentController::class, 'destroy']);

        // Equipment status toggles
        Route::patch('/equipment/{equipment}/set-maintenance', [EquipmentController::class, 'setMaintenance']);
        Route::patch('/equipment/{equipment}/set-available',   [EquipmentController::class, 'setAvailable']);

        // Rental requests for owner's equipment
        Route::get('/rental-requests',                          [RentalRequestController::class, 'ownerRequests']);
        Route::patch('/rental-requests/{rentalRequest}/approve',[RentalRequestController::class, 'approve']);
        Route::patch('/rental-requests/{rentalRequest}/reject', [RentalRequestController::class, 'reject']);

        // GCash settings
        Route::get('/gcash-settings',  [GcashSettingController::class, 'show']);
        Route::post('/gcash-settings', [GcashSettingController::class, 'store']);

        // Archive
        Route::get('/archived/equipment',            [ArchiveController::class, 'ownerArchivedEquipment']);
        Route::patch('/archived/equipment/{id}',     [ArchiveController::class, 'ownerToggleEquipment']);
        Route::delete('/archived/equipment/{id}',    [ArchiveController::class, 'ownerDeleteEquipment']);
        Route::get('/archived/rentals',              [ArchiveController::class, 'ownerArchivedRentals']);
        Route::patch('/archived/rentals/{id}',       [ArchiveController::class, 'ownerToggleRental']);
        Route::delete('/archived/rentals/{id}',      [ArchiveController::class, 'ownerDeleteRental']);
    });

    /* ------------------------------------------------------------------ */
    /*  ADMIN routes                                                       */
    /* ------------------------------------------------------------------ */
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Equipment approval
        Route::get('/equipment/pending',               [EquipmentController::class, 'pending']);
        Route::get('/equipment/all',                   [EquipmentController::class, 'adminIndex']);
        Route::patch('/equipment/{equipment}/approve',  [EquipmentController::class, 'approve']);
        Route::patch('/equipment/{equipment}/reject',   [EquipmentController::class, 'reject']);

        // Rental requests overview
        Route::get('/rental-requests', [RentalRequestController::class, 'index']);

        // Message request management
        Route::get('/messages',                              [MessageRequestController::class, 'index']);
        Route::patch('/messages/{messageRequest}/status',    [MessageRequestController::class, 'updateStatus']);
        Route::delete('/messages/{messageRequest}',          [MessageRequestController::class, 'destroy']);

        // Owners management
        Route::get('/owners', [AuthController::class, 'owners']);
        Route::get('/owners/stats', [AuthController::class, 'ownerStats']);
        Route::get('/owners/charts', [AuthController::class, 'ownerChartData']);
        Route::get('/owners/{id}', [AuthController::class, 'ownerShow']);
        Route::patch('/owners/{id}/archive', [AuthController::class, 'archiveOwner']);
        Route::post('/owners/{ownerId}/equipment', [EquipmentController::class, 'adminStore']);

        // Revenue reports
        Route::get('/reports/revenue',    [AdminReportController::class, 'revenue']);
        Route::get('/reports/revenue/csv',[AdminReportController::class, 'exportCsv']);

        // Account management (approve / reject registrations)
        Route::get('/accounts',              [AccountController::class, 'index']);
        Route::get('/accounts/stats',        [AccountController::class, 'stats']);
        Route::patch('/accounts/{id}/approve', [AccountController::class, 'approve']);
        Route::patch('/accounts/{id}/reject',  [AccountController::class, 'reject']);
        Route::delete('/accounts/{id}',        [AccountController::class, 'destroy']);

        // SMTP settings
        Route::get('/smtp-settings',       [SmtpSettingController::class, 'show']);
        Route::post('/smtp-settings',      [SmtpSettingController::class, 'store']);
        Route::post('/smtp-settings/test', [SmtpSettingController::class, 'test']);

        // Archive
        Route::get('/archived/all',                   [ArchiveController::class, 'adminArchivedAll']);
        Route::patch('/archived/owners/{id}',         [ArchiveController::class, 'adminToggleOwner']);
        Route::delete('/archived/owners/{id}',        [ArchiveController::class, 'adminDeleteOwner']);
        Route::patch('/archived/equipment/{id}',      [ArchiveController::class, 'adminToggleEquipment']);
        Route::delete('/archived/equipment/{id}',     [ArchiveController::class, 'adminDeleteEquipment']);
        Route::patch('/archived/rentals/{id}',        [ArchiveController::class, 'adminToggleRental']);
        Route::delete('/archived/rentals/{id}',       [ArchiveController::class, 'adminDeleteRental']);
        Route::patch('/archived/messages/{id}',       [ArchiveController::class, 'adminToggleMessage']);
        Route::delete('/archived/messages/{id}',      [ArchiveController::class, 'adminDeleteMessage']);

        // Ad management
        Route::get('/ads',                    [AdController::class, 'index']);
        Route::post('/ads',                   [AdController::class, 'store']);
        Route::put('/ads/{ad}',               [AdController::class, 'update']);
        Route::delete('/ads/{ad}',            [AdController::class, 'destroy']);
        Route::post('/ads/{ad}/toggle-status', [AdController::class, 'toggleStatus']);
    });
});
