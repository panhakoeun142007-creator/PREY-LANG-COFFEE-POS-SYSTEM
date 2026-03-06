<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $verificationCode;
    public string $purpose;

    public function __construct(string $verificationCode, string $purpose = 'verification')
    {
        $this->verificationCode = $verificationCode;
        $this->purpose = $purpose;
    }

    public function envelope(): Envelope
    {
        $subject = $this->purpose === 'password_reset' 
            ? 'Prey Lang Coffee - Password Reset Code'
            : 'Prey Lang Coffee - Verification Code';
        
        return new Envelope(
            from: new Address(
                config('mail.from.address', 'noreply@preylang.com'),
                config('mail.from.name', 'Prey Lang Coffee')
            ),
            subject: $subject
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verification-code',
            with: [
                'verificationCode' => $this->verificationCode,
                'expiryMinutes' => 5,
                'purpose' => $this->purpose,
            ]
        );
    }
}
