# SendGrid Email Setup 📧

## Overview
VYBE now uses SendGrid for professional email delivery with beautiful, modern email templates.

---

## Email Templates Implemented

### 1. **Welcome Email** 🎉
Sent when a user signs up via email/password.

**Features:**
- ✅ Beautiful gradient design matching VYBE brand
- ✅ Feature showcase (4 key features with icons)
- ✅ Clear CTA button to open the app
- ✅ Fully responsive HTML template
- ✅ Mobile-optimized design
- ✅ Professional footer with links

**Content Includes:**
- Personalized greeting with user's name
- Welcome message
- Feature highlights:
  - 📅 Create Events
  - 🗳️ Vote Together
  - 💬 Group Chat
  - 🗺️ Discover Venues
- Call-to-action button
- Help center link
- Social media icons
- Privacy & Terms links

### 2. **OTP Verification Email** 🔐
Sent when users request OTP for login/signup.

**Features:**
- ✅ Clean, focused design
- ✅ Large, easy-to-read OTP code
- ✅ Expiration notice (10 minutes)
- ✅ Security message
- ✅ Responsive layout

**Content:**
- 6-digit OTP code in large font
- Expiration time
- Security disclaimer

---

## Setup Instructions

### 1. Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free tier)
3. Verify your email address

### 2. Get API Key
1. Log in to SendGrid Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: "VYBE Production" (or similar)
5. Choose **Full Access** or **Restricted Access** with:
   - Mail Send: Full Access
6. Copy the API key (you won't see it again!)

### 3. Verify Sender Identity
#### Option A: Single Sender Verification (Easy)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in details:
   - From Name: `VYBE`
   - From Email: `noreply@yourdomain.com` or use SendGrid subdomain
   - Reply To: Your support email
   - Company: VYBE
   - Address: Your address
4. Check your email and verify

#### Option B: Domain Authentication (Production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions
4. Add CNAME records to your domain DNS
5. Verify domain

### 4. Add Environment Variables

Add to `.env.local` (development):
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=VYBE
```

Add to **Vercel** (production):
1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Add:
   - `SENDGRID_API_KEY` = Your SendGrid API key
   - `SENDGRID_FROM_EMAIL` = Your verified sender email
   - `SENDGRID_FROM_NAME` = VYBE
4. Redeploy your application

---

## Email Templates

### Welcome Email Preview

```
┌────────────────────────────────────────┐
│                                        │
│         🎉 VYBE Welcome Email          │
│                                        │
│  Gradient header with app icon         │
│  "Welcome to VYBE!" headline           │
│  Personalized greeting                  │
│  Feature showcase grid (4 features)    │
│  "Open VYBE App" CTA button            │
│  Help center link                       │
│  Footer with social links              │
│                                        │
└────────────────────────────────────────┘
```

### OTP Email Preview

```
┌────────────────────────────────────────┐
│                                        │
│       🔐 VYBE Verification Email        │
│                                        │
│  "Your verification code is:"          │
│                                        │
│  ┌──────────────────────────┐          │
│  │       123456             │          │
│  └──────────────────────────┘          │
│                                        │
│  "Expires in 10 minutes"               │
│  Security notice                        │
│                                        │
└────────────────────────────────────────┘
```

---

## Usage in Code

### Automatic Welcome Email
Automatically sent when user signs up:

```typescript
// In email-signup route
await sendWelcomeEmail(user.email, user.name);
```

### Automatic OTP Email
Automatically sent when user requests OTP:

```typescript
// In send-otp route
await sendOTPEmail(userEmail, otpCode);
```

---

## Development Mode

Without SendGrid API key:
- ✅ Emails are logged to console
- ✅ No actual emails sent
- ✅ No errors thrown
- ✅ Development continues smoothly

**Console Output:**
```
📧 [DEV MODE] Welcome email to test@example.com - Name: Test User
📧 [DEV MODE] OTP email to test@example.com - Code: 123456
```

---

## Testing

### Test Welcome Email
1. Sign up with a new account using email/password
2. Check your inbox (may take a few seconds)
3. Look for email from "VYBE <noreply@yourdomain.com>"
4. Subject: "🎉 Welcome to VYBE – Let's Start Planning!"

### Test OTP Email
1. Request OTP during login/signup
2. Check your inbox
3. Look for email from "VYBE <noreply@yourdomain.com>"
4. Subject: "123456 is your VYBE verification code"

### Check SendGrid Dashboard
1. Go to https://app.sendgrid.com/
2. Navigate to **Activity Feed**
3. See real-time email delivery status
4. Check:
   - ✅ Processed
   - ✅ Delivered
   - ❌ Bounced
   - ❌ Spam

---

## Email Design Features

### Modern Design Elements
- ✅ Gradient backgrounds (purple/pink/blue themes)
- ✅ Card-based layout
- ✅ Rounded corners
- ✅ Box shadows
- ✅ Emoji icons
- ✅ Feature grid with colored cards
- ✅ Professional typography
- ✅ Mobile-first responsive design

### Accessibility
- ✅ Semantic HTML
- ✅ Alt text for important elements
- ✅ High contrast text
- ✅ Readable font sizes
- ✅ Touch-friendly button sizes
- ✅ Plain text fallback included

### Brand Consistency
- ✅ VYBE color palette (purple gradients)
- ✅ Consistent typography
- ✅ Professional tone
- ✅ Modern, friendly design
- ✅ Matches mobile app aesthetic

---

## Deliverability Tips

### Improve Email Delivery
1. **Complete Sender Authentication**
   - Use domain authentication (not just single sender)
   - Add SPF, DKIM, DMARC records

2. **Warm Up Your Domain**
   - Start with low volume
   - Gradually increase over 2-4 weeks
   - Monitor bounce rates

3. **Monitor Metrics**
   - Keep bounce rate < 5%
   - Keep spam complaint rate < 0.1%
   - Maintain good sender reputation

4. **List Hygiene**
   - Remove bounced emails
   - Honor unsubscribe requests
   - Validate email addresses

5. **Content Best Practices**
   - Balance text/image ratio
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use consistent from address

---

## SendGrid Quotas

### Free Tier
- **100 emails/day** forever
- **2,000 contacts**
- Email API access
- Single sender verification

### Essentials Plan ($19.95/mo)
- **50,000 emails/month**
- **Unlimited contacts**
- Email validation
- Dedicated IP (add-on)

### Pro Plan ($89.95/mo)
- **1.5M emails/month**
- Everything in Essentials
- Subuser management
- 24/7 email & chat support

**Recommendation for Launch**: Start with Free tier, upgrade to Essentials when you reach 3,000+ users.

---

## Troubleshooting

### Emails Not Sending

**1. Check API Key**
```bash
# Test in terminal
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

**2. Check Sender Verification**
- Go to SendGrid Dashboard → Settings → Sender Authentication
- Ensure sender email is verified
- FROM_EMAIL must match verified sender

**3. Check Logs**
```bash
# Backend logs
npm run dev

# Look for:
✅ Welcome email sent to: user@example.com
❌ SendGrid error: [error details]
```

**4. Common Errors**

| Error | Solution |
|-------|----------|
| `403 Forbidden` | API key is invalid or expired |
| `401 Unauthorized` | API key not set correctly |
| `Sender email not verified` | Verify sender in SendGrid |
| `Rate limit exceeded` | Upgrade plan or wait |

---

## Files Changed

1. **Created**: `apps/web/lib/services/sendgrid.ts` - SendGrid service with email templates
2. **Updated**: `apps/web/app/api/auth/email-signup/route.ts` - Added welcome email
3. **Updated**: `apps/web/lib/services/twilio.ts` - Use SendGrid for OTP emails
4. **Created**: `apps/web/SENDGRID_SETUP.md` - This documentation

---

## Next Steps

### Additional Email Templates (Future)

1. **Password Reset**
   - Reset link with expiration
   - Security tips

2. **Event Invitations**
   - Event details
   - Accept/Decline buttons
   - Add to calendar link

3. **Event Reminders**
   - Event starting soon
   - Vote reminder
   - Finalized event details

4. **Notifications Digest**
   - Weekly summary
   - Upcoming events
   - Activity highlights

---

## Summary

✅ **SendGrid fully integrated!**
- Professional email delivery
- Beautiful, modern email templates
- Welcome email on signup
- OTP email for verification
- Development mode for testing
- Production-ready configuration

**Setup Required**:
1. Create SendGrid account
2. Get API key
3. Verify sender email
4. Add environment variables
5. Test emails

**Ready to send emails!** 📧🚀

