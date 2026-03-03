<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $resetUrl)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Reset Password');
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.reset-password-text',
            with: ['resetUrl' => $this->resetUrl],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
