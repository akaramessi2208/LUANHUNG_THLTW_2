<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'code'        => ['required', 'string', 'max:50', 'unique:payment_methods,code,' . $this->payment_method],
            'description' => ['nullable', 'string'],
            'status'      => ['nullable', 'integer'],
        ];
    }
}