<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset - Prey Lang Coffee</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #6F4E37;
            margin-bottom: 20px;
        }
        .token-box {
            background: #fff;
            border: 2px dashed #6F4E37;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .token {
            font-size: 36px;
            font-weight: bold;
            color: #6F4E37;
            letter-spacing: 5px;
        }
        .warning {
            color: #d9534f;
            font-size: 14px;
            margin-top: 15px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">☕ Prey Lang Coffee</div>
        
        <h2>Password Reset Verification</h2>
        
        <p>Hello {{ $userName }},</p>
        
        <p>We received a request to reset your PIN. Use the verification code below:</p>
        
        <div class="token-box">
            <div class="token">{{ $token }}</div>
        </div>
        
        <p class="warning">⚠️ This code expires in {{ $expiresIn }} seconds. Please use it immediately.</p>
        
        <p>If you did not request a password reset, please ignore this email.</p>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} Prey Lang Coffee. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
