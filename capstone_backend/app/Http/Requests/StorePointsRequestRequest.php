<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePointsRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isRenter();
    }

    public function rules(): array
    {
        return [
            'points_requested' => ['required', 'integer', 'min:1'],
            'payment_proof'    => ['required', 'image', 'max:5120'], // 5 MB
        ];
    }
}
