<?php

// Quick test script for email notifications
// Run: php test_email.php

require __DIR__ . '/capstone_backend/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone_backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SmtpSetting;
use Illuminate\Support\Facades\Mail;

echo "==============================================\n";
echo "📧 FERMs Email Configuration Test\n";
echo "==============================================\n\n";

// Check .env configuration
echo "Step 1: Checking .env configuration...\n";
echo "----------------------------------------------\n";
echo "MAIL_MAILER: " . env('MAIL_MAILER', 'not set') . "\n";
echo "MAIL_HOST: " . env('MAIL_HOST', 'not set') . "\n";
echo "MAIL_PORT: " . env('MAIL_PORT', 'not set') . "\n";
echo "MAIL_USERNAME: " . (env('MAIL_USERNAME') ? '***configured***' : 'not set') . "\n";
echo "MAIL_FROM_ADDRESS: " . env('MAIL_FROM_ADDRESS', 'not set') . "\n";
echo "\n";

// Check database SMTP settings
echo "Step 2: Checking database SMTP settings...\n";
echo "----------------------------------------------\n";
$smtp = SmtpSetting::current();

if ($smtp) {
    echo "✅ SMTP settings found in database!\n";
    echo "Host: {$smtp->mail_host}\n";
    echo "Port: {$smtp->mail_port}\n";
    echo "Username: {$smtp->mail_username}\n";
    echo "Encryption: {$smtp->mail_encryption}\n";
    echo "From Address: {$smtp->mail_from_address}\n";
    echo "From Name: {$smtp->mail_from_name}\n";
    echo "Has Password: " . (!empty($smtp->mail_password) ? 'Yes' : 'No') . "\n";
    echo "\n⚠️  Database SMTP settings will OVERRIDE .env settings!\n";
} else {
    echo "ℹ️  No SMTP settings in database.\n";
    echo "Using .env configuration.\n";
}

echo "\n";

// Determine if email is configured
echo "==============================================\n";
echo "📊 Configuration Status:\n";
echo "==============================================\n";

$isConfigured = false;
$configMethod = '';

if ($smtp && !empty($smtp->mail_password)) {
    $isConfigured = true;
    $configMethod = 'Database (Admin Panel)';
} elseif (env('MAIL_MAILER') === 'smtp' && env('MAIL_USERNAME') && env('MAIL_PASSWORD')) {
    $isConfigured = true;
    $configMethod = '.env file';
} elseif (env('MAIL_MAILER') === 'log') {
    echo "❌ EMAILS ARE NOT BEING SENT!\n";
    echo "Reason: MAIL_MAILER is set to 'log'\n";
    echo "Emails are being written to logs instead of being sent.\n";
} else {
    echo "❌ Email is NOT configured properly.\n";
}

if ($isConfigured) {
    echo "✅ Email is CONFIGURED via: $configMethod\n";
}

echo "\n";

// Ask if user wants to send test email
if ($isConfigured) {
    echo "==============================================\n";
    echo "Would you like to send a test email? (y/n): ";
    $answer = trim(fgets(STDIN));
    
    if (strtolower($answer) === 'y') {
        echo "\nEnter recipient email address: ";
        $testEmail = trim(fgets(STDIN));
        
        if (filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
            echo "\n📤 Sending test email to $testEmail...\n";
            
            try {
                if ($smtp) {
                    // Use database config
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
                        'This is a test email from FERMs! If you receive this, your email configuration is working correctly. 🎉',
                        function ($message) use ($testEmail, $smtp) {
                            $message->to($testEmail)
                                    ->subject('FERMs – Email Test');
                        }
                    );
                } else {
                    // Use .env config
                    Mail::raw(
                        'This is a test email from FERMs! If you receive this, your email configuration is working correctly. 🎉',
                        function ($message) use ($testEmail) {
                            $message->to($testEmail)
                                    ->subject('FERMs – Email Test');
                        }
                    );
                }
                
                echo "\n✅ Test email sent successfully!\n";
                echo "Check your inbox at: $testEmail\n";
                echo "\nNote: It may take a few minutes to arrive.\n";
                echo "Also check your spam/junk folder.\n";
                
            } catch (\Exception $e) {
                echo "\n❌ Failed to send email!\n";
                echo "Error: " . $e->getMessage() . "\n\n";
                
                echo "Common issues:\n";
                echo "1. Gmail App Password incorrect\n";
                echo "2. 2-Step Verification not enabled on Gmail\n";
                echo "3. Firewall blocking SMTP port 587\n";
                echo "4. Wrong SMTP credentials\n";
            }
        } else {
            echo "❌ Invalid email address.\n";
        }
    }
}

echo "\n";
echo "==============================================\n";
echo "📚 How to Configure:\n";
echo "==============================================\n";
echo "Option 1: Admin Panel (Recommended)\n";
echo "  1. Login as admin: admin@ferms.com / password\n";
echo "  2. Go to Settings > Email tab\n";
echo "  3. Fill in SMTP settings\n";
echo "  4. Use Gmail App Password from:\n";
echo "     https://myaccount.google.com/apppasswords\n";
echo "\n";
echo "Option 2: Edit .env file\n";
echo "  1. Open: capstone_backend/.env\n";
echo "  2. Change MAIL_MAILER from 'log' to 'smtp'\n";
echo "  3. Set MAIL_HOST=smtp.gmail.com\n";
echo "  4. Set MAIL_PORT=587\n";
echo "  5. Set MAIL_USERNAME and MAIL_PASSWORD\n";
echo "  6. Run: php artisan config:clear\n";
echo "\n";
echo "For full guide, see: EMAIL_NOTIFICATION_SETUP_GUIDE.md\n";
echo "==============================================\n";

