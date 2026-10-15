<?php

namespace Database\Seeders;

use App\Models\SmtpSetting;
use Illuminate\Database\Seeder;

class SmtpSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Only create if it doesn't exist (singleton pattern)
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

            $this->command->info('✅ SMTP settings seeded successfully!');
        } else {
            $this->command->warn('⚠️  SMTP settings already exist. Skipping seeder.');
        }
    }
}

