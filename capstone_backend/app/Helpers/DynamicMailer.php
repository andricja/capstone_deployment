<?php

namespace App\Helpers;

use App\Models\SmtpSetting;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Transport\Dsn;
use Symfony\Component\Mailer\Bridge\Google\Transport\GmailTransportFactory;

class DynamicMailer
{
    /**
     * Send a mailable using SMTP settings stored in the database.
     * Falls back to the default mailer if no DB settings exist.
     */
    public static function send(Mailable $mailable, string $to): void
    {
        $smtp = SmtpSetting::current();

        if (! $smtp) {
            // Fallback to default .env config
            Mail::to($to)->send($mailable);
            return;
        }

        // Dynamically configure the SMTP transport
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

        // Purge cached mailer so it picks up the new config
        Mail::purge('dynamic_smtp');

        Mail::mailer('dynamic_smtp')->to($to)->send($mailable);
    }
}
