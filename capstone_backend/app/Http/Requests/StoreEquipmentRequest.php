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
            'pricing_model'      => ['required', 'in:per_hectare,per_equipment'],
            'price_per_hectare'  => ['nullable', 'numeric', 'min:0'],
            'price_per_equipment' => ['nullable', 'numeric', 'min:0'],
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

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $pricingModel = $this->input('pricing_model');
            
            // Validate that the appropriate price field is filled based on pricing model
            if ($pricingModel === 'per_hectare' && empty($this->input('price_per_hectare'))) {
                $validator->errors()->add('price_per_hectare', 'Price per hectare is required for per hectare pricing.');
            }
            
            if ($pricingModel === 'per_equipment' && empty($this->input('price_per_equipment'))) {
                $validator->errors()->add('price_per_equipment', 'Price per equipment is required for flat rate pricing.');
            }
        });
    }
}
