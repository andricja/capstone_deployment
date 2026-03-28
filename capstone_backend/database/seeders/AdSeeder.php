<?php

namespace Database\Seeders;

use App\Models\Ad;
use Illuminate\Database\Seeder;

class AdSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ads = [
            [
                'title' => 'Premium Farm Equipment Sale - 20% Off!',
                'description' => 'Get 20% discount on all premium tractors and tillers this month. Limited time offer for Oriental Mindoro farmers!',
                'image' => null, // You can add images later
                'link_url' => 'https://example.com/sale',
                'status' => 'active',
                'display_order' => 1,
                'start_date' => now(),
                'end_date' => now()->addDays(30),
            ],
            [
                'title' => 'New Harvester Models Available',
                'description' => 'Check out our latest harvester models with improved efficiency and lower fuel consumption.',
                'image' => null,
                'link_url' => 'https://example.com/harvesters',
                'status' => 'active',
                'display_order' => 2,
                'start_date' => now(),
                'end_date' => now()->addDays(60),
            ],
            [
                'title' => 'Free Delivery Within 10km',
                'description' => 'Rent any equipment and get FREE delivery within 10km radius. Book now!',
                'image' => null,
                'link_url' => null,
                'status' => 'active',
                'display_order' => 3,
                'start_date' => now(),
                'end_date' => now()->addDays(45),
            ],
            [
                'title' => 'Agricultural Training Workshop',
                'description' => 'Join our free workshop on modern farming techniques. Register now for the next session!',
                'image' => null,
                'link_url' => 'https://example.com/workshop',
                'status' => 'active',
                'display_order' => 4,
                'start_date' => now(),
                'end_date' => now()->addDays(15),
            ],
            [
                'title' => 'Seasonal Maintenance Special',
                'description' => 'Get your equipment serviced before the planting season. Special rates available!',
                'image' => null,
                'link_url' => null,
                'status' => 'inactive', // This one won't show
                'display_order' => 5,
                'start_date' => now()->subDays(10),
                'end_date' => now()->subDays(5),
            ],
        ];

        foreach ($ads as $ad) {
            Ad::create($ad);
        }
    }
}

