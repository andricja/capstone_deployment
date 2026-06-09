<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isOwner();
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'category'           => ['required', 'in:tractor,harvester,planter,irrigation,cultivator,sprayer,trailer,other'],
            'description'        => ['nullable', 'string', 'max:2000'],
            'price_per_hectare'  => ['required', 'numeric', 'min:0'],
            'transportation_fee' => ['nullable', 'numeric', 'min:0'],
            'transportation_fee_per_km' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'free_distance_km'   => ['nullable', 'numeric', 'min:0', 'max:100'],
            'base_transportation_fee' => ['nullable', 'numeric', 'min:0', 'max:10000'],
            'location'           => ['nullable', 'string', 'max:255'],
            'municipality'       => ['required', 'string', 'max:255'],
            'barangay'           => ['required', 'string', 'max:255'],
            'province'           => ['nullable', 'string', 'max:255'],
            'latitude'           => ['required', 'numeric', 'between:-90,90'],
            'longitude'          => ['required', 'numeric', 'between:-180,180'],
            'image'              => ['nullable', 'image', 'max:5120'], // 5 MB
        ];
    }
}
