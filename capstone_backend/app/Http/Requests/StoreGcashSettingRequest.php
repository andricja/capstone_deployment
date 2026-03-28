<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGcashSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isOwner();
    }

    public function rules(): array
    {
        return [
            'account_name'   => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:20'],
            'qr_code_image'  => ['nullable', 'image', 'max:5120'],
        ];
    }
}
