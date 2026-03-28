<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isRenter();
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'location'       => ['required', 'string', 'max:255'],
            'message'        => ['required', 'string', 'max:5000'],
        ];
    }
}
