<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; margin: 0; }
        .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .logo { text-align: center; margin-bottom: 24px; color: #16a34a; font-size: 28px; font-weight: bold; }
        h2 { color: #16a34a; margin-top: 0; }
        p { color: #4b5563; line-height: 1.6; }
        .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 8px 20px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 16px 0; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚜 FERMs</div>
        <h2>Account Approved! ✅</h2>
        <p>Hi {{ $userName }},</p>
        <p>Great news! Your FERMs account has been <strong>approved</strong> by the administrator.</p>
        <div class="badge">✓ Account Active</div>
        <p>You can now log in and start using the system. Welcome aboard!</p>
        <p>Thank you for joining FERMs.</p>
        <div class="footer">© {{ date('Y') }} FERMs – Farm Equipment Rental & Monitoring System</div>
    </div>
</body>
</html>
