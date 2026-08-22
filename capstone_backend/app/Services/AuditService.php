<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Log an audit event
     */
    public static function log(
        string $action,
        ?string $auditableType = null,
        ?int $auditableId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): void {
        $request = request();
        
        // Get real IP address (handles proxies)
        $ipAddress = $request->ip();
        
        // If still localhost, try to get from headers (for proxied requests)
        if ($ipAddress === '127.0.0.1' || $ipAddress === '::1') {
            $ipAddress = $request->header('X-Forwarded-For') 
                ?? $request->header('X-Real-IP') 
                ?? $request->header('CF-Connecting-IP') // CloudFlare
                ?? $ipAddress;
            
            // X-Forwarded-For can contain multiple IPs, get the first one
            if (str_contains($ipAddress, ',')) {
                $ipAddress = trim(explode(',', $ipAddress)[0]);
            }
        }
        
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'ip_address' => $ipAddress,
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Log a create action
     */
    public static function logCreate($model, ?string $description = null): void
    {
        self::log(
            'create',
            get_class($model),
            $model->id,
            null,
            $model->toArray(),
            $description ?? "Created {$model->getTable()} #{$model->id}"
        );
    }

    /**
     * Log an update action
     */
    public static function logUpdate($model, array $oldValues, ?string $description = null): void
    {
        // Get only changed values
        $newValues = [];
        foreach ($oldValues as $key => $oldValue) {
            if ($model->$key != $oldValue) {
                $newValues[$key] = $model->$key;
            }
        }

        if (!empty($newValues)) {
            self::log(
                'update',
                get_class($model),
                $model->id,
                $oldValues,
                $newValues,
                $description ?? "Updated {$model->getTable()} #{$model->id}"
            );
        }
    }

    /**
     * Log a delete action
     */
    public static function logDelete($model, ?string $description = null): void
    {
        self::log(
            'delete',
            get_class($model),
            $model->id,
            $model->toArray(),
            null,
            $description ?? "Deleted {$model->getTable()} #{$model->id}"
        );
    }

    /**
     * Log a login event
     */
    public static function logLogin(?string $description = null): void
    {
        self::log(
            'login',
            null,
            null,
            null,
            null,
            $description ?? 'User logged in'
        );
    }

    /**
     * Log a logout event
     */
    public static function logLogout(?string $description = null): void
    {
        self::log(
            'logout',
            null,
            null,
            null,
            null,
            $description ?? 'User logged out'
        );
    }

    /**
     * Log an approval action
     */
    public static function logApprove($model, ?string $description = null): void
    {
        self::log(
            'approve',
            get_class($model),
            $model->id,
            null,
            ['status' => 'approved'],
            $description ?? "Approved {$model->getTable()} #{$model->id}"
        );
    }

    /**
     * Log a rejection action
     */
    public static function logReject($model, ?string $reason = null): void
    {
        self::log(
            'reject',
            get_class($model),
            $model->id,
            null,
            ['status' => 'rejected', 'reason' => $reason],
            "Rejected {$model->getTable()} #{$model->id}" . ($reason ? ": $reason" : '')
        );
    }

    /**
     * Log a status change
     */
    public static function logStatusChange($model, string $oldStatus, string $newStatus, ?string $description = null): void
    {
        self::log(
            'status_change',
            get_class($model),
            $model->id,
            ['status' => $oldStatus],
            ['status' => $newStatus],
            $description ?? "Changed status from $oldStatus to $newStatus"
        );
    }
}
