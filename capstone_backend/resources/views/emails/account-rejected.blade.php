<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; margin: 0; }
        .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .logo { text-align: center; margin-bottom: 24px; color: #16a34a; font-size: 28px; font-weight: bold; }
        h2 { color: #dc2626; margin-top: 0; }
        p { color: #4b5563; line-height: 1.6; }
        .reason { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #991b1b; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚜 FERMs</div>
        <h2>Account Not Approved</h2>
        <p>Hi {{ $userName }},</p>
        <p>We regret to inform you that your FERMs account registration has not been approved at this time.</p>
        @if($reason)
        <div class="reason">
            <strong>Reason:</strong> {{ $reason }}
        </div>
        @endif
        <p>If you believe this was a mistake, please contact the administrator or try registering again with the correct information.</p>
        <p>Thank you for your interest in FERMs.</p>
        <div class="footer">© {{ date('Y') }} FERMs – Farm Equipment Rental & Monitoring System</div>
    </div>
</body>
</html>
