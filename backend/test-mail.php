<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

// Test email sending
try {
    $testCode = '123456';
    Mail::to('king.voeun@student.passerellesnumeriques.org')->send(new VerificationCodeMail($testCode));
    
    echo "✅ Test email sent successfully!\n";
    echo "Check your inbox for code: 123456\n";
    
} catch (Exception $e) {
    echo "❌ Email sending failed: " . $e->getMessage() . "\n";
    echo "Please check your Gmail App Password configuration\n";
}
