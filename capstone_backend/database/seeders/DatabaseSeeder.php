<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * IMPORTANT: This seeder deletes ALL data!
     * 
     * For LOCAL development (fresh start):
     *   Run: php artisan migrate:fresh --seed
     * 
     * For PRODUCTION deployment:
     *   DON'T use this! Use ProductionSeeder instead:
     *   Run: php artisan db:seed --class=ProductionSeeder
     */
    public function run(): void
    {
        // Safety check: Prevent accidental data deletion in production
        if (app()->environment('production')) {
            $this->command->error('❌ ERROR: DatabaseSeeder cannot run in production!');
            $this->command->error('❌ This seeder DELETES ALL DATA.');
            $this->command->warn('');
            $this->command->warn('⚠️  For production, use ProductionSeeder instead:');
            $this->command->info('   php artisan db:seed --class=ProductionSeeder');
            $this->command->warn('');
            return;
        }

        $this->command->warn('⚠️  WARNING: This will DELETE ALL DATA!');
        $this->command->info('Running DatabaseSeeder for local development...');
        $this->command->info('');

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
            'fcm_tokens',
            'gcash_settings',
            'message_replies',
            'message_requests',
            'notifications',
            'password_reset_tokens',
            'payments',
            'personal_access_tokens',
            'points_requests',
            'rental_requests',
            'sessions',
            'smtp_settings',
        ];

        foreach ($tables as $table) {
            try {
                DB::table($table)->truncate();
            } catch (\Exception $e) {
                // Table might not exist, continue
            }
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
            'points' => 0,
        ]);

        // Seed SMTP settings
        $this->call([
            SmtpSettingSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('✅ Admin account created:');
        $this->command->info('   Email: admin@ferms.com');
        $this->command->info('   Password: password');
        $this->command->info('');
        $this->command->warn('⚠️  No mock data included. Database is clean.');
    }
}

