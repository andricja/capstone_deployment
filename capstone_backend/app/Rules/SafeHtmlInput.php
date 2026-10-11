<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeHtmlInput implements ValidationRule
{
    /**
     * Run the validation rule.
     * 
     * Validates that input doesn't contain dangerous HTML/scripts
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }
        
        // Check for script tags
        if (preg_match('/<script[^>]*>.*?<\/script>/is', $value)) {
            $fail('The :attribute contains forbidden script tags.');
            return;
        }
        
        // Check for event handlers (onclick, onload, etc.)
        if (preg_match('/\bon\w+\s*=/i', $value)) {
            $fail('The :attribute contains forbidden event handlers.');
            return;
        }
        
        // Check for javascript: protocol
        if (preg_match('/javascript:/i', $value)) {
            $fail('The :attribute contains forbidden javascript protocol.');
            return;
        }
        
        // Check for data: protocol (can be used for XSS)
        if (preg_match('/data:text\/html/i', $value)) {
            $fail('The :attribute contains forbidden data protocol.');
            return;
        }
        
        // Check for iframe tags
        if (preg_match('/<iframe[^>]*>/i', $value)) {
            $fail('The :attribute contains forbidden iframe tags.');
            return;
        }
        
        // Check for object/embed tags
        if (preg_match('/<(object|embed)[^>]*>/i', $value)) {
            $fail('The :attribute contains forbidden object/embed tags.');
            return;
        }
    }
}
