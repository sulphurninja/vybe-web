# Twilio Setup for SMS OTP

## Environment Variables

Add these to your `.env.local` file in the `apps/web` directory:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC...your-twilio-account-sid...
TWILIO_AUTH_TOKEN=...your-twilio-auth-token...
TWILIO_PHONE_NUMBER=+1234567890
```

## How to Get Twilio Credentials

1. **Sign up for Twilio** (Free trial available)
   - Go to: https://www.twilio.com/try-twilio
   - Sign up for a free account
   - You'll get $15 in trial credit

2. **Get your Account SID and Auth Token**
   - Go to your Twilio Console: https://console.twilio.com/
   - Find your **Account SID** and **Auth Token** on the dashboard
   - Copy these to your `.env.local` file

3. **Get a Phone Number**
   - In the Twilio Console, go to: **Phone Numbers** → **Manage** → **Buy a number**
   - Select your country
   - Choose a number with SMS capabilities
   - Buy the number (free during trial)
   - Copy the phone number to your `.env.local` file (include the + sign)

4. **Test in Development**
   - In development mode, the app will log OTP codes to the console if Twilio is not configured
   - You can test without Twilio by checking the console for the OTP code

## Twilio Trial Limitations

During the trial period:
- You can only send SMS to **verified phone numbers**
- To verify a phone number:
  1. Go to: **Phone Numbers** → **Manage** → **Verified Caller IDs**
  2. Click **Add a new number**
  3. Enter the phone number you want to test with
  4. Verify it via SMS or voice call

## Production Setup

For production:
1. Upgrade your Twilio account
2. Complete all compliance requirements
3. Remove the trial restrictions
4. Set up proper error handling and rate limiting

## Alternative: Email OTP

If you prefer email OTP over SMS:
- The system already supports email OTP
- You can implement email sending using:
  - SendGrid: https://sendgrid.com/
  - AWS SES: https://aws.amazon.com/ses/
  - Mailgun: https://www.mailgun.com/

Update `apps/web/lib/services/twilio.ts` with your email service implementation.

## Development Mode

In development (`NODE_ENV=development`):
- OTP codes are logged to the console
- You can test without configuring Twilio
- The mobile app will receive the OTP code in the response (for dev only)






