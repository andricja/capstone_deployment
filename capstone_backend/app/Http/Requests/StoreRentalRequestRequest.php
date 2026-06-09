<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRentalRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isRenter();
    }

    public function rules(): array
    {
        return [
            'equipment_id'    => ['required', 'exists:equipment,id'],
            'contact_number'  => ['required', 'string', 'max:20'],
            'farm_size_sqm'   => ['required', 'numeric', 'min:2500'], // Minimum 0.25 hectares
            'start_date'      => ['required', 'date', 'after_or_equal:today'],
            'delivery_address'=> ['nullable', 'string', 'max:500'], // Optional, will be auto-generated
            'sitio_street'    => ['required', 'string', 'max:255'],
            'barangay'        => ['required', 'string', 'max:255'],
            'municipality'    => ['required', 'string', 'max:255'],
            'province'        => ['nullable', 'string', 'max:255'],
            'latitude'        => ['required', 'numeric', 'between:-90,90'],
            'longitude'       => ['required', 'numeric', 'between:-180,180'],
            'payment_method'  => ['required', 'in:downpayment,fullpayment'],
            'payment_proof'   => ['required', 'image', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_proof.required' => 'Payment proof via GCash is required for all rental requests.',
            'payment_proof.image'    => 'Payment proof must be an image file.',
            'payment_proof.max'      => 'Payment proof must not exceed 5 MB.',
        ];
    }
}
