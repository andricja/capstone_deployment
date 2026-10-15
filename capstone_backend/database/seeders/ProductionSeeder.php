<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SmtpSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionSeeder extends Seeder
{
    /**
     * Run production-safe seeding.
     * Only creates data if it doesn't exist (won't delete anything).
     */
    public function run(): void
    {
        $this->command->info('🔄 Running production seeder...');

        // Create admin if doesn't exist
        if (User::where('email', 'admin@ferms.com')->doesntExist()) {
            User::create([
                'name' => 'Admin',
                'email' => 'admin@ferms.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
                'account_status' => 'approved',
                'points' => 0,
            ]);
            $this->command->info('✅ Admin account created.');
        } else {
            $this->command->info('ℹ️  Admin account already exists. Skipping.');
        }

        // Create SMTP settings if doesn't exist
        if (SmtpSetting::count() === 0) {
            SmtpSetting::create([
                'mail_host' => 'smtp.gmail.com',
                'mail_port' => 587,
                'mail_username' => 'jareljambalos@gmail.com',
                'mail_password' => 'uviorexeuvwjmtfi',
                'mail_encryption' => 'tls',
                'mail_from_address' => 'jareljambalos@gmail.com',
                'mail_from_name' => 'FERMs',
            ]);
            $this->command->info('✅ SMTP settings created.');
        } else {
            $this->command->info('ℹ️  SMTP settings already exist. Skipping.');
        }

        $this->command->info('✅ Production seeding completed!');
    }
}

