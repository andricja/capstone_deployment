<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isOwner()
            && $this->route('equipment')->owner_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'name'               => ['sometimes', 'string', 'max:255'],
            'category'           => ['sometimes', 'in:tractor,harvester,planter,irrigation,cultivator,sprayer,trailer,other'],
            'description'        => ['nullable', 'string', 'max:2000'],
            'price_per_hectare'  => ['sometimes', 'numeric', 'min:0'],
            'transportation_fee' => ['sometimes', 'numeric', 'min:0'],
            'transportation_fee_per_km' => ['sometimes', 'numeric', 'min:0', 'max:1000'],
            'free_distance_km'   => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'base_transportation_fee' => ['sometimes', 'numeric', 'min:0', 'max:10000'],
            'location'           => ['nullable', 'string', 'max:255'],
            'municipality'       => ['sometimes', 'string', 'max:255'],
            'barangay'           => ['sometimes', 'string', 'max:255'],
            'province'           => ['nullable', 'string', 'max:255'],
            'latitude'           => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'          => ['nullable', 'numeric', 'between:-180,180'],
            'image'              => ['nullable', 'image', 'max:5120'],
        ];
    }
}
