<?php

namespace App\Console\Commands;

use App\Models\RentalRequest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoRejectExpiredRentals extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rentals:auto-reject';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically reject rental requests that have been pending for more than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $twentyFourHoursAgo = now()->subHours(24);

        // Find all forwarded rental requests older than 24 hours
        $expiredRentals = RentalRequest::where('status', 'forwarded')
            ->where('created_at', '<=', $twentyFourHoursAgo)
            ->with('equipment', 'renter')
            ->get();

        if ($expiredRentals->isEmpty()) {
            $this->info('No expired rental requests found.');
            Log::info('Auto-reject: No expired rental requests found.');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($expiredRentals as $rental) {
            try {
                $rental->update([
                    'status' => 'rejected',
                    'rejection_reason' => 'Automatically rejected: Owner did not respond within 24 hours.',
                ]);

                // Set equipment back to available if it was reserved
                if ($rental->equipment && $rental->equipment->status === 'rented') {
                    $rental->equipment->update(['status' => 'available']);
                }

                $count++;

                Log::info("Auto-rejected rental request #{$rental->id} for renter {$rental->renter->name}");
            } catch (\Exception $e) {
                Log::error("Failed to auto-reject rental request #{$rental->id}: " . $e->getMessage());
                $this->error("Failed to reject rental #{$rental->id}");
            }
        }

        $this->info("Successfully auto-rejected {$count} expired rental request(s).");
        Log::info("Auto-reject completed: {$count} rental request(s) rejected.");

        return Command::SUCCESS;
    }
}
