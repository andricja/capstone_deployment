<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SmtpSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SmtpSettingController extends Controller
{
    /**
     * Get current SMTP settings (without password).
     */
    public function show(): JsonResponse
    {
        $setting = SmtpSetting::current();
        if (! $setting) {
            return response()->json(null);
        }

        return response()->json([
            'mail_host'         => $setting->mail_host,
            'mail_port'         => $setting->mail_port,
            'mail_username'     => $setting->mail_username,
            'mail_encryption'   => $setting->mail_encryption,
            'mail_from_address' => $setting->mail_from_address,
            'mail_from_name'    => $setting->mail_from_name,
            'has_password'      => ! empty($setting->mail_password),
            'updated_at'        => $setting->updated_at,
        ]);
    }

    /**
     * Save / update SMTP settings.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mail_host'         => ['required', 'string', 'max:255'],
            'mail_port'         => ['required', 'integer', 'min:1', 'max:65535'],
            'mail_username'     => ['required', 'string', 'max:255'],
            'mail_password'     => ['nullable', 'string', 'max:255'],
            'mail_encryption'   => ['required', 'in:tls,ssl,null'],
            'mail_from_address' => ['required', 'email', 'max:255'],
            'mail_from_name'    => ['required', 'string', 'max:255'],
        ]);

        $setting = SmtpSetting::current();

        if ($setting) {
            // Only update password if provided
            if (empty($validated['mail_password'])) {
                unset($validated['mail_password']);
            }
            $setting->update($validated);
        } else {
            if (empty($validated['mail_password'])) {
                return response()->json(['message' => 'Password is required for initial setup.'], 422);
            }
            $setting = SmtpSetting::create($validated);
        }

        return response()->json([
            'message' => 'SMTP settings saved successfully.',
        ]);
    }

    /**
     * Test SMTP connection by sending a test email.
     */
    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'test_email' => ['required', 'email'],
        ]);

        $smtp = SmtpSetting::current();
        if (! $smtp) {
            return response()->json(['message' => 'No SMTP settings configured yet.'], 422);
        }

        try {
            config([
                'mail.mailers.dynamic_smtp' => [
                    'transport'  => 'smtp',
                    'host'       => $smtp->mail_host,
                    'port'       => $smtp->mail_port,
                    'encryption' => $smtp->mail_encryption,
                    'username'   => $smtp->mail_username,
                    'password'   => $smtp->mail_password,
                ],
                'mail.from.address' => $smtp->mail_from_address,
                'mail.from.name'    => $smtp->mail_from_name,
            ]);

            Mail::purge('dynamic_smtp');

            Mail::mailer('dynamic_smtp')->raw(
                'This is a test email from FERMs to verify your SMTP configuration is working correctly.',
                function ($message) use ($validated, $smtp) {
                    $message->to($validated['test_email'])
                            ->subject('FERMs – SMTP Test Email');
                }
            );

            return response()->json(['message' => 'Test email sent successfully!']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to send test email: ' . $e->getMessage(),
            ], 500);
        }
    }
}
