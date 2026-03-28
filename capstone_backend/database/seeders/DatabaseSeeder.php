<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\GcashSetting;
use App\Models\MessageRequest;
use App\Models\PointsRequest;
use App\Models\RentalRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate all seeded tables so the seeder can be re-run safely
        Schema::disableForeignKeyConstraints();
        MessageRequest::truncate();
        PointsRequest::truncate();
        RentalRequest::truncate();
        GcashSetting::truncate();
        Equipment::truncate();
        User::truncate();
        Schema::enableForeignKeyConstraints();

        /* ============================================================== */
        /*  USERS                                                         */
        /* ============================================================== */

        $defaultUser = [
            'password' => Hash::make('password'),
            'account_status' => 'approved',
            'email_verified_at' => now(),
        ];

        $admin = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Admin',
            'email'  => 'admin@ferms.com',
            'role'   => 'admin',
            'points' => 0,
        ]));

        // ── Owners ──
        $owner1 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Juan Cruz',
            'email'  => 'owner@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]));

        $owner2 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Pedro Reyes',
            'email'  => 'pedro.reyes@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]));

        $owner3 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Andres Magsaysay',
            'email'  => 'andres.m@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]));

        $owner4 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Felipe Garcia',
            'email'  => 'felipe.garcia@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]));

        // ── Renters ──
        $renter1 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Maria Santos',
            'email'  => 'renter@ferms.com',
            'role'   => 'renter',
            'points' => 500,
        ]));

        $renter2 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Ana Dela Cruz',
            'email'  => 'ana.delacruz@ferms.com',
            'role'   => 'renter',
            'points' => 300,
        ]));

        $renter3 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Carlos Mendoza',
            'email'  => 'carlos.m@ferms.com',
            'role'   => 'renter',
            'points' => 150,
        ]));

        $renter4 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Rosa Villanueva',
            'email'  => 'rosa.v@ferms.com',
            'role'   => 'renter',
            'points' => 0,
        ]));

        $renter5 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Jose Bautista',
            'email'  => 'jose.b@ferms.com',
            'role'   => 'renter',
            'points' => 75,
        ]));

        $renter6 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Elena Ramos',
            'email'  => 'elena.r@ferms.com',
            'role'   => 'renter',
            'points' => 200,
        ]));

        $renter7 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Ricardo Torres',
            'email'  => 'ricardo.t@ferms.com',
            'role'   => 'renter',
            'points' => 350,
        ]));

        $renter8 = User::factory()->create(array_merge($defaultUser, [
            'name'   => 'Luz Fernandez',
            'email'  => 'luz.f@ferms.com',
            'role'   => 'renter',
            'points' => 100,
        ]));

        /* ============================================================== */
        /*  GCASH SETTINGS                                                 */
        /* ============================================================== */

        GcashSetting::create([
            'owner_id'       => $owner1->id,
            'account_name'   => 'Juan C. Cruz',
            'account_number' => '09171234567',
            'qr_code_image'  => 'gcash_qr/owner1_qr.png',
        ]);

        GcashSetting::create([
            'owner_id'       => $owner2->id,
            'account_name'   => 'Pedro R. Reyes',
            'account_number' => '09181234568',
            'qr_code_image'  => 'gcash_qr/owner2_qr.png',
        ]);

        GcashSetting::create([
            'owner_id'       => $owner3->id,
            'account_name'   => 'Andres M.',
            'account_number' => '09199876543',
            'qr_code_image'  => 'gcash_qr/owner3_qr.png',
        ]);

        /* ============================================================== */
        /*  EQUIPMENT                                                      */
        /* ============================================================== */

        $locations = [
            'Calapan City', 'Victoria', 'Naujan', 'Socorro', 'Pinamalayan',
            'Gloria', 'Bansud', 'Bongabong', 'Roxas', 'Mansalay',
        ];

        $equipmentData = [
            // owner1 (idx 0-6)
            ['owner_id' => $owner1->id, 'name' => 'Kubota L3408 Tractor',      'category' => 'tractor',     'description' => 'Reliable 34HP compact tractor suitable for rice paddies and vegetable farms.',               'daily_rate' => 2500, 'transportation_fee' => 500,  'location' => $locations[0], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'John Deere 5050D Tractor',   'category' => 'tractor',     'description' => '50HP utility tractor with 4WD, perfect for larger farm plots.',                               'daily_rate' => 3500, 'transportation_fee' => 750,  'location' => $locations[1], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'Yanmar YR70D Harvester',     'category' => 'harvester',   'description' => 'High-performance rice combine harvester with grain tank.',                                     'daily_rate' => 5000, 'transportation_fee' => 1200, 'location' => $locations[0], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'Honda Water Pump WB30XT',    'category' => 'irrigation',  'description' => '3-inch centrifugal pump for irrigation, 1,100 L/min capacity.',                                'daily_rate' => 800,  'transportation_fee' => 200,  'location' => $locations[2], 'status' => 'rented'],
            ['owner_id' => $owner1->id, 'name' => 'Seed Drill SD-120',          'category' => 'planter',     'description' => 'Precision seed drill for rice and corn, adjustable row spacing.',                               'daily_rate' => 1800, 'transportation_fee' => 450,  'location' => $locations[0], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'Disc Harrow DH-20',          'category' => 'cultivator',  'description' => '20-disc harrow for secondary tillage, breaks up soil clods.',                                  'daily_rate' => 1600, 'transportation_fee' => 500,  'location' => $locations[1], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'Knapsack Sprayer KS-16',     'category' => 'sprayer',     'description' => '16L manual knapsack sprayer for small to medium farms.',                                       'daily_rate' => 300,  'transportation_fee' => 0,    'location' => $locations[0], 'status' => 'available'],

            // owner2 (idx 7-12)
            ['owner_id' => $owner2->id, 'name' => 'Massey Ferguson 241 DI',     'category' => 'tractor',     'description' => '42HP tractor with power steering, ideal for plowing and hauling.',                             'daily_rate' => 2800, 'transportation_fee' => 600,  'location' => $locations[3], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Stihl Mist Blower SR 430',   'category' => 'sprayer',     'description' => 'Backpack mist blower for pesticide and fertilizer application.',                                'daily_rate' => 600,  'transportation_fee' => 0,    'location' => $locations[3], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Crop Tiger 30 Harvester',    'category' => 'harvester',   'description' => 'Versatile combine harvester for rice and corn, with 30HP engine.',                              'daily_rate' => 4500, 'transportation_fee' => 1000, 'location' => $locations[4], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Farm Trailer 2-Ton',         'category' => 'trailer',     'description' => 'Heavy-duty farm trailer for transporting harvest, feed, and materials.',                       'daily_rate' => 1000, 'transportation_fee' => 300,  'location' => $locations[3], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Power Tiller PT-12',         'category' => 'cultivator',  'description' => '12HP walk-behind power tiller for small plots and garden beds.',                               'daily_rate' => 900,  'transportation_fee' => 200,  'location' => $locations[4], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Solar Irrigation Pump SP-3',  'category' => 'irrigation',  'description' => 'Solar-powered submersible pump, ideal for remote rice paddies.',                               'daily_rate' => 1100, 'transportation_fee' => 350,  'location' => $locations[3], 'status' => 'rented'],

            // owner3 (idx 13-18)
            ['owner_id' => $owner3->id, 'name' => 'Rotary Tiller RT-150',       'category' => 'cultivator',  'description' => '150cm rotary tiller attachment for soil preparation.',                                         'daily_rate' => 1500, 'transportation_fee' => 400,  'location' => $locations[5], 'status' => 'available'],
            ['owner_id' => $owner3->id, 'name' => 'Transplanter TP-800',        'category' => 'planter',     'description' => 'Semi-automatic rice transplanter for efficient seedling planting.',                             'daily_rate' => 3000, 'transportation_fee' => 800,  'location' => $locations[6], 'status' => 'available'],
            ['owner_id' => $owner3->id, 'name' => 'Drip Irrigation Kit 1-Acre', 'category' => 'irrigation',  'description' => 'Complete drip irrigation system for 1 acre, with timer and filters.',                           'daily_rate' => 1200, 'transportation_fee' => 350,  'location' => $locations[5], 'status' => 'maintenance'],
            ['owner_id' => $owner3->id, 'name' => 'Boom Sprayer 200L',          'category' => 'sprayer',     'description' => 'Tractor-mounted boom sprayer with 200-liter tank for large-area coverage.',                     'daily_rate' => 1800, 'transportation_fee' => 500,  'location' => $locations[7], 'status' => 'available'],
            ['owner_id' => $owner3->id, 'name' => 'Mini Combine Harvester MC-5', 'category' => 'harvester',  'description' => 'Compact combine harvester for terraced rice fields and small farms.',                            'daily_rate' => 3800, 'transportation_fee' => 900,  'location' => $locations[6], 'status' => 'available'],
            ['owner_id' => $owner3->id, 'name' => 'Utility Trailer UT-1.5',     'category' => 'trailer',     'description' => '1.5-ton general purpose trailer for farm hauling.',                                             'daily_rate' => 800,  'transportation_fee' => 250,  'location' => $locations[5], 'status' => 'available'],

            // owner4 (idx 19-24)
            ['owner_id' => $owner4->id, 'name' => 'Mahindra 575 DI Tractor',    'category' => 'tractor',     'description' => '45HP tractor with excellent fuel efficiency, suitable for all farm operations.',                'daily_rate' => 3000, 'transportation_fee' => 650,  'location' => $locations[8], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Corn Planter 4-Row',         'category' => 'planter',     'description' => '4-row precision corn planter with adjustable spacing.',                                         'daily_rate' => 2200, 'transportation_fee' => 550,  'location' => $locations[8], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Brush Cutter BC-520',        'category' => 'cultivator',  'description' => 'Heavy-duty brush cutter for clearing farmland and managing weeds.',                             'daily_rate' => 500,  'transportation_fee' => 0,    'location' => $locations[9], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Flatbed Trailer 3-Ton',      'category' => 'trailer',     'description' => '3-ton capacity flatbed trailer for hauling heavy farm equipment and produce.',                  'daily_rate' => 1400, 'transportation_fee' => 400,  'location' => $locations[9], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Rice Reaper RR-60',          'category' => 'harvester',   'description' => 'Walk-behind rice reaper for small to medium fields, easy to operate.',                           'daily_rate' => 2000, 'transportation_fee' => 400,  'location' => $locations[8], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Sprinkler Irrigation Set',   'category' => 'irrigation',  'description' => 'Portable sprinkler system covering up to 1 hectare, with hose and fittings.',                   'daily_rate' => 700,  'transportation_fee' => 150,  'location' => $locations[9], 'status' => 'available'],
        ];

        $equipmentModels = [];
        foreach ($equipmentData as $eq) {
            $equipmentModels[] = Equipment::create($eq);
        }

        /* ============================================================== */
        /*  RENTAL REQUESTS                                                */
        /* ============================================================== */

        $renters    = [$renter1, $renter2, $renter3, $renter4, $renter5, $renter6, $renter7, $renter8];
        $addresses  = [
            'Brgy. Parang, Calapan City', 'Brgy. Banus, Victoria',
            'Brgy. San Agustin, Naujan', 'Brgy. Plaridel, Socorro',
            'Brgy. Lumangbayan, Pinamalayan', 'Brgy. Bansud Proper, Bansud',
            'Brgy. Labasan, Gloria', 'Brgy. Poblacion, Bongabong',
            'Brgy. San Roque, Roxas', 'Brgy. Maliwanag, Mansalay',
        ];

        $rentalData = [
            // ── October 2025 ──
            ['renter' => $renter1, 'eq_idx' =>  0, 'farm_sqm' =>  8000, 'start' => '2025-10-05', 'status' => 'approved',  'created' => '2025-10-03'],
            ['renter' => $renter3, 'eq_idx' =>  7, 'farm_sqm' => 15000, 'start' => '2025-10-12', 'status' => 'approved',  'created' => '2025-10-10'],
            ['renter' => $renter5, 'eq_idx' => 14, 'farm_sqm' =>  6000, 'start' => '2025-10-18', 'status' => 'rejected',  'created' => '2025-10-15'],
            ['renter' => $renter6, 'eq_idx' =>  1, 'farm_sqm' => 20000, 'start' => '2025-10-22', 'status' => 'approved',  'created' => '2025-10-20'],
            ['renter' => $renter7, 'eq_idx' => 19, 'farm_sqm' => 12000, 'start' => '2025-10-25', 'status' => 'approved',  'created' => '2025-10-23'],
            ['renter' => $renter2, 'eq_idx' =>  9, 'farm_sqm' => 10000, 'start' => '2025-10-28', 'status' => 'forwarded', 'created' => '2025-10-26'],

            // ── November 2025 ──
            ['renter' => $renter2, 'eq_idx' =>  1, 'farm_sqm' => 20000, 'start' => '2025-11-04', 'status' => 'approved',  'created' => '2025-11-02'],
            ['renter' => $renter4, 'eq_idx' => 19, 'farm_sqm' => 10000, 'start' => '2025-11-10', 'status' => 'approved',  'created' => '2025-11-08'],
            ['renter' => $renter1, 'eq_idx' => 13, 'farm_sqm' =>  5000, 'start' => '2025-11-15', 'status' => 'forwarded', 'created' => '2025-11-13'],
            ['renter' => $renter3, 'eq_idx' =>  8, 'farm_sqm' =>  3000, 'start' => '2025-11-20', 'status' => 'rejected',  'created' => '2025-11-18'],
            ['renter' => $renter8, 'eq_idx' =>  2, 'farm_sqm' => 18000, 'start' => '2025-11-22', 'status' => 'approved',  'created' => '2025-11-20'],
            ['renter' => $renter6, 'eq_idx' => 14, 'farm_sqm' =>  8000, 'start' => '2025-11-25', 'status' => 'approved',  'created' => '2025-11-23'],
            ['renter' => $renter7, 'eq_idx' => 20, 'farm_sqm' =>  9600, 'start' => '2025-11-28', 'status' => 'rejected',  'created' => '2025-11-26'],

            // ── December 2025 ──
            ['renter' => $renter2, 'eq_idx' =>  0, 'farm_sqm' => 25000, 'start' => '2025-12-02', 'status' => 'approved',  'created' => '2025-12-01'],
            ['renter' => $renter5, 'eq_idx' =>  2, 'farm_sqm' => 18000, 'start' => '2025-12-08', 'status' => 'approved',  'created' => '2025-12-06'],
            ['renter' => $renter1, 'eq_idx' => 20, 'farm_sqm' => 12000, 'start' => '2025-12-14', 'status' => 'approved',  'created' => '2025-12-12'],
            ['renter' => $renter4, 'eq_idx' => 10, 'farm_sqm' => 40000, 'start' => '2025-12-18', 'status' => 'forwarded', 'created' => '2025-12-16'],
            ['renter' => $renter3, 'eq_idx' =>  1, 'farm_sqm' => 30000, 'start' => '2025-12-22', 'status' => 'rejected',  'created' => '2025-12-20'],
            ['renter' => $renter7, 'eq_idx' =>  4, 'farm_sqm' => 14000, 'start' => '2025-12-10', 'status' => 'approved',  'created' => '2025-12-08'],
            ['renter' => $renter8, 'eq_idx' =>  7, 'farm_sqm' => 22000, 'start' => '2025-12-15', 'status' => 'approved',  'created' => '2025-12-13'],
            ['renter' => $renter6, 'eq_idx' => 17, 'farm_sqm' =>  9000, 'start' => '2025-12-20', 'status' => 'approved',  'created' => '2025-12-18'],
            ['renter' => $renter5, 'eq_idx' => 23, 'farm_sqm' => 16000, 'start' => '2025-12-28', 'status' => 'forwarded', 'created' => '2025-12-26'],

            // ── January 2026 ──
            ['renter' => $renter1, 'eq_idx' =>  7, 'farm_sqm' => 22000, 'start' => '2026-01-06', 'status' => 'approved',  'created' => '2026-01-04'],
            ['renter' => $renter2, 'eq_idx' => 14, 'farm_sqm' =>  7200, 'start' => '2026-01-10', 'status' => 'approved',  'created' => '2026-01-08'],
            ['renter' => $renter5, 'eq_idx' => 19, 'farm_sqm' => 14000, 'start' => '2026-01-15', 'status' => 'approved',  'created' => '2026-01-13'],
            ['renter' => $renter3, 'eq_idx' =>  0, 'farm_sqm' => 10000, 'start' => '2026-01-20', 'status' => 'forwarded', 'created' => '2026-01-18'],
            ['renter' => $renter4, 'eq_idx' =>  9, 'farm_sqm' =>  9000, 'start' => '2026-01-25', 'status' => 'rejected',  'created' => '2026-01-23'],
            ['renter' => $renter6, 'eq_idx' =>  5, 'farm_sqm' => 11000, 'start' => '2026-01-08', 'status' => 'approved',  'created' => '2026-01-06'],
            ['renter' => $renter7, 'eq_idx' =>  2, 'farm_sqm' => 15000, 'start' => '2026-01-12', 'status' => 'approved',  'created' => '2026-01-10'],
            ['renter' => $renter8, 'eq_idx' => 22, 'farm_sqm' => 35000, 'start' => '2026-01-18', 'status' => 'approved',  'created' => '2026-01-16'],
            ['renter' => $renter1, 'eq_idx' => 17, 'farm_sqm' =>  7000, 'start' => '2026-01-22', 'status' => 'approved',  'created' => '2026-01-20'],
            ['renter' => $renter4, 'eq_idx' => 13, 'farm_sqm' =>  4500, 'start' => '2026-01-28', 'status' => 'rejected',  'created' => '2026-01-26'],

            // ── February 2026 ──
            ['renter' => $renter1, 'eq_idx' =>  0, 'farm_sqm' => 12000, 'start' => '2026-02-20', 'status' => 'approved',  'created' => '2026-02-05'],
            ['renter' => $renter2, 'eq_idx' =>  7, 'farm_sqm' => 20000, 'start' => '2026-02-18', 'status' => 'approved',  'created' => '2026-02-08'],
            ['renter' => $renter3, 'eq_idx' => 14, 'farm_sqm' =>  4800, 'start' => '2026-02-25', 'status' => 'approved',  'created' => '2026-02-10'],
            ['renter' => $renter1, 'eq_idx' => 19, 'farm_sqm' => 16000, 'start' => '2026-02-22', 'status' => 'approved',  'created' => '2026-02-12'],
            ['renter' => $renter5, 'eq_idx' =>  1, 'farm_sqm' => 80000, 'start' => '2026-02-15', 'status' => 'approved',  'created' => '2026-02-14'],
            ['renter' => $renter4, 'eq_idx' =>  0, 'farm_sqm' => 50000, 'start' => '2026-02-10', 'status' => 'rejected',  'created' => '2026-02-03'],
            ['renter' => $renter5, 'eq_idx' =>  7, 'farm_sqm' => 30000, 'start' => '2026-02-08', 'status' => 'rejected',  'created' => '2026-02-02'],
            ['renter' => $renter6, 'eq_idx' =>  2, 'farm_sqm' => 25000, 'start' => '2026-02-12', 'status' => 'approved',  'created' => '2026-02-10'],
            ['renter' => $renter7, 'eq_idx' => 20, 'farm_sqm' => 18000, 'start' => '2026-02-16', 'status' => 'approved',  'created' => '2026-02-14'],
            ['renter' => $renter8, 'eq_idx' =>  4, 'farm_sqm' =>  6000, 'start' => '2026-02-20', 'status' => 'approved',  'created' => '2026-02-18'],
            ['renter' => $renter3, 'eq_idx' => 23, 'farm_sqm' => 45000, 'start' => '2026-02-24', 'status' => 'forwarded', 'created' => '2026-02-22'],
            ['renter' => $renter8, 'eq_idx' => 13, 'farm_sqm' =>  5500, 'start' => '2026-02-26', 'status' => 'approved',  'created' => '2026-02-24'],

            // ── Late February 2026 (weekly data with timestamps) ──
            ['renter' => $renter1, 'eq_idx' =>  0, 'farm_sqm' => 10000, 'start' => '2026-02-26', 'status' => 'approved',  'created' => '2026-02-24 09:00:00'],
            ['renter' => $renter3, 'eq_idx' =>  7, 'farm_sqm' => 15000, 'start' => '2026-02-27', 'status' => 'approved',  'created' => '2026-02-24 14:00:00'],
            ['renter' => $renter5, 'eq_idx' => 19, 'farm_sqm' => 16000, 'start' => '2026-02-28', 'status' => 'approved',  'created' => '2026-02-25 08:30:00'],
            ['renter' => $renter6, 'eq_idx' =>  1, 'farm_sqm' => 20000, 'start' => '2026-03-01', 'status' => 'approved',  'created' => '2026-02-25 15:00:00'],
            ['renter' => $renter7, 'eq_idx' => 14, 'farm_sqm' =>  6000, 'start' => '2026-03-02', 'status' => 'rejected',  'created' => '2026-02-26 10:00:00'],
            ['renter' => $renter2, 'eq_idx' =>  9, 'farm_sqm' => 10000, 'start' => '2026-03-03', 'status' => 'forwarded', 'created' => '2026-02-26 16:00:00'],
            ['renter' => $renter4, 'eq_idx' =>  5, 'farm_sqm' => 11000, 'start' => '2026-03-04', 'status' => 'approved',  'created' => '2026-02-27 09:00:00'],
            ['renter' => $renter8, 'eq_idx' => 22, 'farm_sqm' => 25000, 'start' => '2026-03-05', 'status' => 'rejected',  'created' => '2026-02-27 13:00:00'],
            ['renter' => $renter1, 'eq_idx' => 17, 'farm_sqm' =>  9000, 'start' => '2026-03-03', 'status' => 'approved',  'created' => '2026-02-28 08:00:00'],
            ['renter' => $renter3, 'eq_idx' =>  2, 'farm_sqm' => 18000, 'start' => '2026-03-06', 'status' => 'approved',  'created' => '2026-02-28 11:00:00'],
            ['renter' => $renter6, 'eq_idx' => 20, 'farm_sqm' => 12000, 'start' => '2026-03-04', 'status' => 'approved',  'created' => '2026-02-28 15:30:00'],

            // ── March 1, 2026 ──
            ['renter' => $renter2, 'eq_idx' =>  2, 'farm_sqm' => 12000, 'start' => '2026-03-05', 'status' => 'forwarded', 'created' => '2026-03-01 07:30:00'],
            ['renter' => $renter4, 'eq_idx' => 13, 'farm_sqm' =>  8000, 'start' => '2026-03-06', 'status' => 'approved',  'created' => '2026-03-01 10:00:00'],
            ['renter' => $renter6, 'eq_idx' => 19, 'farm_sqm' => 20000, 'start' => '2026-03-08', 'status' => 'approved',  'created' => '2026-03-01 14:00:00'],
            ['renter' => $renter3, 'eq_idx' =>  8, 'farm_sqm' =>  5000, 'start' => '2026-03-07', 'status' => 'approved',  'created' => '2026-03-01 16:30:00'],
            ['renter' => $renter7, 'eq_idx' =>  0, 'farm_sqm' => 15000, 'start' => '2026-03-09', 'status' => 'forwarded', 'created' => '2026-03-01 18:00:00'],

            // ── March 2, 2026 (today — hourly spread for all owners) ──
            ['renter' => $renter1, 'eq_idx' =>  2, 'farm_sqm' => 12000, 'start' => '2026-03-06', 'status' => 'approved',  'created' => '2026-03-02 07:00:00'],
            ['renter' => $renter2, 'eq_idx' =>  0, 'farm_sqm' =>  8000, 'start' => '2026-03-07', 'status' => 'forwarded', 'created' => '2026-03-02 08:00:00'],
            ['renter' => $renter4, 'eq_idx' =>  1, 'farm_sqm' => 15000, 'start' => '2026-03-08', 'status' => 'approved',  'created' => '2026-03-02 09:00:00'],
            ['renter' => $renter3, 'eq_idx' =>  7, 'farm_sqm' => 18000, 'start' => '2026-03-09', 'status' => 'approved',  'created' => '2026-03-02 09:30:00'],
            ['renter' => $renter6, 'eq_idx' =>  4, 'farm_sqm' =>  6000, 'start' => '2026-03-05', 'status' => 'approved',  'created' => '2026-03-02 10:00:00'],
            ['renter' => $renter5, 'eq_idx' => 14, 'farm_sqm' =>  7000, 'start' => '2026-03-07', 'status' => 'forwarded', 'created' => '2026-03-02 10:30:00'],
            ['renter' => $renter3, 'eq_idx' =>  5, 'farm_sqm' => 10000, 'start' => '2026-03-09', 'status' => 'rejected',  'created' => '2026-03-02 11:00:00'],
            ['renter' => $renter7, 'eq_idx' => 20, 'farm_sqm' =>  9600, 'start' => '2026-03-08', 'status' => 'approved',  'created' => '2026-03-02 11:30:00'],
            ['renter' => $renter8, 'eq_idx' => 10, 'farm_sqm' => 25000, 'start' => '2026-03-10', 'status' => 'approved',  'created' => '2026-03-02 12:00:00'],
            ['renter' => $renter5, 'eq_idx' =>  6, 'farm_sqm' =>  3000, 'start' => '2026-03-04', 'status' => 'forwarded', 'created' => '2026-03-02 13:00:00'],
            ['renter' => $renter1, 'eq_idx' => 23, 'farm_sqm' => 40000, 'start' => '2026-03-11', 'status' => 'rejected',  'created' => '2026-03-02 13:30:00'],
            ['renter' => $renter8, 'eq_idx' =>  2, 'farm_sqm' => 18000, 'start' => '2026-03-10', 'status' => 'approved',  'created' => '2026-03-02 14:00:00'],
            ['renter' => $renter7, 'eq_idx' => 17, 'farm_sqm' => 12000, 'start' => '2026-03-09', 'status' => 'approved',  'created' => '2026-03-02 14:30:00'],
            ['renter' => $renter2, 'eq_idx' => 11, 'farm_sqm' => 30000, 'start' => '2026-03-12', 'status' => 'forwarded', 'created' => '2026-03-02 15:00:00'],
            ['renter' => $renter4, 'eq_idx' =>  0, 'farm_sqm' => 20000, 'start' => '2026-03-11', 'status' => 'approved',  'created' => '2026-03-02 15:30:00'],
            ['renter' => $renter6, 'eq_idx' => 15, 'farm_sqm' =>  4000, 'start' => '2026-03-08', 'status' => 'approved',  'created' => '2026-03-02 16:00:00'],
            ['renter' => $renter7, 'eq_idx' =>  0, 'farm_sqm' => 15000, 'start' => '2026-03-12', 'status' => 'approved',  'created' => '2026-03-02 17:00:00'],
            ['renter' => $renter1, 'eq_idx' => 19, 'farm_sqm' => 16000, 'start' => '2026-03-13', 'status' => 'forwarded', 'created' => '2026-03-02 17:30:00'],
        ];

        // Coverage rates must match RentalRequestController (sqm per hour)
        $coverageRates = [
            'tractor' => 2000, 'harvester' => 1500, 'planter' => 1200,
            'irrigation' => 2500, 'cultivator' => 1000, 'sprayer' => 3000,
            'trailer' => 5000, 'other' => 1500,
        ];

        foreach ($rentalData as $i => $r) {
            $eq    = $equipmentModels[$r['eq_idx']];
            $farmSizeSqm   = $r['farm_sqm'];
            $rate           = $coverageRates[$eq->category] ?? 1500;
            $estimatedHours = max(ceil(($farmSizeSqm / $rate) * 10) / 10, 1);
            $rentalDays     = max((int) ceil($estimatedHours / 8), 1);

            $start = Carbon::parse($r['start']);
            $end   = $start->copy()->addDays($rentalDays);

            $baseCost      = $eq->daily_rate * $rentalDays;
            $deliveryFee   = (float) $eq->transportation_fee;
            $serviceCharge = round($baseCost * 0.05, 2);
            $totalCost     = $baseCost + $deliveryFee + $serviceCharge;

            RentalRequest::create([
                'renter_id'        => $r['renter']->id,
                'equipment_id'     => $eq->id,
                'contact_number'   => '0917' . str_pad($i + 1, 7, '0', STR_PAD_LEFT),
                'farm_size_sqm'    => $farmSizeSqm,
                'estimated_hours'  => $estimatedHours,
                'rental_days'      => $rentalDays,
                'start_date'       => $start,
                'end_date'         => $end,
                'delivery_address' => $addresses[$i % count($addresses)],
                'latitude'         => 13.1000 + ($i * 0.01),
                'longitude'        => 121.1000 + ($i * 0.01),
                'base_cost'        => $baseCost,
                'delivery_fee'     => $deliveryFee,
                'service_charge'   => $serviceCharge,
                'total_cost'       => $totalCost,
                'status'           => $r['status'],
                'payment_method'   => $i % 2 === 0 ? 'cod' : 'gcash',
                'payment_proof'    => $i % 2 === 0 ? null : 'payment_proofs/sample_proof.jpg',
                'created_at'       => Carbon::parse($r['created']),
                'updated_at'       => Carbon::parse($r['created']),
            ]);
        }

        /* ============================================================== */
        /*  POINTS REQUESTS                                                */
        /* ============================================================== */

        $pointsData = [
            ['renter' => $renter1, 'amount' => 500,  'points' => 500,  'status' => 'approved'],
            ['renter' => $renter1, 'amount' => 200,  'points' => 200,  'status' => 'approved'],
            ['renter' => $renter2, 'amount' => 300,  'points' => 300,  'status' => 'approved'],
            ['renter' => $renter3, 'amount' => 150,  'points' => 150,  'status' => 'approved'],
            ['renter' => $renter5, 'amount' => 100,  'points' => 100,  'status' => 'approved'],
            ['renter' => $renter6, 'amount' => 200,  'points' => 200,  'status' => 'approved'],
            ['renter' => $renter7, 'amount' => 350,  'points' => 350,  'status' => 'approved'],
            ['renter' => $renter8, 'amount' => 100,  'points' => 100,  'status' => 'approved'],
            ['renter' => $renter4, 'amount' => 250,  'points' => 250,  'status' => 'pending'],
            ['renter' => $renter2, 'amount' => 500,  'points' => 500,  'status' => 'pending'],
            ['renter' => $renter5, 'amount' => 1000, 'points' => 1000, 'status' => 'pending'],
            ['renter' => $renter6, 'amount' => 400,  'points' => 400,  'status' => 'pending'],
            ['renter' => $renter8, 'amount' => 150,  'points' => 150,  'status' => 'pending'],
            ['renter' => $renter3, 'amount' => 300,  'points' => 300,  'status' => 'rejected'],
            ['renter' => $renter7, 'amount' => 500,  'points' => 500,  'status' => 'rejected'],
        ];

        foreach ($pointsData as $pr) {
            PointsRequest::create([
                'renter_id'        => $pr['renter']->id,
                'amount_paid'      => $pr['amount'],
                'points_requested' => $pr['points'],
                'payment_proof'    => 'proofs/sample_receipt.jpg',
                'status'           => $pr['status'],
            ]);
        }

        /* ============================================================== */
        /*  MESSAGE REQUESTS                                               */
        /* ============================================================== */

        $messages = [
            ['renter' => $renter1, 'msg' => 'Is the Kubota tractor available for next week? I need it for land preparation in Naujan.',                           'status' => 'pending'],
            ['renter' => $renter2, 'msg' => 'I\'d like to inquire about the rice harvester rental. How many hectares can it cover per day?',                       'status' => 'pending'],
            ['renter' => $renter3, 'msg' => 'Can I get a discount if I rent the transplanter for a full week? I have a 2-hectare rice field.',                     'status' => 'responded'],
            ['renter' => $renter4, 'msg' => 'Do you deliver equipment to Mansalay? I need the corn planter and a trailer.',                                        'status' => 'pending'],
            ['renter' => $renter5, 'msg' => 'The water pump I rented last time was great. Can I reserve it again for the first week of March?',                    'status' => 'responded'],
            ['renter' => $renter1, 'msg' => 'I have an issue with my points purchase. I paid ₱500 via GCash but it hasn\'t been reflected yet.',                   'status' => 'reviewed'],
            ['renter' => $renter2, 'msg' => 'Is there any sprayer equipment available for coconut farm pest control? Preferably the mist blower.',                 'status' => 'pending'],
            ['renter' => $renter3, 'msg' => 'Thank you for the quick response about the rotary tiller! I will proceed with the rental.',                           'status' => 'responded'],
            ['renter' => $renter6, 'msg' => 'Good day! I\'m looking for a tractor to rent for about 3 days for my farm in Gloria. What\'s available?',             'status' => 'pending'],
            ['renter' => $renter7, 'msg' => 'Can I rent the Massey Ferguson tractor and the Farm Trailer at the same time? I need both for hauling.',              'status' => 'pending'],
            ['renter' => $renter8, 'msg' => 'Hi, the Yanmar harvester was excellent last harvest season. I want to book it again for March 2026.',                 'status' => 'responded'],
            ['renter' => $renter6, 'msg' => 'Is the seed drill attachment compatible with any tractor or only specific models?',                                   'status' => 'pending'],
            ['renter' => $renter7, 'msg' => 'I noticed the drip irrigation kit is under maintenance. When will it be back available?',                             'status' => 'reviewed'],
            ['renter' => $renter4, 'msg' => 'I\'m planning a large corn planting project in Roxas. Need the 4-row corn planter for at least 5 days.',             'status' => 'pending'],
            ['renter' => $renter8, 'msg' => 'Can you provide the GPS coordinates for the equipment pickup location? I want to plan my route.',                     'status' => 'responded'],
        ];

        foreach ($messages as $i => $m) {
            MessageRequest::create([
                'renter_id'      => $m['renter']->id,
                'name'           => $m['renter']->name,
                'contact_number' => '0917' . str_pad(100 + $i, 7, '0', STR_PAD_LEFT),
                'location'       => $locations[$i % count($locations)],
                'message'        => $m['msg'],
                'status'         => $m['status'],
            ]);
        }
    }
}
