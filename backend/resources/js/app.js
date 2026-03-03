import './bootstrap';
import nodemailer from 'nodemailer';

// Generate random 6-digit code
function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification code (in-memory for demo - use database in production)
const verificationCodes = new Map();

async function storeVerificationCode(email, code) {
  verificationCodes.set(email.toLowerCase(), {
    code: code,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
}

// Email transporter setup using Gmail
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your Gmail
    pass: 'your-app-password'   // Use App Password, not regular password
  }
});

// Send email function
async function sendEmail(toEmail, message) {
  try {
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: toEmail,
      subject: 'The Daily Grind - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">The Daily Grind - Password Reset</h2>
          <p style="font-size: 16px; color: #333;">${message}</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #ff6b35; text-align: center; letter-spacing: 3px;">
              ${message.match(/\d+/)?.[0] || 'XXXXXX'}
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">
            This code will expire in 5 minutes.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// API endpoint to send reset link
app.post('/api/send-reset-link', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const code = generateRandomCode();
  
  try {
    // Store code in memory (use database in production)
    await storeVerificationCode(email, code);
    
    // Send actual email
    const emailSent = await sendEmail(email, `Your verification code is: ${code}`);
    
    if (emailSent) {
      console.log(`Verification code ${code} sent to ${email}`);
      res.json({ 
        success: true, 
        message: 'Verification code sent successfully',
        // For development: return code in response (remove in production)
        devCode: process.env.NODE_ENV === 'development' ? code : null 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send email' 
      });
    }
  } catch (error) {
    console.error('Error in send-reset-link:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// API endpoint to verify code
app.post('/api/verify-code', async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email and code are required' });
  }

  const storedData = verificationCodes.get(email.toLowerCase());
  
  if (!storedData) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }

  if (Date.now() > storedData.expires) {
    verificationCodes.delete(email.toLowerCase());
    return res.status(400).json({ success: false, message: 'Code has expired' });
  }

  if (storedData.code !== code) {
    return res.status(400).json({ success: false, message: 'Invalid verification code' });
  }

  // Code is valid - remove it
  verificationCodes.delete(email.toLowerCase());
  
  res.json({ 
    success: true, 
    message: 'Code verified successfully' 
  });
});