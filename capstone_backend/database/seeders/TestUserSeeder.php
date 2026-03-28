<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'account_status' => 'approved',
            'email_verified_at' => now(),
        ]);

        // Create owner user
        User::create([
            'name' => 'Owner User',
            'email' => 'owner@test.com',
            'password' => Hash::make('password'),
            'role' => 'owner',
            'account_status' => 'approved',
            'email_verified_at' => now(),
        ]);

        // Create renter user
        User::create([
            'name' => 'Renter User',
            'email' => 'renter@test.com',
            'password' => Hash::make('password'),
            'role' => 'renter',
            'account_status' => 'approved',
            'email_verified_at' => now(),
        ]);
    }
}
