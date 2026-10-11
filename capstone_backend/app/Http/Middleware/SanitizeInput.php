<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     * 
     * Sanitizes user input to prevent XSS attacks by stripping potentially
     * dangerous HTML tags and attributes while preserving safe content.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Strip dangerous HTML tags but keep safe formatting
                $value = $this->sanitize($value);
            }
        });
        
        $request->merge($input);
        
        return $next($request);
    }
    
    /**
     * Sanitize a string value
     */
    private function sanitize(string $value): string
    {
        // Allow only safe HTML tags
        $allowedTags = '<p><br><strong><em><u><ol><ul><li>';
        
        // Strip all tags except allowed ones
        $cleaned = strip_tags($value, $allowedTags);
        
        // Remove potentially dangerous attributes
        $cleaned = preg_replace('/<(\w+)[^>]*?(on\w+\s*=)/i', '<$1', $cleaned);
        
        // Remove javascript: protocol
        $cleaned = preg_replace('/javascript:/i', '', $cleaned);
        
        // Trim whitespace
        $cleaned = trim($cleaned);
        
        return $cleaned;
    }
}
