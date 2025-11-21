import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import OTP from "@/lib/services/models/OTP";
import User from "@/lib/services/models/User";
import { sendOTPSMS, sendOTPEmail } from "@/lib/services/twilio";

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  await db();
  
  try {
    const { phoneOrEmail, type } = await req.json();

    if (!phoneOrEmail || !type) {
      return NextResponse.json(
        { error: 'Phone/email and type are required' },
        { status: 400 }
      );
    }

    // Validate format
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(phoneOrEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    } else if (type === 'phone') {
      // Remove spaces, dashes, and ensure it starts with +
      const cleanPhone = phoneOrEmail.replace(/[\s-]/g, '');
      if (!cleanPhone.startsWith('+')) {
        return NextResponse.json(
          { error: 'Phone must start with country code (e.g., +1)' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = type === 'email' 
      ? await User.findOne({ email: phoneOrEmail })
      : await User.findOne({ phone: phoneOrEmail });

    // For signup, reject if user exists
    // For login, allow if user exists
    // (We'll use purpose field to differentiate)

    // Delete any existing unverified OTPs for this contact
    await OTP.deleteMany({ 
      phoneOrEmail, 
      verified: false 
    });

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const otp = await OTP.create({
      phoneOrEmail,
      type,
      code,
      expiresAt,
      purpose: existingUser ? 'login' : 'signup',
    });

    // Send OTP
    try {
      if (type === 'phone') {
        await sendOTPSMS(phoneOrEmail, code);
      } else {
        await sendOTPEmail(phoneOrEmail, code);
      }
    } catch (smsError: any) {
      console.error('Failed to send OTP:', smsError);
      // Delete the OTP if we couldn't send it
      await OTP.findByIdAndDelete(otp._id);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`✅ OTP sent to ${phoneOrEmail} (${type}):`, code);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${type === 'phone' ? 'your phone' : 'your email'}`,
      expiresIn: 600, // seconds
      // In development, include the code for testing
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}


































