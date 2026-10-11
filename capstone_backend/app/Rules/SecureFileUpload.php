<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class SecureFileUpload implements ValidationRule
{
    private array $allowedMimeTypes;
    private int $maxSizeKb;
    
    public function __construct(array $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'], int $maxSizeKb = 5120)
    {
        $this->allowedMimeTypes = $allowedMimeTypes;
        $this->maxSizeKb = $maxSizeKb;
    }
    
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$value instanceof UploadedFile) {
            $fail('The :attribute must be a valid file.');
            return;
        }
        
        // Check if file is actually uploaded
        if (!$value->isValid()) {
            $fail('The :attribute upload failed.');
            return;
        }
        
        // Verify MIME type (more secure than extension check)
        $mimeType = $value->getMimeType();
        if (!in_array($mimeType, $this->allowedMimeTypes)) {
            $fail('The :attribute must be a valid image file (JPEG, PNG, GIF).');
            return;
        }
        
        // Verify file signature (magic bytes) - prevents disguised files
        $filePath = $value->getRealPath();
        if (!$this->verifyFileSignature($filePath, $mimeType)) {
            $fail('The :attribute file appears to be corrupted or invalid.');
            return;
        }
        
        // Check file size
        if ($value->getSize() > ($this->maxSizeKb * 1024)) {
            $fail("The :attribute must not exceed {$this->maxSizeKb}KB.");
            return;
        }
        
        // Check for embedded PHP code (security risk)
        if ($this->containsPhpCode($filePath)) {
            $fail('The :attribute contains forbidden content.');
            return;
        }
    }
    
    /**
     * Verify file signature matches MIME type
     */
    private function verifyFileSignature(string $filePath, string $mimeType): bool
    {
        $handle = fopen($filePath, 'rb');
        if (!$handle) {
            return false;
        }
        
        $bytes = fread($handle, 12);
        fclose($handle);
        
        // Check magic bytes for each image type
        $signatures = [
            'image/jpeg' => ["\xFF\xD8\xFF"],
            'image/jpg' => ["\xFF\xD8\xFF"],
            'image/png' => ["\x89\x50\x4E\x47"],
            'image/gif' => ["GIF87a", "GIF89a"],
        ];
        
        if (!isset($signatures[$mimeType])) {
            return false;
        }
        
        foreach ($signatures[$mimeType] as $signature) {
            if (str_starts_with($bytes, $signature)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if file contains PHP code (security risk)
     */
    private function containsPhpCode(string $filePath): bool
    {
        $content = file_get_contents($filePath);
        
        // Check for PHP tags
        if (stripos($content, '<?php') !== false || 
            stripos($content, '<?=') !== false ||
            stripos($content, '<script') !== false) {
            return true;
        }
        
        return false;
    }
}
