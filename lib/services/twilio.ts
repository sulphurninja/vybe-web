// Twilio SMS service for OTP
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(to: string, message: string): Promise<boolean> {
  // In development, skip actual SMS sending and just log
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_SMS === 'true') {
    console.log('📱 [DEV MODE] SMS to', to, ':', message);
    return true;
  }
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('❌ Twilio credentials not configured');
    throw new Error('Twilio not configured');
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Twilio SMS error:', error);
      throw new Error(error.message || 'Failed to send SMS');
    }

    const data = await response.json();
    console.log('✅ SMS sent successfully:', data.sid);
    return true;
  } catch (error: any) {
    console.error('❌ Twilio error:', error);
    throw error;
  }
}

export async function sendOTPSMS(to: string, code: string): Promise<boolean> {
  const message = `Your VYBE verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nDon't share this code with anyone.`;
  return sendSMS(to, message);
}

// Email sending - now using SendGrid
export async function sendOTPEmail(to: string, code: string): Promise<boolean> {
  // Import SendGrid service
  const { sendOTPEmail: sendGridOTP } = await import('./sendgrid');
  return sendGridOTP(to, code);
}





