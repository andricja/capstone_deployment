<?php

namespace App\Console\Commands;

use App\Models\Equipment;
use App\Services\AuditService;
use Illuminate\Console\Command;

class DisableExpiredEquipment extends Command
{
    protected $signature = 'equipment:disable-expired';
    protected $description = 'Disable equipment whose approval has expired';

    public function handle()
    {
        $expiredEquipment = Equipment::whereNotNull('approval_expires_at')
            ->where('approval_expires_at', '<=', now())
            ->whereIn('status', ['available', 'rented', 'maintenance'])
            ->get();

        if ($expiredEquipment->isEmpty()) {
            $this->info('No expired equipment found.');
            return 0;
        }

        $count = 0;
        foreach ($expiredEquipment as $equipment) {
            $equipment->update(['status' => 'maintenance']);
            
            // Log the auto-expiry
            AuditService::logUpdate($equipment, [
                'status' => $equipment->status
            ], "Equipment approval expired automatically. Validity period ended on " . $equipment->approval_expires_at->format('M d, Y'));
            
            $count++;
        }

        $this->info("Disabled {$count} expired equipment.");
        return 0;
    }
}
