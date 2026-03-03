<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Daily Grind - Verification Code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .code-container {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            color: #ff6b35;
            letter-spacing: 4px;
            margin: 0;
        }
        .info {
            background: #e8f5e8;
            border-left: 4px solid #48bb78;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">☕ The Daily Grind</div>
            <h1>Password Reset Verification</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your The Daily Grind account. Use the verification code below to proceed:</p>
            
            <div class="code-container">
                <div class="verification-code">{{ $verificationCode }}</div>
            </div>
            
            <div class="info">
                <strong>⏰ This code expires in {{ $expiryMinutes }} minutes</strong><br>
                <strong>🔒 For your security, never share this code with anyone</strong><br>
                <strong>📧 If you didn't request this, please ignore this email</strong>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2024 The Daily Grind Cafe Group</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
