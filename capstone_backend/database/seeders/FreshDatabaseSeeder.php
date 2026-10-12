<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FreshDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This will clear all data except the admin account.
     */
    public function run(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Clear all tables (except migrations)
        $tables = [
            'ads',
            'archived_equipment',
            'archived_messages',
            'archived_owners',
            'archived_payments',
            'archived_rentals',
            'audit_trails',
            'equipment',
            'failed_jobs',
            'gcash_settings',
            'message_replies',
            'messages',
            'notifications',
            'password_reset_tokens',
            'payments',
            'personal_access_tokens',
            'points_requests',
            'rental_requests',
            'sessions',
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        // Clear users table but will recreate admin
        DB::table('users')->truncate();

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create only the admin account
        User::create([
            'name' => 'Admin',
            'email' => 'admin@ferms.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
            'account_status' => 'approved',
        ]);

        $this->command->info('✅ Database cleaned successfully!');
        $this->command->info('✅ Admin account created:');
        $this->command->info('   Email: admin@ferms.com');
        $this->command->info('   Password: password');
        $this->command->info('');
        $this->command->warn('⚠️  All other data has been removed.');
    }
}
