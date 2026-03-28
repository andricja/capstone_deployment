<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule auto-rejection of expired rental requests
// Runs every hour to check for rental requests older than 24 hours
Schedule::command('rentals:auto-reject')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();
