import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@vybe.app';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'VYBE';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️ SendGrid API key not configured');
}

// Welcome email template
export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  // If SendGrid is not configured, log warning but continue
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY not configured - email will not be sent');
    console.log('📧 Would send welcome email to:', to, '- Name:', userName);
    return false;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VYBE!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center;">
              <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 40px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <span style="font-size: 48px;">🎉</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Welcome to VYBE!</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Your journey to amazing events starts here</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="margin: 0 0 24px; color: #1a202c; font-size: 18px; font-weight: 600; line-height: 1.6;">
                Hey ${userName}! 👋
              </p>
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We're thrilled to have you join VYBE – the smartest way to plan events with friends!
              </p>
              <p style="margin: 0 0 32px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                With VYBE, you can create events, invite friends, vote on venues and times, and make group decisions effortlessly. No more endless group chats! 🙌
              </p>

              <!-- Features Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td width="50%" style="padding-right: 12px; padding-bottom: 24px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 16px; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
                      <h3 style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 700;">Create Events</h3>
                      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px;">Plan anything from dinners to parties</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 12px; padding-bottom: 24px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 24px; border-radius: 16px; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 8px;">🗳️</div>
                      <h3 style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 700;">Vote Together</h3>
                      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px;">Everyone gets a say in the plan</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding-right: 12px;">
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 24px; border-radius: 16px; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
                      <h3 style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 700;">Group Chat</h3>
                      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px;">Stay connected with your crew</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 12px;">
                    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 24px; border-radius: 16px; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 8px;">🗺️</div>
                      <h3 style="margin: 0 0 8px; color: #ffffff; font-size: 16px; font-weight: 700;">Discover Venues</h3>
                      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px;">Find the perfect spot nearby</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <a href="https://vybetest.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Open VYBE App
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                Need help getting started? Check out our 
                <a href="https://vybetest.vercel.app/help" style="color: #667eea; text-decoration: none; font-weight: 600;">Help Center</a>
                or reach out to us anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f7f8fa; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; color: #1a202c; font-size: 14px; font-weight: 600;">
                Happy planning! 🎊
              </p>
              <p style="margin: 0 0 16px; color: #718096; font-size: 13px;">
                The VYBE Team
              </p>
              <div style="margin-bottom: 16px;">
                <a href="#" style="display: inline-block; margin: 0 8px; color: #667eea; font-size: 24px; text-decoration: none;">📱</a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #667eea; font-size: 24px; text-decoration: none;">🌐</a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #667eea; font-size: 24px; text-decoration: none;">✉️</a>
              </div>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © 2025 VYBE. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #a0aec0; font-size: 11px;">
                <a href="https://vybetest.vercel.app/privacy" style="color: #a0aec0; text-decoration: none;">Privacy Policy</a>
                &nbsp;•&nbsp;
                <a href="https://vybetest.vercel.app/terms" style="color: #a0aec0; text-decoration: none;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
Welcome to VYBE, ${userName}!

We're thrilled to have you join VYBE – the smartest way to plan events with friends!

With VYBE, you can:
• Create events and invite friends
• Vote on venues and times together
• Chat with your group
• Discover amazing venues nearby

Get started now: https://vybetest.vercel.app

Need help? Visit our Help Center: https://vybetest.vercel.app/help

Happy planning! 🎊
The VYBE Team

© 2025 VYBE. All rights reserved.
  `;

  try {
    await sgMail.send({
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: '🎉 Welcome to VYBE – Let\'s Start Planning!',
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ Welcome email sent to:', to);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid error:', error.response?.body || error);
    // Don't throw error, just log it
    return false;
  }
}

// OTP email template
export async function sendOTPEmail(to: string, code: string): Promise<boolean> {
  // If SendGrid is not configured, log warning but continue
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY not configured - email will not be sent');
    console.log('📧 Would send OTP email to:', to, '- Code:', code);
    return false;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your VYBE Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7f8fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">VYBE Verification</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1a202c; font-size: 16px; line-height: 1.6;">
                Your verification code is:
              </p>

              <!-- OTP Code -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>

              <p style="margin: 0 0 16px; color: #4a5568; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="margin: 0; color: #718096; font-size: 13px; line-height: 1.6;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f7f8fa; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                © 2025 VYBE. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
Your VYBE verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

© 2025 VYBE. All rights reserved.
  `;

  try {
    await sgMail.send({
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `${code} is your VYBE verification code`,
      text: textContent,
      html: htmlContent,
    });

    console.log('✅ OTP email sent to:', to);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid error:', error.response?.body || error);
    return false;
  }
}

