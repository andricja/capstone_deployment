<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; margin: 0; }
        .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .logo { text-align: center; margin-bottom: 24px; color: #16a34a; font-size: 28px; font-weight: bold; }
        h2 { color: #111827; margin-top: 0; }
        .code { display: block; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a; background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 16px; margin: 24px 0; }
        p { color: #4b5563; line-height: 1.6; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚜 FERMs</div>
        <h2>Verify Your Email</h2>
        <p>Hi {{ $userName }},</p>
        <p>Thank you for registering with FERMs! Please use the verification code below to confirm your email address:</p>
        <div class="code">{{ $code }}</div>
        <p>This code will expire in <strong>15 minutes</strong>.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <div class="footer">© {{ date('Y') }} FERMs – Farm Equipment Rental & Monitoring System</div>
    </div>
</body>
</html>
